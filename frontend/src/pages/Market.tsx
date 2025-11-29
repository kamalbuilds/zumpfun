import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Search,
  TrendingUp,
  Clock,
  Flame,
  RefreshCw,
  Loader2,
  Rocket,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useLaunchpadFactory } from '@/hooks/useContracts';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config/contracts';
import { TokenCard, TokenData } from '@/components/TokenCard';
import { hash, shortString, RpcProvider } from 'starknet';

const RPC_URL = NETWORK_CONFIG.rpcUrl;

// Helper to make RPC calls
async function rpcCall(method: string, params: any): Promise<any> {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now(),
    }),
  });
  return response.json();
}

// Format U256 from RPC result
function formatU256(low: string, high: string = '0x0'): bigint {
  return BigInt(low) + (BigInt(high) << BigInt(128));
}

// Decode felt252 to string
function decodeFelt(felt: string): string {
  try {
    if (!felt || felt === '0x0') return '';
    return shortString.decodeShortString(felt);
  } catch {
    return '';
  }
}

export default function Market() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'hot' | 'graduated'>('all');
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Contract hooks
  const { totalLaunches } = useLaunchpadFactory();

  // Fetch all tokens from factory
  const fetchTokens = useCallback(async () => {
    const count = Number(totalLaunches);
    if (count === 0) {
      setTokens([]);
      setIsLoading(false);
      return;
    }

    const fetchedTokens: TokenData[] = [];

    for (let i = 1; i <= count; i++) {
      try {
        const tokenIdHex = '0x' + i.toString(16);

        // Get bonding curve address
        const getLaunchSelector = hash.getSelectorFromName('get_launch');
        const launchResult = await rpcCall('starknet_call', {
          request: {
            contract_address: CONTRACT_ADDRESSES.launchpadFactory,
            entry_point_selector: getLaunchSelector,
            calldata: [tokenIdHex, '0x0'],
          },
          block_id: 'latest',
        });

        // Get token address
        const getTokenSelector = hash.getSelectorFromName('get_token_address');
        const tokenResult = await rpcCall('starknet_call', {
          request: {
            contract_address: CONTRACT_ADDRESSES.launchpadFactory,
            entry_point_selector: getTokenSelector,
            calldata: [tokenIdHex, '0x0'],
          },
          block_id: 'latest',
        });

        const curveAddress = launchResult.result?.[0] || '0x0';
        const tokenAddress = tokenResult.result?.[0] || '0x0';

        if (tokenAddress === '0x0' || curveAddress === '0x0') continue;

        // Get token name
        const nameSelector = hash.getSelectorFromName('name');
        const nameResult = await rpcCall('starknet_call', {
          request: {
            contract_address: tokenAddress,
            entry_point_selector: nameSelector,
            calldata: [],
          },
          block_id: 'latest',
        });

        // Get token symbol
        const symbolSelector = hash.getSelectorFromName('symbol');
        const symbolResult = await rpcCall('starknet_call', {
          request: {
            contract_address: tokenAddress,
            entry_point_selector: symbolSelector,
            calldata: [],
          },
          block_id: 'latest',
        });

        // Get total supply from token
        const supplySelector = hash.getSelectorFromName('total_supply');
        const supplyResult = await rpcCall('starknet_call', {
          request: {
            contract_address: tokenAddress,
            entry_point_selector: supplySelector,
            calldata: [],
          },
          block_id: 'latest',
        });

        // Get current price from bonding curve
        const priceSelector = hash.getSelectorFromName('get_current_price');
        const priceResult = await rpcCall('starknet_call', {
          request: {
            contract_address: curveAddress,
            entry_point_selector: priceSelector,
            calldata: [],
          },
          block_id: 'latest',
        });

        // Get curve state
        const stateSelector = hash.getSelectorFromName('get_curve_state');
        const stateResult = await rpcCall('starknet_call', {
          request: {
            contract_address: curveAddress,
            entry_point_selector: stateSelector,
            calldata: [],
          },
          block_id: 'latest',
        });

        // Get graduation status
        const graduatedSelector = hash.getSelectorFromName('is_graduated');
        const graduatedResult = await rpcCall('starknet_call', {
          request: {
            contract_address: curveAddress,
            entry_point_selector: graduatedSelector,
            calldata: [],
          },
          block_id: 'latest',
        });

        const name = decodeFelt(nameResult.result?.[0] || '0x0') || `Token ${i}`;
        const symbol = decodeFelt(symbolResult.result?.[0] || '0x0') || `TKN${i}`;
        const totalSupply = supplyResult.result
          ? formatU256(supplyResult.result[0], supplyResult.result[1] || '0x0')
          : BigInt('800000000000000000000000000');
        const currentPrice = priceResult.result
          ? formatU256(priceResult.result[0], priceResult.result[1] || '0x0')
          : BigInt(0);

        // Parse curve state (current_supply, total_raised, graduated, amm_pool)
        let currentSupply = BigInt(0);
        let totalRaised = BigInt(0);
        if (stateResult.result && stateResult.result.length >= 4) {
          currentSupply = formatU256(stateResult.result[0], stateResult.result[1] || '0x0');
          totalRaised = formatU256(stateResult.result[2], stateResult.result[3] || '0x0');
        }

        const graduated = graduatedResult.result?.[0] !== '0x0';

        fetchedTokens.push({
          id: i,
          tokenAddress,
          curveAddress,
          name,
          symbol,
          currentPrice,
          totalRaised,
          currentSupply,
          totalSupply,
          graduated,
          createdAt: Math.floor(Date.now() / 1000) - (count - i) * 3600, // Estimate
        });
      } catch (error) {
        console.error(`Error fetching token ${i}:`, error);
      }
    }

    setTokens(fetchedTokens);
    setIsLoading(false);
  }, [totalLaunches]);

  // Initial load
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTokens();
    setIsRefreshing(false);
  };

  const tabs = [
    { id: 'all' as const, label: 'All', icon: Sparkles },
    { id: 'new' as const, label: 'New', icon: Clock },
    { id: 'hot' as const, label: 'Hot', icon: Flame },
    { id: 'graduated' as const, label: 'Graduated', icon: TrendingUp },
  ];

  // Filter tokens based on search and tab
  const filteredTokens = tokens.filter((token) => {
    const matchesSearch =
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'new' && !token.graduated) ||
      (activeTab === 'hot' && Number(token.totalRaised) > 0) ||
      (activeTab === 'graduated' && token.graduated);

    return matchesSearch && matchesTab;
  });

  // Sort tokens (newest first for new, by raised for hot)
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    if (activeTab === 'hot') {
      return Number(b.totalRaised - a.totalRaised);
    }
    return b.id - a.id;
  });

  // Get featured token (highest raised)
  const featuredToken = tokens.length > 0
    ? tokens.reduce((max, t) => (Number(t.totalRaised) > Number(max.totalRaised) ? t : max), tokens[0])
    : null;

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgMjAgMTAgTSAxMCAwIEwgMTAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAyIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />

        <div className="max-w-7xl mx-auto px-6 py-12 relative">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                Explore Tokens
              </h1>
              <p className="text-gray-400">
                Discover and trade privacy-preserving tokens on Ztarknet
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Launches</p>
                <p className="text-3xl font-bold text-white">{totalLaunches.toString()}</p>
              </div>
              <Button
                onClick={() => navigate('/launch')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-6"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Launch Token
              </Button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or symbol..."
                className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-white/10 bg-white/5 hover:bg-white/10 h-12 px-4"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mb-4" />
            <p className="text-gray-400">Loading tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No tokens yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Be the first to launch a privacy-preserving token on ZumpFun!
            </p>
            <Button
              onClick={() => navigate('/launch')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Launch First Token
            </Button>
          </div>
        ) : (
          <>
            {/* Featured Token */}
            {featuredToken && activeTab === 'all' && !searchQuery && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-lg font-semibold text-white">Featured</h2>
                </div>
                <TokenCard token={featuredToken} variant="featured" />
              </div>
            )}

            {/* Token Grid */}
            {sortedTokens.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedTokens.map((token) => (
                  <TokenCard key={token.id} token={token} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No matching tokens</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}

        {/* Network Info Footer */}
        <div className="mt-12 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-gray-400">Network:</span>
              <span className="text-green-400 font-medium">Ztarknet Devnet</span>
            </div>
            <div>
              <span className="text-gray-400">Factory: </span>
              <a
                href={`https://voyager.online/contract/${CONTRACT_ADDRESSES.launchpadFactory}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 font-mono text-xs"
              >
                {CONTRACT_ADDRESSES.launchpadFactory.slice(0, 10)}...
              </a>
            </div>
            <div className="text-gray-500 text-xs">
              RPC: {NETWORK_CONFIG.rpcUrl}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
