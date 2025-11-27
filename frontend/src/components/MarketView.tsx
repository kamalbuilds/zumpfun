import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount } from '@starknet-react/core';
import { TrendingUp, TrendingDown, Activity, Shield, Lock } from 'lucide-react';
import { useStarknet } from '../hooks/useStarknet';
import { useNoirProver } from '../hooks/useNoirProver';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  currentPrice: string;
  priceChange24h: number;
  volume24h: string;
  marketCap: string;
  holders: number;
}

export const MarketView: React.FC = () => {
  const { tokenAddress } = useParams<{ tokenAddress?: string }>();
  const { address, isConnected } = useAccount();
  const { buyToken, sellToken, getTokenInfo, isLoading } = useStarknet();
  const { generateProof, isGenerating } = useNoirProver();

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [tradeAmount, setTradeAmount] = useState('1');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [usePrivacy, setUsePrivacy] = useState(true);
  const [estimatedOutput, setEstimatedOutput] = useState('0');

  // Load token information
  useEffect(() => {
    if (tokenAddress) {
      loadTokenInfo();
    }
  }, [tokenAddress]);

  const loadTokenInfo = async () => {
    if (!tokenAddress) return;

    try {
      const info = await getTokenInfo(tokenAddress);
      setTokenInfo(info);
    } catch (error) {
      console.error('Failed to load token info:', error);
    }
  };

  // Calculate estimated output
  useEffect(() => {
    if (tokenInfo && tradeAmount) {
      // Simplified bonding curve calculation
      const amount = parseFloat(tradeAmount);
      const price = parseFloat(tokenInfo.currentPrice);

      if (tradeType === 'buy') {
        // Buying: ETH -> Tokens
        setEstimatedOutput((amount / price).toFixed(4));
      } else {
        // Selling: Tokens -> ETH
        setEstimatedOutput((amount * price).toFixed(4));
      }
    }
  }, [tradeAmount, tradeType, tokenInfo]);

  // Handle trade execution
  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !tokenAddress) {
      alert('Please connect your wallet');
      return;
    }

    try {
      let proof = null;

      // Generate privacy proof if enabled
      if (usePrivacy) {
        proof = await generateProof({
          circuitName: 'trade',
          inputs: {
            trader: address,
            amount: tradeAmount,
            tokenAddress: tokenAddress,
            tradeType: tradeType,
          },
        });
      }

      // Execute trade
      if (tradeType === 'buy') {
        await buyToken({
          tokenAddress,
          amount: tradeAmount,
          proof,
          usePrivacy,
        });
      } else {
        await sellToken({
          tokenAddress,
          amount: tradeAmount,
          proof,
          usePrivacy,
        });
      }

      // Reload token info
      await loadTokenInfo();
      setTradeAmount('1');
    } catch (error) {
      console.error('Trade failed:', error);
      alert('Trade failed. Please try again.');
    }
  };

  // Chart data
  const chartData = {
    labels: ['1h', '2h', '3h', '4h', '5h', '6h'],
    datasets: [
      {
        label: 'Price (ETH)',
        data: [0.001, 0.0012, 0.0015, 0.0014, 0.0018, 0.002],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgb(156, 163, 175)',
        bodyColor: 'rgb(255, 255, 255)',
        borderColor: 'rgba(168, 85, 247, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(168, 85, 247, 0.1)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
        },
      },
      y: {
        grid: {
          color: 'rgba(168, 85, 247, 0.1)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
        },
      },
    },
  };

  if (!tokenInfo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading token data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Token Header */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-purple-500/20 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {tokenInfo.name}
            </h1>
            <p className="text-gray-400 text-lg">${tokenInfo.symbol}</p>
          </div>
          <div className="flex items-center space-x-2 bg-purple-900/30 px-3 py-1 rounded-lg">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm">Privacy Enabled</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Current Price</p>
            <p className="text-white text-xl font-semibold">
              {tokenInfo.currentPrice} ETH
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">24h Change</p>
            <p
              className={`text-xl font-semibold flex items-center ${
                tokenInfo.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {tokenInfo.priceChange24h >= 0 ? (
                <TrendingUp className="w-5 h-5 mr-1" />
              ) : (
                <TrendingDown className="w-5 h-5 mr-1" />
              )}
              {Math.abs(tokenInfo.priceChange24h).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">24h Volume</p>
            <p className="text-white text-xl font-semibold">
              {tokenInfo.volume24h} ETH
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Holders</p>
            <p className="text-white text-xl font-semibold">
              {tokenInfo.holders.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-gray-800/50 rounded-lg p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-400" />
              Price Chart
            </h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded">
                6H
              </button>
              <button className="px-3 py-1 text-sm text-gray-400 hover:text-white">
                24H
              </button>
              <button className="px-3 py-1 text-sm text-gray-400 hover:text-white">
                7D
              </button>
            </div>
          </div>
          <div className="h-[300px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Trade Panel */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-purple-500/20">
          <h2 className="text-xl font-semibold text-white mb-4">Trade</h2>

          <form onSubmit={handleTrade}>
            {/* Buy/Sell Tabs */}
            <div className="flex space-x-2 mb-4">
              <button
                type="button"
                onClick={() => setTradeType('buy')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  tradeType === 'buy'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setTradeType('sell')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  tradeType === 'sell'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                Sell
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {tradeType === 'buy' ? 'Amount (ETH)' : 'Amount (Tokens)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                className="w-full bg-gray-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Estimated Output */}
            <div className="mb-4 bg-gray-900/50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">You receive</span>
                <span className="text-white font-semibold">
                  {estimatedOutput}{' '}
                  {tradeType === 'buy' ? tokenInfo.symbol : 'ETH'}
                </span>
              </div>
            </div>

            {/* Privacy Toggle */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePrivacy}
                  onChange={(e) => setUsePrivacy(e.target.checked)}
                  className="w-4 h-4 bg-gray-900 border border-purple-500/30 rounded focus:ring-2 focus:ring-purple-500"
                />
                <Lock className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white">Private Trade</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isConnected || isGenerating}
              className={`w-full font-semibold py-3 rounded-lg transition-all ${
                tradeType === 'buy'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } disabled:bg-gray-600`}
            >
              {isLoading || isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Processing...</span>
                </div>
              ) : (
                <span>{tradeType === 'buy' ? 'Buy' : 'Sell'} {tokenInfo.symbol}</span>
              )}
            </button>

            {!isConnected && (
              <p className="text-yellow-400 text-sm text-center mt-3">
                Connect wallet to trade
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
