/**
 * Configuration Management
 * Environment-based configuration for all services
 */

import dotenv from 'dotenv';

dotenv.config();

interface Config {
  env: string;
  port: number;

  // Starknet Configuration
  starknet: {
    network: string;
    rpcUrl: string;
    contractAddresses: {
      launchpadFactory: string;
      garagaVerifier: string;
      privacyPool: string;
    };
  };

  // Database Configuration
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    maxConnections: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };

  // Redis Configuration
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
  };

  // WebSocket Configuration
  websocket: {
    enabled: boolean;
    port: number;
    path: string;
  };

  // API Configuration
  api: {
    prefix: string;
    version: string;
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
  };

  // Indexer Configuration
  indexer: {
    enabled: boolean;
    pollInterval: number;
    startBlock: number;
    batchSize: number;
  };

  // Logging Configuration
  logging: {
    level: string;
    format: string;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  starknet: {
    network: process.env.STARKNET_NETWORK || 'sepolia',
    rpcUrl: process.env.STARKNET_RPC_URL || 'http://localhost:5050',
    contractAddresses: {
      launchpadFactory: process.env.CONTRACT_LAUNCHPAD_FACTORY || '0x0',
      garagaVerifier: process.env.CONTRACT_GARAGA_VERIFIER || '0x0',
      privacyPool: process.env.CONTRACT_PRIVACY_POOL || '0x0',
    },
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'zumpfun',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: 'zumpfun:',
  },

  websocket: {
    enabled: process.env.WS_ENABLED === 'true',
    port: parseInt(process.env.WS_PORT || '3001', 10),
    path: process.env.WS_PATH || '/ws',
  },

  api: {
    prefix: '/api',
    version: 'v1',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
  },

  indexer: {
    enabled: process.env.INDEXER_ENABLED === 'true',
    pollInterval: parseInt(process.env.INDEXER_POLL_INTERVAL || '5000', 10),
    startBlock: parseInt(process.env.INDEXER_START_BLOCK || '0', 10),
    batchSize: parseInt(process.env.INDEXER_BATCH_SIZE || '100', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

// Validate required configuration
const validateConfig = (): void => {
  const requiredEnvVars = [
    'STARKNET_RPC_URL',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
  ];

  const missing = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missing.length > 0 && config.env === 'production') {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

validateConfig();

export default config;
