-- ZumpFun Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable TimescaleDB for time-series data
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================================
-- LAUNCHES TABLE
-- Tracks all token launches on the platform
-- ============================================================
CREATE TABLE IF NOT EXISTS launches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_address VARCHAR(66) UNIQUE NOT NULL,
    creator_commitment VARCHAR(66) NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    total_supply NUMERIC(78, 0) NOT NULL,
    bonding_curve_type VARCHAR(20) NOT NULL CHECK (bonding_curve_type IN ('linear', 'exponential', 'sigmoid')),
    base_price NUMERIC(78, 0) NOT NULL,
    slope NUMERIC(78, 0),
    k_param NUMERIC(78, 0),
    max_price NUMERIC(78, 0),
    graduation_threshold NUMERIC(78, 0) NOT NULL,
    total_raised NUMERIC(78, 0) DEFAULT 0,
    tokens_sold NUMERIC(78, 0) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'closed')),
    amm_address VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graduated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Indexes for launches
CREATE INDEX idx_launches_token_address ON launches(token_address);
CREATE INDEX idx_launches_status ON launches(status);
CREATE INDEX idx_launches_created_at ON launches(created_at DESC);
CREATE INDEX idx_launches_metadata ON launches USING GIN(metadata);

-- ============================================================
-- CONTRIBUTIONS TABLE
-- Tracks private contributions (nullifier-based)
-- ============================================================
CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    launch_id UUID NOT NULL REFERENCES launches(id) ON DELETE CASCADE,
    commitment VARCHAR(66) NOT NULL,
    nullifier VARCHAR(66) UNIQUE NOT NULL,
    amount_commitment VARCHAR(66) NOT NULL,
    contribution_type VARCHAR(10) NOT NULL CHECK (contribution_type IN ('buy', 'sell')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    metadata JSONB
);

-- Indexes for contributions
CREATE INDEX idx_contributions_launch_id ON contributions(launch_id);
CREATE INDEX idx_contributions_nullifier ON contributions(nullifier);
CREATE INDEX idx_contributions_timestamp ON contributions(timestamp DESC);
CREATE INDEX idx_contributions_tx_hash ON contributions(transaction_hash);

-- ============================================================
-- MARKET_DATA TABLE
-- Real-time and historical market data (time-series)
-- ============================================================
CREATE TABLE IF NOT EXISTS market_data (
    id BIGSERIAL,
    token_address VARCHAR(66) NOT NULL,
    current_price NUMERIC(78, 0) NOT NULL,
    price_change_24h NUMERIC(10, 4),
    total_raised NUMERIC(78, 0) NOT NULL,
    tokens_sold NUMERIC(78, 0) NOT NULL,
    volume_24h NUMERIC(78, 0),
    market_cap NUMERIC(78, 0),
    holder_count INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, timestamp)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('market_data', 'timestamp', if_not_exists => TRUE);

-- Indexes for market_data
CREATE INDEX idx_market_data_token ON market_data(token_address, timestamp DESC);
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp DESC);

-- ============================================================
-- PROOFS TABLE
-- Verification log for ZK proofs
-- ============================================================
CREATE TABLE IF NOT EXISTS proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proof_hash VARCHAR(66) UNIQUE NOT NULL,
    circuit_type VARCHAR(50) NOT NULL,
    public_inputs JSONB NOT NULL,
    verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verified_at TIMESTAMP WITH TIME ZONE,
    gas_used BIGINT,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for proofs
CREATE INDEX idx_proofs_hash ON proofs(proof_hash);
CREATE INDEX idx_proofs_status ON proofs(verification_status);
CREATE INDEX idx_proofs_created_at ON proofs(created_at DESC);

-- ============================================================
-- EVENTS TABLE
-- Event log from Starknet contracts
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    contract_address VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    event_index INTEGER NOT NULL,
    event_data JSONB NOT NULL,
    indexed BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(transaction_hash, event_index)
);

-- Indexes for events
CREATE INDEX idx_events_block_number ON events(block_number DESC);
CREATE INDEX idx_events_contract ON events(contract_address);
CREATE INDEX idx_events_name ON events(event_name);
CREATE INDEX idx_events_indexed ON events(indexed) WHERE indexed = FALSE;

-- ============================================================
-- INDEXER_STATE TABLE
-- Tracks indexer progress
-- ============================================================
CREATE TABLE IF NOT EXISTS indexer_state (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    last_indexed_block BIGINT NOT NULL DEFAULT 0,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'error')),
    error_message TEXT
);

-- Insert initial state
INSERT INTO indexer_state (last_indexed_block) VALUES (0) ON CONFLICT DO NOTHING;

-- ============================================================
-- VIEWS
-- ============================================================

-- Active launches view
CREATE OR REPLACE VIEW active_launches AS
SELECT
    l.*,
    md.current_price,
    md.price_change_24h,
    md.volume_24h,
    md.holder_count
FROM launches l
LEFT JOIN LATERAL (
    SELECT * FROM market_data
    WHERE token_address = l.token_address
    ORDER BY timestamp DESC
    LIMIT 1
) md ON TRUE
WHERE l.status = 'active'
ORDER BY l.created_at DESC;

-- Trending tokens view (24h volume)
CREATE OR REPLACE VIEW trending_tokens AS
SELECT
    l.token_address,
    l.name,
    l.symbol,
    md.current_price,
    md.volume_24h,
    md.price_change_24h,
    md.holder_count
FROM launches l
LEFT JOIN LATERAL (
    SELECT * FROM market_data
    WHERE token_address = l.token_address
    ORDER BY timestamp DESC
    LIMIT 1
) md ON TRUE
WHERE l.status = 'active'
ORDER BY md.volume_24h DESC NULLS LAST
LIMIT 50;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Update market data function
CREATE OR REPLACE FUNCTION update_market_data(
    p_token_address VARCHAR(66),
    p_current_price NUMERIC(78, 0),
    p_total_raised NUMERIC(78, 0),
    p_tokens_sold NUMERIC(78, 0)
) RETURNS VOID AS $$
BEGIN
    -- Calculate 24h metrics
    INSERT INTO market_data (
        token_address,
        current_price,
        total_raised,
        tokens_sold,
        price_change_24h,
        volume_24h
    )
    SELECT
        p_token_address,
        p_current_price,
        p_total_raised,
        p_tokens_sold,
        CASE
            WHEN prev.current_price > 0
            THEN ((p_current_price - prev.current_price)::NUMERIC / prev.current_price) * 100
            ELSE 0
        END,
        p_total_raised - COALESCE(prev.total_raised, 0)
    FROM (
        SELECT current_price, total_raised
        FROM market_data
        WHERE token_address = p_token_address
        AND timestamp > NOW() - INTERVAL '24 hours'
        ORDER BY timestamp DESC
        LIMIT 1
    ) prev;
END;
$$ LANGUAGE plpgsql;

-- Get token price history
CREATE OR REPLACE FUNCTION get_price_history(
    p_token_address VARCHAR(66),
    p_interval TEXT DEFAULT '1 hour',
    p_duration TEXT DEFAULT '24 hours'
) RETURNS TABLE (
    timestamp TIMESTAMP WITH TIME ZONE,
    price NUMERIC(78, 0),
    volume NUMERIC(78, 0)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        time_bucket(p_interval::INTERVAL, md.timestamp) as bucket,
        AVG(md.current_price) as avg_price,
        SUM(md.volume_24h) as total_volume
    FROM market_data md
    WHERE md.token_address = p_token_address
    AND md.timestamp > NOW() - p_duration::INTERVAL
    GROUP BY bucket
    ORDER BY bucket DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update indexer state timestamp
CREATE OR REPLACE FUNCTION update_indexer_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_update = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_indexer_state
BEFORE UPDATE ON indexer_state
FOR EACH ROW
EXECUTE FUNCTION update_indexer_state_timestamp();
