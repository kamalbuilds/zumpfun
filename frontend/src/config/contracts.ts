// ZumpFun Contract Configuration
// Ztarknet Network

export const NETWORK_CONFIG = {
  rpcUrl: 'https://ztarknet-madara.d.karnot.xyz',
  chainId: 'ZTARKNET',
  chainName: 'Ztarknet Devnet',
  feeTokenAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
};

export const CONTRACT_ADDRESSES = {
  // Deployed contract addresses - NEW factory with proper calldata serialization
  launchpadFactory: '0x019761caa1fd38be2f69d6e7e28a7e30d9a95b81da8e0aede6f223804ef3e0df',

  // Test token deployments (from old factory - still valid for testing)
  testPrivacyToken: '0x0253bb6dd0f807be6c5625a321d41327134ce32d05d37daa52640b264896a9ae',
  testBondingCurve: '0x00cc39525176d228ae2439d4bbac88dbbdfafa81e91ac1abe860382feece9666',

  // Class hashes for deployments
  classHashes: {
    launchpadFactory: '0x3fcd032a92f2824a27ab6563efd4d3e098f470b99309eacca9858fecff8eb19',
    bondingCurve: '0x2a7c6426dff54a7fbf08e8871060a56f179a5ce2fcfcbeee21777c0ac9b61e3',
    privacyToken: '0x3b740bde512d696a026360f85a002f1a6e2d3447f37441cf3d9f41ed12815c4',
    tokenDistributor: '0x2d58435e145ebea341d93f32e0f19c1c221fb09105fbb2981a0c3eeb110ead',
  },

  // Placeholder verifier (to be replaced with Garaga verifier)
  verifier: '0x1',
} as const;

// Token defaults for launches
export const TOKEN_DEFAULTS = {
  decimals: 18,
  initialSupply: BigInt('800000000000000000000000000'), // 800M tokens with 18 decimals
  graduationThreshold: BigInt('800000000000000000000000000'), // All tokens for graduation
  basePrice: BigInt('1000000000000'), // 0.000001 ETH
  maxPrice: BigInt('100000000000000000'), // 0.1 ETH
  slope: BigInt('100000000'), // Price growth slope
  kParam: BigInt('10'), // Sigmoid k parameter
};

// Trading parameters
export const TRADING_PARAMS = {
  minBuyAmount: BigInt('1000000000000000'), // 0.001 ETH
  maxBuyPerTx: BigInt('100000000000000000000'), // 100 tokens
  tradingFeeBps: 30, // 0.3%
  creatorFeeBps: 10, // 0.1%
  protocolFeeBps: 10, // 0.1%
};

// Curve types
export const CURVE_TYPES = {
  LINEAR: 0,
  EXPONENTIAL: 1,
  SIGMOID: 2,
} as const;

export type CurveType = typeof CURVE_TYPES[keyof typeof CURVE_TYPES];
