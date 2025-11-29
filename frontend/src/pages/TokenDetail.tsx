import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from '@starknet-react/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink, Shield, Loader2, AlertCircle, Bug, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useBondingCurve, usePrivacyToken } from '@/hooks/useContracts';
import { useDevMode, useDevContracts } from '@/hooks/useDevAccount';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config/contracts';
import { hash } from 'starknet';

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

export default function TokenDetail() {
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const navigate = useNavigate();
  const { address } = useAccount();
  const { isDevMode, devAddress } = useDevMode();
  const { buyTokens: devBuyTokens, sellTokens: devSellTokens, isLoading: devLoading } = useDevContracts();
  const [curveAddress, setCurveAddress] = useState<string>(CONTRACT_ADDRESSES.testBondingCurve);
  const [copied, setCopied] = useState(false);
  const actualTokenAddress = tokenAddress || CONTRACT_ADDRESSES.testPrivacyToken;

  // Use dev address if dev mode is active, otherwise use wallet address
  const activeAddress = isDevMode ? devAddress : address;

  // Fetch curve address from factory based on token address
  useEffect(() => {
    const fetchCurveAddress = async () => {
      if (!tokenAddress) return;

      try {
        // Find the token ID by checking each launch
        const totalSelector = hash.getSelectorFromName('get_total_launches');
        const totalResult = await rpcCall('starknet_call', {
          request: {
            contract_address: CONTRACT_ADDRESSES.launchpadFactory,
            entry_point_selector: totalSelector,
            calldata: [],
          },
          block_id: 'latest',
        });

        const total = totalResult.result ? parseInt(totalResult.result[0], 16) : 0;

        for (let i = 1; i <= total; i++) {
          const tokenIdHex = '0x' + i.toString(16);

          const getTokenSelector = hash.getSelectorFromName('get_token_address');
          const tokenResult = await rpcCall('starknet_call', {
            request: {
              contract_address: CONTRACT_ADDRESSES.launchpadFactory,
              entry_point_selector: getTokenSelector,
              calldata: [tokenIdHex, '0x0'],
            },
            block_id: 'latest',
          });

          const foundToken = tokenResult.result?.[0];
          if (foundToken && foundToken.toLowerCase() === tokenAddress.toLowerCase()) {
            // Found the token, now get the curve address
            const getLaunchSelector = hash.getSelectorFromName('get_launch');
            const launchResult = await rpcCall('starknet_call', {
              request: {
                contract_address: CONTRACT_ADDRESSES.launchpadFactory,
                entry_point_selector: getLaunchSelector,
                calldata: [tokenIdHex, '0x0'],
              },
              block_id: 'latest',
            });

            if (launchResult.result?.[0]) {
              setCurveAddress(launchResult.result[0]);
            }
            break;
          }
        }
      } catch (error) {
        console.error('Error fetching curve address:', error);
      }
    };

    fetchCurveAddress();
  }, [tokenAddress]);

  // Contract hooks
  const {
    currentPrice,
    curveState,
    isGraduated,
    calculateBuyPrice,
    calculateSellPrice,
    buyTokens,
    sellTokens,
    refetchPrice,
    refetchCurveState
  } = useBondingCurve(curveAddress);

  const {
    name: tokenName,
    symbol: tokenSymbol,
    totalSupply,
    getBalance
  } = usePrivacyToken(actualTokenAddress);

  // Local state
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<bigint>(BigInt(0));
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState(false);

  // Format ETH value
  const formatEth = (wei: bigint): string => {
    const eth = Number(wei) / 1e18;
    if (eth === 0) return '0';
    if (eth < 0.000001) return '<0.000001';
    if (eth < 0.001) return eth.toFixed(6);
    return eth.toFixed(4);
  };

  // Format token amount
  const formatTokens = (amount: bigint): string => {
    const tokens = Number(amount) / 1e18;
    if (tokens >= 1e9) return `${(tokens / 1e9).toFixed(2)}B`;
    if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(2)}M`;
    if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(2)}K`;
    return tokens.toFixed(2);
  };

  // Calculate graduation progress
  const graduationProgress = curveState.currentSupply > BigInt(0) && totalSupply > BigInt(0)
    ? Math.min(100, Number((curveState.currentSupply * BigInt(100)) / totalSupply))
    : 0;

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (activeAddress) {
        const balance = await getBalance(activeAddress);
        setUserBalance(balance);
      }
    };
    fetchBalance();
  }, [activeAddress, getBalance]);

  // Calculate price when amount changes
  useEffect(() => {
    const calculatePrice = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setEstimatedPrice(BigInt(0));
        return;
      }

      setIsPriceLoading(true);
      try {
        const tokenAmount = BigInt(Math.floor(parseFloat(amount) * 1e18));
        const price = activeTab === 'buy'
          ? await calculateBuyPrice(tokenAmount)
          : await calculateSellPrice(tokenAmount);
        setEstimatedPrice(price);
      } catch (error) {
        console.error('Price calculation error:', error);
        setEstimatedPrice(BigInt(0));
      } finally {
        setIsPriceLoading(false);
      }
    };

    const debounce = setTimeout(calculatePrice, 300);
    return () => clearTimeout(debounce);
  }, [amount, activeTab, calculateBuyPrice, calculateSellPrice]);

  // Handle trade execution
  const handleTrade = async () => {
    if (!activeAddress) {
      toast.error(isDevMode ? 'Dev mode account not initialized' : 'Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (isGraduated) {
      toast.error('This token has graduated. Trade on the AMM instead.');
      return;
    }

    setIsLoading(true);
    try {
      const tokenAmount = BigInt(Math.floor(parseFloat(amount) * 1e18));

      let result;
      if (activeTab === 'buy') {
        if (isDevMode) {
          toast.info('Executing buy with dev account (direct RPC)...');
          result = await devBuyTokens(curveAddress, tokenAmount);
        } else {
          result = await buyTokens(tokenAmount);
        }
        if (result?.transaction_hash) {
          toast.success(
            <div>
              <p className="font-medium">Buy order submitted!</p>
              <p className="text-sm text-gray-400 mt-1">
                TX: {result.transaction_hash.slice(0, 10)}...
              </p>
              {isDevMode && (
                <p className="text-xs text-amber-400 mt-1">Via Dev Mode (Direct RPC)</p>
              )}
            </div>
          );
        }
      } else {
        if (isDevMode) {
          toast.info('Executing sell with dev account (direct RPC)...');
          result = await devSellTokens(curveAddress, tokenAmount);
        } else {
          result = await sellTokens(tokenAmount);
        }
        if (result?.transaction_hash) {
          toast.success(
            <div>
              <p className="font-medium">Sell order submitted!</p>
              <p className="text-sm text-gray-400 mt-1">
                TX: {result.transaction_hash.slice(0, 10)}...
              </p>
              {isDevMode && (
                <p className="text-xs text-amber-400 mt-1">Via Dev Mode (Direct RPC)</p>
              )}
            </div>
          );
        }
      }

      // Refresh data
      setAmount('');
      await refetchPrice();
      await refetchCurveState();
      if (activeAddress) {
        const newBalance = await getBalance(activeAddress);
        setUserBalance(newBalance);
      }
    } catch (error: any) {
      console.error('Trade error:', error);
      toast.error(error?.message || `Failed to ${activeTab} tokens`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/market')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Market
        </button>

        {/* Token Header */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/10 rounded-2xl p-8 backdrop-blur-sm mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-2 border-white/20 flex items-center justify-center text-4xl shadow-lg shadow-indigo-500/10">
                {tokenSymbol ? tokenSymbol.slice(0, 2) : '🚀'}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {tokenName || 'Loading...'}
                </h1>
                <p className="text-lg text-gray-400">${tokenSymbol || '...'}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(actualTokenAddress);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast.success('Address copied!');
                  }}
                  className="flex items-center gap-1 mt-1 text-xs text-gray-500 hover:text-indigo-400 transition-colors font-mono"
                >
                  {actualTokenAddress.slice(0, 8)}...{actualTokenAddress.slice(-6)}
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isGraduated ? (
                <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-sm font-medium">
                  ✓ Graduated to AMM
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-sm font-medium animate-pulse">
                  🔴 Live on Bonding Curve
                </span>
              )}
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">{formatEth(currentPrice)} ETH</p>
                <p className="text-xs text-gray-500">Current Price</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Current Price</p>
              <p className="text-xl font-bold text-white">{formatEth(currentPrice)} ETH</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total Raised</p>
              <p className="text-xl font-bold text-white">{formatEth(curveState.totalRaised)} ETH</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Supply Sold</p>
              <p className="text-xl font-bold text-white">{formatTokens(curveState.currentSupply)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Your Balance</p>
              <p className="text-xl font-bold text-white">{formatTokens(userBalance)}</p>
            </div>
          </div>

          {/* Graduation Progress */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Graduation Progress</span>
              <span className="text-sm font-medium text-white">{graduationProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${graduationProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Once 100% of supply is sold, trading moves to the AMM
            </p>
          </div>
        </div>

        {/* Trading Interface */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Trade Panel */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6">Trade</h2>

            {/* Buy/Sell Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('buy')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'buy'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Buy
              </button>
              <button
                onClick={() => setActiveTab('sell')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'sell'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                Sell
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2 mb-4">
              <label className="text-sm text-gray-400">
                Amount ({tokenSymbol || 'Tokens'})
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                min="0"
                step="any"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-lg h-14"
              />
            </div>

            {/* Estimated Price */}
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Estimated {activeTab === 'buy' ? 'Cost' : 'Return'}
                </span>
                <span className="text-lg font-bold text-white">
                  {isPriceLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `${formatEth(estimatedPrice)} ETH`
                  )}
                </span>
              </div>
            </div>

            {/* Dev Mode Banner */}
            {isDevMode && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
                <Bug className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-amber-200 font-medium">Dev Mode Active</p>
                  <p className="text-amber-300/80 text-sm mt-1">
                    Using pre-funded test account for direct RPC transactions
                  </p>
                </div>
              </div>
            )}

            {/* Wallet Warning */}
            {!activeAddress && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-amber-200 font-medium">No account available</p>
                  <p className="text-amber-300/80 text-sm mt-1">
                    {isDevMode
                      ? 'Dev mode not initialized. Enable dev mode.'
                      : 'Connect your wallet or enable dev mode to trade'}
                  </p>
                </div>
              </div>
            )}

            {/* Trade Button */}
            <Button
              onClick={handleTrade}
              disabled={!activeAddress || isLoading || devLoading || !amount || parseFloat(amount) <= 0 || isGraduated}
              className={`w-full py-6 text-base font-semibold rounded-xl ${
                isDevMode
                  ? activeTab === 'buy'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                    : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
                  : activeTab === 'buy'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading || devLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {isDevMode ? <Bug className="w-5 h-5 mr-2" /> : (activeTab === 'buy' ? <TrendingUp className="w-5 h-5 mr-2" /> : <TrendingDown className="w-5 h-5 mr-2" />)}
                  {activeTab === 'buy' ? 'Buy' : 'Sell'} {tokenSymbol || 'Tokens'} {isDevMode && '(Dev)'}
                </>
              )}
            </Button>
          </div>

          {/* Token Info Panel */}
          <div className="space-y-6">
            {/* Contract Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-4">Contract Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Token</span>
                  <a
                    href={`https://voyager.online/contract/${actualTokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 font-mono"
                  >
                    {actualTokenAddress.slice(0, 8)}...{actualTokenAddress.slice(-6)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Bonding Curve</span>
                  <a
                    href={`https://voyager.online/contract/${curveAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 font-mono"
                  >
                    {curveAddress.slice(0, 8)}...{curveAddress.slice(-6)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Network</span>
                  <span className="text-sm text-green-400 font-medium">Ztarknet Devnet</span>
                </div>
              </div>
            </div>

            {/* Privacy Features */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold">Privacy Features</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                This token supports zero-knowledge shielded transactions for enhanced privacy.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-gray-300">ZK-SNARKs verified transactions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-gray-300">Private balance hiding</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-gray-300">Anonymous transfers</span>
                </div>
              </div>
            </div>

            {/* Network Info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">RPC</span>
                <span className="text-white font-mono text-xs">{NETWORK_CONFIG.rpcUrl}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
