/**
 * Starknet Client
 * Integration with Starknet/Ztarknet using starknet.js
 */

import { Provider, Contract, RpcProvider, constants } from 'starknet';
import config from '../config.js';
import logger from '../utils/logger.js';

// Initialize provider
const provider = new RpcProvider({
  nodeUrl: config.starknet.rpcUrl,
});

// Contract interfaces
export interface LaunchpadFactoryInterface {
  create_token: (
    name: string,
    symbol: string,
    initial_supply: bigint,
    bonding_curve_params: any,
    creator_proof: bigint[]
  ) => Promise<any>;
  get_token_count: () => Promise<bigint>;
}

export interface TokenLaunchpadInterface {
  buy_tokens: (
    payment_proof: bigint[],
    amount_commitment: bigint
  ) => Promise<any>;
  sell_tokens: (
    sell_proof: bigint[],
    amount_commitment: bigint,
    nullifier: bigint
  ) => Promise<any>;
  get_bonding_curve_price: (amount: bigint) => Promise<bigint>;
  graduate_to_amm: () => Promise<any>;
}

class StarknetClient {
  private provider: Provider;
  private contracts: Map<string, Contract>;

  constructor() {
    this.provider = provider;
    this.contracts = new Map();

    logger.info('Starknet client initialized', {
      network: config.starknet.network,
      rpcUrl: config.starknet.rpcUrl,
    });
  }

  /**
   * Load contract instance
   */
  async loadContract(address: string, abi: any[]): Promise<Contract> {
    if (this.contracts.has(address)) {
      return this.contracts.get(address)!;
    }

    const contract = new Contract(abi, address, this.provider);
    this.contracts.set(address, contract);

    return contract;
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    try {
      const block = await this.provider.getBlock('latest');
      return block.block_number;
    } catch (error) {
      logger.error('Failed to get block number:', { error });
      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      logger.error('Failed to get transaction receipt:', { txHash, error });
      throw error;
    }
  }

  /**
   * Get events from contract
   */
  async getEvents(
    contractAddress: string,
    eventName: string,
    fromBlock: number,
    toBlock: number = 'latest' as any
  ): Promise<any[]> {
    try {
      // Note: starknet.js doesn't have a direct getEvents method
      // We need to query blocks and parse events manually
      const events: any[] = [];

      const latestBlock = toBlock === 'latest'
        ? await this.getBlockNumber()
        : toBlock;

      // Process blocks in chunks
      const chunkSize = config.indexer.batchSize;

      for (let block = fromBlock; block <= latestBlock; block += chunkSize) {
        const endBlock = Math.min(block + chunkSize - 1, latestBlock);

        // Get block with transactions
        for (let i = block; i <= endBlock; i++) {
          const blockWithTxs = await this.provider.getBlock(i);

          // Filter transactions for our contract
          if (blockWithTxs.transactions) {
            for (const tx of blockWithTxs.transactions as any[]) {
              if (tx.contract_address === contractAddress) {
                const receipt = await this.getTransactionReceipt(tx.transaction_hash);

                // Extract events from receipt
                if (receipt.events) {
                  const filteredEvents = receipt.events.filter(
                    (e: any) => e.keys && e.keys[0] === eventName
                  );

                  events.push(...filteredEvents.map((e: any) => ({
                    ...e,
                    blockNumber: i,
                    transactionHash: tx.transaction_hash,
                  })));
                }
              }
            }
          }
        }
      }

      return events;
    } catch (error) {
      logger.error('Failed to get events:', {
        contractAddress,
        eventName,
        fromBlock,
        toBlock,
        error,
      });
      throw error;
    }
  }

  /**
   * Call contract view function
   */
  async callContract(
    contractAddress: string,
    abi: any[],
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    try {
      const contract = await this.loadContract(contractAddress, abi);
      const result = await contract.call(functionName, args);

      return result;
    } catch (error) {
      logger.error('Contract call failed:', {
        contractAddress,
        functionName,
        args,
        error,
      });
      throw error;
    }
  }

  /**
   * Estimate fee for transaction
   */
  async estimateFee(
    contractAddress: string,
    functionName: string,
    args: any[]
  ): Promise<bigint> {
    try {
      // This is a placeholder - actual implementation depends on account abstraction
      return BigInt(0);
    } catch (error) {
      logger.error('Fee estimation failed:', {
        contractAddress,
        functionName,
        error,
      });
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    retries: number = 60,
    interval: number = 5000
  ): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const receipt = await this.getTransactionReceipt(txHash);

        if (receipt.execution_status === 'SUCCEEDED') {
          return receipt;
        } else if (receipt.execution_status === 'REVERTED') {
          throw new Error(`Transaction reverted: ${txHash}`);
        }
      } catch (error: any) {
        if (i === retries - 1) {
          throw new Error(`Transaction timeout: ${txHash}`);
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    throw new Error(`Transaction confirmation timeout: ${txHash}`);
  }

  /**
   * Get account nonce
   */
  async getNonce(accountAddress: string): Promise<bigint> {
    try {
      const nonce = await this.provider.getNonceForAddress(accountAddress);
      return BigInt(nonce);
    } catch (error) {
      logger.error('Failed to get nonce:', { accountAddress, error });
      throw error;
    }
  }

  /**
   * Check if contract is deployed
   */
  async isContractDeployed(address: string): Promise<boolean> {
    try {
      const classHash = await this.provider.getClassHashAt(address);
      return classHash !== '0x0';
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const starknetClient = new StarknetClient();
export default starknetClient;
