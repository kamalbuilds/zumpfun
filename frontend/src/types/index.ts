/**
 * Type definitions for ZumpFun frontend
 */

// Starknet types
export interface StarknetAccount {
  address: string;
  publicKey: string;
}

// Token types
export interface Token {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  creator: string;
  createdAt: number;
  privacyEnabled: boolean;
  metadata: TokenMetadata;
}

export interface TokenMetadata {
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  imageUrl?: string;
}

export interface TokenStats {
  currentPrice: string;
  priceChange24h: number;
  volume24h: string;
  marketCap: string;
  holders: number;
  totalTransactions: number;
}

// Bonding curve types
export interface BondingCurveParams {
  initialPrice: string;
  targetPrice: string;
  currentSupply: string;
  totalSupply: string;
}

export interface PricePoint {
  supply: number;
  price: number;
}

// Transaction types
export interface Transaction {
  hash: string;
  type: 'launch' | 'contribute' | 'buy' | 'sell';
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
}

// Proof types
export interface Proof {
  proof: Uint8Array;
  publicInputs: string[];
}

export interface ProofInputs {
  contributor?: string;
  trader?: string;
  amount: string;
  tokenAddress: string;
  timestamp?: number;
}

// Circuit types
export interface CircuitManifest {
  name: string;
  version: string;
  abi: any;
  bytecode: Uint8Array;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'event';
  event?: string;
  data?: any;
}

export interface EventData {
  tokenAddress?: string;
  transaction?: Transaction;
  price?: string;
  volume?: string;
}

// Form types
export interface TokenLaunchForm {
  name: string;
  symbol: string;
  totalSupply: string;
  initialPrice: string;
  targetPrice: string;
  privacyEnabled: boolean;
  metadata: {
    description: string;
    website: string;
    twitter: string;
    telegram: string;
  };
}

export interface ContributionForm {
  amount: string;
  usePrivacy: boolean;
}

export interface TradeForm {
  type: 'buy' | 'sell';
  amount: string;
  usePrivacy: boolean;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Wallet types
export interface WalletConnection {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  provider: any;
}

// Chart types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

// User preferences
export interface UserPreferences {
  theme: 'dark' | 'light';
  defaultPrivacy: boolean;
  notifications: boolean;
  language: string;
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  address: string;
  tokenAddress: string;
  volume: string;
  profit: string;
  trades: number;
}
