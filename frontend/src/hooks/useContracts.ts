import { useContract, useContractRead, useContractWrite, useAccount } from '@starknet-react/core';
import { useMemo, useCallback } from 'react';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG, TOKEN_DEFAULTS, CURVE_TYPES } from '@/config/contracts';
import { LAUNCHPAD_FACTORY_ABI } from '@/config/abi/launchpadFactory';
import { BONDING_CURVE_ABI } from '@/config/abi/bondingCurve';
import { PRIVACY_TOKEN_ABI } from '@/config/abi/privacyToken';
import { shortString, cairo, Call } from 'starknet';

// Types for contract interactions
export interface LaunchConfig {
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
  // Optional social/media fields
  imageUri?: string;
  twitter?: string;
  website?: string;
}

export interface CurveState {
  currentSupply: bigint;
  totalRaised: bigint;
  graduated: boolean;
  ammPool: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  totalSupply: bigint;
  currentPrice: bigint;
  curveState: CurveState;
}

// Hook for LaunchpadFactory contract
export function useLaunchpadFactory() {
  const { account } = useAccount();
  const { contract } = useContract({
    address: CONTRACT_ADDRESSES.launchpadFactory,
    abi: LAUNCHPAD_FACTORY_ABI as any,
  });

  // Read total launches - use 'latest' block for Madara RPC compatibility
  const { data: totalLaunches, refetch: refetchTotalLaunches } = useContractRead({
    address: CONTRACT_ADDRESSES.launchpadFactory,
    abi: LAUNCHPAD_FACTORY_ABI as any,
    functionName: 'get_total_launches',
    args: [],
    blockIdentifier: 'latest' as any,
  });

  // Read if factory is paused
  const { data: isPaused } = useContractRead({
    address: CONTRACT_ADDRESSES.launchpadFactory,
    abi: LAUNCHPAD_FACTORY_ABI as any,
    functionName: 'is_paused',
    args: [],
    blockIdentifier: 'latest' as any,
  });

  // Helper to convert bigint to u256 (low, high) as hex strings
  const toU256 = useCallback((value: bigint): [string, string] => {
    const low = value & BigInt('0xffffffffffffffffffffffffffffffff');
    const high = value >> BigInt(128);
    return ['0x' + low.toString(16), '0x' + high.toString(16)];
  }, []);

  const createLaunch = useCallback(async (config: LaunchConfig) => {
    if (!account) throw new Error('Wallet not connected');

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

    // Build the calldata for create_launch - all values must be strings
    const calldata: string[] = [
      // LaunchConfig struct
      nameEncoded,
      symbolEncoded,
      // BondingCurveParams struct
      config.curveType.toString(),
      ...toU256(config.basePrice),
      ...toU256(config.slope),
      ...toU256(config.kParam),
      ...toU256(config.maxPrice),
      ...toU256(config.initialSupply),
      ...toU256(config.graduationThreshold),
      // LaunchMetadata struct
      metadataUriEncoded,
      creatorCommitmentEncoded,
      '0x0',
      '0x0',
      imageUriEncoded,
      twitterEncoded,
      websiteEncoded,
      // creator_proof array (empty)
      '0',
    ];

    // Use account.execute directly for more control over transaction
    const call: Call = {
      contractAddress: CONTRACT_ADDRESSES.launchpadFactory,
      entrypoint: 'create_launch',
      calldata,
    };

    // Execute transaction directly through the account
    const result = await account.execute([call]);

    await refetchTotalLaunches();
    return result;
  }, [account, toU256, refetchTotalLaunches]);

  // Get launch address by token ID
  const getLaunchAddress = async (tokenId: bigint): Promise<string | null> => {
    if (!contract) return null;
    try {
      const result = await contract.get_launch(cairo.uint256(tokenId));
      return result?.toString() || null;
    } catch {
      return null;
    }
  };

  return {
    contract,
    totalLaunches: totalLaunches ? BigInt(totalLaunches.toString()) : BigInt(0),
    isPaused: isPaused as boolean,
    createLaunch,
    getLaunchAddress,
    refetchTotalLaunches,
  };
}

// Hook for BondingCurve contract
export function useBondingCurve(curveAddress?: string) {
  const address = curveAddress || CONTRACT_ADDRESSES.testBondingCurve;

  const { contract } = useContract({
    address,
    abi: BONDING_CURVE_ABI as any,
  });

  // Read current price - use 'latest' block for Madara RPC compatibility
  const { data: currentPrice, refetch: refetchPrice } = useContractRead({
    address,
    abi: BONDING_CURVE_ABI as any,
    functionName: 'get_current_price',
    args: [],
    watch: true,
    blockIdentifier: 'latest' as any,
  });

  // Read curve state
  const { data: curveState, refetch: refetchCurveState } = useContractRead({
    address,
    abi: BONDING_CURVE_ABI as any,
    functionName: 'get_curve_state',
    args: [],
    watch: true,
    blockIdentifier: 'latest' as any,
  });

  // Read if graduated
  const { data: isGraduated } = useContractRead({
    address,
    abi: BONDING_CURVE_ABI as any,
    functionName: 'is_graduated',
    args: [],
    watch: true,
    blockIdentifier: 'latest' as any,
  });

  // Write function for buying
  const { writeAsync: buyWrite } = useContractWrite({
    calls: [],
  });

  const calculateBuyPrice = async (amount: bigint): Promise<bigint> => {
    if (!contract) return BigInt(0);
    try {
      const result = await contract.calculate_buy_price(cairo.uint256(amount));
      return BigInt(result?.toString() || '0');
    } catch {
      return BigInt(0);
    }
  };

  const calculateSellPrice = async (amount: bigint): Promise<bigint> => {
    if (!contract) return BigInt(0);
    try {
      const result = await contract.calculate_sell_price(cairo.uint256(amount));
      return BigInt(result?.toString() || '0');
    } catch {
      return BigInt(0);
    }
  };

  // Helper to convert bigint to u256 (low, high) as hex strings
  const toU256 = (value: bigint): [string, string] => {
    const low = value & BigInt('0xffffffffffffffffffffffffffffffff');
    const high = value >> BigInt(128);
    return ['0x' + low.toString(16), '0x' + high.toString(16)];
  };

  const buyTokens = async (amount: bigint, commitment: string = '0x1') => {
    const result = await buyWrite({
      calls: [
        {
          contractAddress: address,
          entrypoint: 'buy',
          calldata: [
            ...toU256(amount), // amount (u256 = low, high)
            0, // payment_proof array length (empty for now)
            commitment, // commitment
          ],
        },
      ],
    });

    await refetchPrice();
    await refetchCurveState();
    return result;
  };

  const sellTokens = async (amount: bigint, nullifier: string = '0x1') => {
    const result = await buyWrite({
      calls: [
        {
          contractAddress: address,
          entrypoint: 'sell',
          calldata: [
            ...toU256(amount), // amount (u256 = low, high)
            0, // sell_proof array length (empty for now)
            nullifier, // nullifier
          ],
        },
      ],
    });

    await refetchPrice();
    await refetchCurveState();
    return result;
  };

  // Parse curve state
  const parsedCurveState: CurveState = useMemo(() => {
    if (!curveState) {
      return {
        currentSupply: BigInt(0),
        totalRaised: BigInt(0),
        graduated: false,
        ammPool: '0x0',
      };
    }
    const state = curveState as any;
    return {
      currentSupply: BigInt(state.current_supply?.toString() || '0'),
      totalRaised: BigInt(state.total_raised?.toString() || '0'),
      graduated: state.graduated || false,
      ammPool: state.amm_pool?.toString() || '0x0',
    };
  }, [curveState]);

  return {
    contract,
    currentPrice: currentPrice ? BigInt(currentPrice.toString()) : BigInt(0),
    curveState: parsedCurveState,
    isGraduated: isGraduated as boolean,
    calculateBuyPrice,
    calculateSellPrice,
    buyTokens,
    sellTokens,
    refetchPrice,
    refetchCurveState,
  };
}

// Hook for PrivacyToken contract
export function usePrivacyToken(tokenAddress?: string) {
  const address = tokenAddress || CONTRACT_ADDRESSES.testPrivacyToken;

  const { contract } = useContract({
    address,
    abi: PRIVACY_TOKEN_ABI as any,
  });

  // Read token name - use 'latest' block for Madara RPC compatibility
  const { data: name } = useContractRead({
    address,
    abi: PRIVACY_TOKEN_ABI as any,
    functionName: 'name',
    args: [],
    blockIdentifier: 'latest' as any,
  });

  // Read token symbol
  const { data: symbol } = useContractRead({
    address,
    abi: PRIVACY_TOKEN_ABI as any,
    functionName: 'symbol',
    args: [],
    blockIdentifier: 'latest' as any,
  });

  // Read total supply
  const { data: totalSupply } = useContractRead({
    address,
    abi: PRIVACY_TOKEN_ABI as any,
    functionName: 'total_supply',
    args: [],
    blockIdentifier: 'latest' as any,
  });

  // Read total shielded supply
  const { data: totalShielded } = useContractRead({
    address,
    abi: PRIVACY_TOKEN_ABI as any,
    functionName: 'total_shielded_supply',
    args: [],
    blockIdentifier: 'latest' as any,
  });

  // Decode felt252 to string
  const decodeFelt = (felt: any): string => {
    if (!felt) return '';
    try {
      return shortString.decodeShortString(felt.toString());
    } catch {
      return felt.toString();
    }
  };

  // Write functions
  const { writeAsync: tokenWrite } = useContractWrite({
    calls: [],
  });

  const getBalance = async (account: string): Promise<bigint> => {
    if (!contract) return BigInt(0);
    try {
      const result = await contract.balance_of(account);
      return BigInt(result?.toString() || '0');
    } catch {
      return BigInt(0);
    }
  };

  // Helper to convert bigint to u256 (low, high) as hex strings
  const toU256 = (value: bigint): [string, string] => {
    const low = value & BigInt('0xffffffffffffffffffffffffffffffff');
    const high = value >> BigInt(128);
    return ['0x' + low.toString(16), '0x' + high.toString(16)];
  };

  const transfer = async (recipient: string, amount: bigint) => {
    return await tokenWrite({
      calls: [
        {
          contractAddress: address,
          entrypoint: 'transfer',
          calldata: [recipient, ...toU256(amount)],
        },
      ],
    });
  };

  const shield = async (amount: bigint, commitment: string) => {
    return await tokenWrite({
      calls: [
        {
          contractAddress: address,
          entrypoint: 'shield',
          calldata: [...toU256(amount), commitment],
        },
      ],
    });
  };

  return {
    contract,
    name: decodeFelt(name),
    symbol: decodeFelt(symbol),
    totalSupply: totalSupply ? BigInt(totalSupply.toString()) : BigInt(0),
    totalShielded: totalShielded ? BigInt(totalShielded.toString()) : BigInt(0),
    getBalance,
    transfer,
    shield,
  };
}

// Helper hook to fetch all launched tokens
export function useLaunchedTokens() {
  const { totalLaunches, getLaunchAddress } = useLaunchpadFactory();

  const fetchAllLaunches = async (): Promise<TokenInfo[]> => {
    const tokens: TokenInfo[] = [];
    const count = Number(totalLaunches);

    for (let i = 1; i <= count; i++) {
      const address = await getLaunchAddress(BigInt(i));
      if (address && address !== '0x0') {
        // For each launch, we'd need to get the token info
        // This is a simplified version - in production, you'd batch these calls
        tokens.push({
          address,
          name: `Token ${i}`,
          symbol: `TKN${i}`,
          totalSupply: TOKEN_DEFAULTS.initialSupply,
          currentPrice: BigInt(0),
          curveState: {
            currentSupply: BigInt(0),
            totalRaised: BigInt(0),
            graduated: false,
            ammPool: '0x0',
          },
        });
      }
    }

    return tokens;
  };

  return {
    totalLaunches,
    fetchAllLaunches,
  };
}
