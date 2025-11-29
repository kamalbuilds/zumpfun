import { useState, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { Account, RpcProvider, Contract, shortString, num } from 'starknet';
import { NETWORK_CONFIG, CONTRACT_ADDRESSES } from '@/config/contracts';
import { BONDING_CURVE_ABI } from '@/config/abi/bondingCurve';
import { PRIVACY_TOKEN_ABI } from '@/config/abi/privacyToken';

// Custom RPC provider that uses 'latest' instead of 'pending' for Madara compatibility
class MadaraRpcProvider extends RpcProvider {
  private rpcUrl: string;

  constructor(options: { nodeUrl: string }) {
    super(options);
    this.rpcUrl = options.nodeUrl;
  }

  async getNonceForAddress(contractAddress: string, _blockIdentifier?: any): Promise<string> {
    // Madara doesn't support 'pending' block, so we use 'latest'
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'starknet_getNonce',
        params: {
          contract_address: contractAddress,
          block_id: 'latest', // Force latest instead of pending
        },
        id: Date.now(),
      }),
    });
    const result = await response.json();
    if (result.error) {
      // If account doesn't exist yet, nonce is 0
      if (result.error.message?.includes('Contract not found')) {
        return '0x0';
      }
      throw new Error(result.error.message);
    }
    return result.result;
  }
}

// Pre-deployed OpenZeppelin account on Ztarknet (from sncast)
const DEV_ACCOUNT = {
  address: '0x6fe3031556a0ca23be489a0199c9e304f00f13900eacefcd50aeccdf57a23f6',
  privateKey: '0x910af0d51b044ed70c5e12bbd63b35ebfc2b3ba3704299b6f25edf7a43385',
  classHash: '0x1484c93b9d6cf61614d698ed069b3c6992c32549194fc3465258c2194734189',
};

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
  devAddress: string | null;
  account: Account | null;
  provider: RpcProvider | null;
}

const DevModeContext = createContext<DevModeContextType | null>(null);

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error('useDevMode must be used within DevModeProvider');
  }
  return context;
}

export function DevModeProvider({ children }: { children: ReactNode }) {
  const [isDevMode, setIsDevMode] = useState(false);

  const provider = useMemo(() => {
    return new MadaraRpcProvider({ nodeUrl: NETWORK_CONFIG.rpcUrl });
  }, []);

  const account = useMemo(() => {
    if (!isDevMode) return null;
    return new Account(provider, DEV_ACCOUNT.address, DEV_ACCOUNT.privateKey);
  }, [isDevMode, provider]);

  const toggleDevMode = useCallback(() => {
    setIsDevMode((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      isDevMode,
      toggleDevMode,
      devAddress: isDevMode ? DEV_ACCOUNT.address : null,
      account,
      provider,
    }),
    [isDevMode, toggleDevMode, account, provider]
  );

  return (
    <DevModeContext.Provider value={value}>
      {children}
    </DevModeContext.Provider>
  );
}

// Helper to convert bigint to u256 (low, high) as hex strings
const toU256 = (value: bigint): [string, string] => {
  const low = value & BigInt('0xffffffffffffffffffffffffffffffff');
  const high = value >> BigInt(128);
  return ['0x' + low.toString(16), '0x' + high.toString(16)];
};

// Launch config interface
export interface DevLaunchConfig {
  name: string;
  symbol: string;
  curveType: number;
  basePrice: bigint;
  slope: bigint;
  kParam: bigint;
  maxPrice: bigint;
  initialSupply: bigint;
  graduationThreshold: bigint;
  metadataUri: string;
  creatorCommitment: string;
  imageUri?: string;
  twitter?: string;
  website?: string;
}

// Hook for direct contract interactions using dev account
export function useDevContracts() {
  const { account, provider, isDevMode } = useDevMode();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a token launch using dev account
  const createLaunch = useCallback(
    async (config: DevLaunchConfig) => {
      if (!account || !provider || !isDevMode) {
        throw new Error('Dev mode not enabled or account not initialized');
      }

      setIsLoading(true);
      setError(null);

      try {
        // Encode strings to felt252
        const nameEncoded = shortString.encodeShortString(config.name.slice(0, 31));
        const symbolEncoded = shortString.encodeShortString(config.symbol.slice(0, 31));
        const metadataUriEncoded = shortString.encodeShortString(config.metadataUri.slice(0, 31));
        const creatorCommitmentEncoded = config.creatorCommitment || '0x1';

        // Encode optional social fields (use 0x0 if not provided)
        const imageUriEncoded = config.imageUri
          ? shortString.encodeShortString(config.imageUri.slice(0, 31))
          : '0x0';
        const twitterEncoded = config.twitter
          ? shortString.encodeShortString(config.twitter.slice(0, 31))
          : '0x0';
        const websiteEncoded = config.website
          ? shortString.encodeShortString(config.website.slice(0, 31))
          : '0x0';

        // Build the calldata for create_launch
        const calldata: (string | number)[] = [
          nameEncoded,
          symbolEncoded,
          config.curveType,
          ...toU256(config.basePrice),
          ...toU256(config.slope),
          ...toU256(config.kParam),
          ...toU256(config.maxPrice),
          ...toU256(config.initialSupply),
          ...toU256(config.graduationThreshold),
          metadataUriEncoded,
          creatorCommitmentEncoded,
          '0x0', // launch_start
          '0x0', // launch_end
          imageUriEncoded,
          twitterEncoded,
          websiteEncoded,
          0, // creator_proof array length
        ];

        const result = await account.execute({
          contractAddress: CONTRACT_ADDRESSES.launchpadFactory,
          entrypoint: 'create_launch',
          calldata,
        });

        // Wait for transaction
        await provider.waitForTransaction(result.transaction_hash);

        return result;
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to create launch';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [account, provider, isDevMode]
  );

  // Buy tokens using dev account
  const buyTokens = useCallback(
    async (curveAddress: string, amount: bigint, commitment: string = '0x1') => {
      if (!account || !provider || !isDevMode) {
        throw new Error('Dev mode not enabled or account not initialized');
      }

      setIsLoading(true);
      setError(null);

      try {
        const calldata = [
          ...toU256(amount),
          0, // payment_proof array length
          commitment,
        ];

        const result = await account.execute({
          contractAddress: curveAddress,
          entrypoint: 'buy',
          calldata,
        });

        await provider.waitForTransaction(result.transaction_hash);

        return result;
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to buy tokens';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [account, provider, isDevMode]
  );

  // Sell tokens using dev account
  const sellTokens = useCallback(
    async (curveAddress: string, amount: bigint, nullifier: string = '0x1') => {
      if (!account || !provider || !isDevMode) {
        throw new Error('Dev mode not enabled or account not initialized');
      }

      setIsLoading(true);
      setError(null);

      try {
        const calldata = [
          ...toU256(amount),
          0, // sell_proof array length
          nullifier,
        ];

        const result = await account.execute({
          contractAddress: curveAddress,
          entrypoint: 'sell',
          calldata,
        });

        await provider.waitForTransaction(result.transaction_hash);

        return result;
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to sell tokens';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [account, provider, isDevMode]
  );

  // Transfer tokens
  const transferTokens = useCallback(
    async (tokenAddress: string, recipient: string, amount: bigint) => {
      if (!account || !provider || !isDevMode) {
        throw new Error('Dev mode not enabled or account not initialized');
      }

      setIsLoading(true);
      setError(null);

      try {
        const calldata = [recipient, ...toU256(amount)];

        const result = await account.execute({
          contractAddress: tokenAddress,
          entrypoint: 'transfer',
          calldata,
        });

        await provider.waitForTransaction(result.transaction_hash);

        return result;
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to transfer tokens';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [account, provider, isDevMode]
  );

  // Shield tokens (privacy feature)
  const shieldTokens = useCallback(
    async (tokenAddress: string, amount: bigint, commitment: string) => {
      if (!account || !provider || !isDevMode) {
        throw new Error('Dev mode not enabled or account not initialized');
      }

      setIsLoading(true);
      setError(null);

      try {
        const calldata = [...toU256(amount), commitment];

        const result = await account.execute({
          contractAddress: tokenAddress,
          entrypoint: 'shield',
          calldata,
        });

        await provider.waitForTransaction(result.transaction_hash);

        return result;
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to shield tokens';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [account, provider, isDevMode]
  );

  // Read contract data
  const readContract = useCallback(
    async (contractAddress: string, functionName: string, args: any[] = []) => {
      if (!provider) {
        throw new Error('Provider not initialized');
      }

      try {
        const contract = new Contract(
          functionName.startsWith('get_') ? BONDING_CURVE_ABI : PRIVACY_TOKEN_ABI,
          contractAddress,
          provider
        );
        const result = await contract[functionName](...args);
        return result;
      } catch (err: any) {
        console.error(`Error reading ${functionName}:`, err);
        return null;
      }
    },
    [provider]
  );

  // Get account balance (ETH)
  const getBalance = useCallback(async () => {
    if (!provider || !account) return BigInt(0);

    try {
      // Get balance from fee token contract
      const feeTokenContract = new Contract(
        [
          {
            name: 'balanceOf',
            type: 'function',
            inputs: [{ name: 'account', type: 'felt' }],
            outputs: [{ name: 'balance', type: 'Uint256' }],
            state_mutability: 'view',
          },
        ],
        NETWORK_CONFIG.feeTokenAddress,
        provider
      );

      const balance = await feeTokenContract.balanceOf(DEV_ACCOUNT.address);
      return BigInt(balance.balance.low.toString());
    } catch (err) {
      console.error('Error getting balance:', err);
      return BigInt(0);
    }
  }, [provider, account]);

  return {
    isDevMode,
    isLoading,
    error,
    createLaunch,
    buyTokens,
    sellTokens,
    transferTokens,
    shieldTokens,
    readContract,
    getBalance,
  };
}
