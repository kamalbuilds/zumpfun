/**
 * Starknet Event Indexer
 * Real-time event listener and indexer for Ztarknet contracts
 */

import { query, transaction } from '../db/index.js';
import starknetClient from '../starknet/client.js';
import config from '../config.js';
import logger from '../utils/logger.js';

export interface IndexedEvent {
  event_name: string;
  contract_address: string;
  block_number: number;
  transaction_hash: string;
  event_index: number;
  event_data: any;
}

// Event handlers mapping
type EventHandler = (event: IndexedEvent) => Promise<void>;

const eventHandlers: Map<string, EventHandler> = new Map();

/**
 * Register event handler
 */
export function registerEventHandler(
  eventName: string,
  handler: EventHandler
): void {
  eventHandlers.set(eventName, handler);
  logger.info('Event handler registered', { eventName });
}

/**
 * Launch Created Event Handler
 */
registerEventHandler('LaunchCreated', async (event: IndexedEvent) => {
  const { token_address, creator_commitment, total_supply, bonding_curve } =
    event.event_data;

  await query(
    `INSERT INTO launches (
      token_address,
      creator_commitment,
      name,
      symbol,
      total_supply,
      bonding_curve_type,
      base_price,
      slope,
      k_param,
      max_price,
      graduation_threshold,
      created_at,
      metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
    ON CONFLICT (token_address) DO NOTHING`,
    [
      token_address,
      creator_commitment,
      bonding_curve.name || 'Unnamed Token',
      bonding_curve.symbol || 'MEME',
      total_supply,
      bonding_curve.curve_type || 'sigmoid',
      bonding_curve.base_price,
      bonding_curve.slope,
      bonding_curve.k_param,
      bonding_curve.max_price,
      bonding_curve.graduation_threshold,
      JSON.stringify({ block_number: event.block_number }),
    ]
  );

  logger.info('Launch indexed', { token_address });
});

/**
 * Contribution Made Event Handler
 */
registerEventHandler('ContributionMade', async (event: IndexedEvent) => {
  const {
    launch_id,
    commitment,
    nullifier,
    amount_commitment,
    contribution_type,
  } = event.event_data;

  await transaction(async (client) => {
    // Insert contribution
    await client.query(
      `INSERT INTO contributions (
        launch_id,
        commitment,
        nullifier,
        amount_commitment,
        contribution_type,
        block_number,
        transaction_hash,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (nullifier) DO NOTHING`,
      [
        launch_id,
        commitment,
        nullifier,
        amount_commitment,
        contribution_type,
        event.block_number,
        event.transaction_hash,
      ]
    );

    // Update launch statistics
    await client.query(
      `UPDATE launches
       SET total_raised = total_raised + $1,
           tokens_sold = tokens_sold + $2
       WHERE id = $3`,
      [
        contribution_type === 'buy' ? BigInt(amount_commitment) : 0,
        contribution_type === 'buy' ? BigInt(amount_commitment) : 0,
        launch_id,
      ]
    );
  });

  logger.info('Contribution indexed', { nullifier });
});

/**
 * AMM Graduated Event Handler
 */
registerEventHandler('AMMGraduated', async (event: IndexedEvent) => {
  const { token_address, amm_address, total_liquidity } = event.event_data;

  await query(
    `UPDATE launches
     SET status = 'graduated',
         amm_address = $1,
         graduated_at = NOW(),
         metadata = jsonb_set(
           COALESCE(metadata, '{}'::jsonb),
           '{graduation_liquidity}',
           $2::text::jsonb
         )
     WHERE token_address = $3`,
    [amm_address, total_liquidity, token_address]
  );

  logger.info('AMM graduation indexed', { token_address, amm_address });
});

/**
 * Proof Verified Event Handler
 */
registerEventHandler('ProofVerified', async (event: IndexedEvent) => {
  const { proof_hash, circuit_type, verified, gas_used } = event.event_data;

  await query(
    `INSERT INTO proofs (
      proof_hash,
      circuit_type,
      public_inputs,
      verification_status,
      verified_at,
      gas_used,
      transaction_hash
    ) VALUES ($1, $2, $3, $4, NOW(), $5, $6)
    ON CONFLICT (proof_hash) DO UPDATE
    SET verification_status = $4,
        verified_at = NOW(),
        gas_used = $5`,
    [
      proof_hash,
      circuit_type,
      JSON.stringify(event.event_data.public_inputs || {}),
      verified ? 'verified' : 'failed',
      gas_used,
      event.transaction_hash,
    ]
  );

  logger.info('Proof verification indexed', { proof_hash, verified });
});

/**
 * Index event into database
 */
async function indexEvent(event: IndexedEvent): Promise<void> {
  try {
    // Store raw event
    await query(
      `INSERT INTO events (
        event_name,
        contract_address,
        block_number,
        transaction_hash,
        event_index,
        event_data,
        indexed,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (transaction_hash, event_index) DO NOTHING`,
      [
        event.event_name,
        event.contract_address,
        event.block_number,
        event.transaction_hash,
        event.event_index,
        JSON.stringify(event.event_data),
        true,
      ]
    );

    // Process with handler if registered
    const handler = eventHandlers.get(event.event_name);
    if (handler) {
      await handler(event);
    } else {
      logger.warn('No handler for event', { eventName: event.event_name });
    }
  } catch (error) {
    logger.error('Failed to index event:', { event, error });
    throw error;
  }
}

/**
 * Get last indexed block
 */
async function getLastIndexedBlock(): Promise<number> {
  const result = await query<{ last_indexed_block: number }>(
    'SELECT last_indexed_block FROM indexer_state WHERE id = 1'
  );

  return result[0]?.last_indexed_block || config.indexer.startBlock;
}

/**
 * Update last indexed block
 */
async function updateLastIndexedBlock(blockNumber: number): Promise<void> {
  await query(
    `UPDATE indexer_state
     SET last_indexed_block = $1,
         last_update = NOW(),
         status = 'running'
     WHERE id = 1`,
    [blockNumber]
  );
}

/**
 * Main indexer loop
 */
export async function startIndexer(): Promise<void> {
  if (!config.indexer.enabled) {
    logger.info('Indexer is disabled');
    return;
  }

  logger.info('Starting event indexer...', {
    pollInterval: config.indexer.pollInterval,
    batchSize: config.indexer.batchSize,
  });

  let isRunning = true;

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('Indexer shutting down...');
    isRunning = false;
  });

  while (isRunning) {
    try {
      const lastBlock = await getLastIndexedBlock();
      const currentBlock = await starknetClient.getBlockNumber();

      if (lastBlock >= currentBlock) {
        // No new blocks, wait
        await new Promise((resolve) =>
          setTimeout(resolve, config.indexer.pollInterval)
        );
        continue;
      }

      // Process blocks in batches
      const endBlock = Math.min(
        lastBlock + config.indexer.batchSize,
        currentBlock
      );

      logger.info('Indexing blocks', {
        from: lastBlock + 1,
        to: endBlock,
      });

      // Fetch events from all contracts
      const contracts = [
        config.starknet.contractAddresses.launchpadFactory,
        config.starknet.contractAddresses.privacyPool,
      ];

      for (const contractAddress of contracts) {
        if (contractAddress === '0x0') continue;

        const eventNames = [
          'LaunchCreated',
          'ContributionMade',
          'AMMGraduated',
          'ProofVerified',
        ];

        for (const eventName of eventNames) {
          const events = await starknetClient.getEvents(
            contractAddress,
            eventName,
            lastBlock + 1,
            endBlock
          );

          for (const [index, event] of events.entries()) {
            await indexEvent({
              event_name: eventName,
              contract_address: contractAddress,
              block_number: event.blockNumber,
              transaction_hash: event.transactionHash,
              event_index: index,
              event_data: event.data,
            });
          }
        }
      }

      // Update checkpoint
      await updateLastIndexedBlock(endBlock);

      logger.info('Indexed blocks', {
        from: lastBlock + 1,
        to: endBlock,
        eventsProcessed: endBlock - lastBlock,
      });
    } catch (error) {
      logger.error('Indexer error:', { error });

      // Mark as error state
      await query(
        `UPDATE indexer_state
         SET status = 'error',
             error_message = $1
         WHERE id = 1`,
        [error instanceof Error ? error.message : String(error)]
      );

      // Wait before retry
      await new Promise((resolve) =>
        setTimeout(resolve, config.indexer.pollInterval * 2)
      );
    }
  }

  logger.info('Indexer stopped');
}

export default { startIndexer, registerEventHandler };
