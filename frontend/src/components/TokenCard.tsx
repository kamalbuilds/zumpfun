import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ExternalLink, Clock, Flame, Twitter, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TokenData {
  id: number;
  tokenAddress: string;
  curveAddress: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  twitter?: string;
  website?: string;
  currentPrice: bigint;
  totalRaised: bigint;
  currentSupply: bigint;
  totalSupply: bigint;
  graduated: boolean;
  createdAt?: number;
  creator?: string;
}

interface TokenCardProps {
  token: TokenData;
  variant?: 'default' | 'compact' | 'featured';
}

export function TokenCard({ token, variant = 'default' }: TokenCardProps) {
  const navigate = useNavigate();

  // Format ETH value
  const formatEth = (wei: bigint): string => {
    const eth = Number(wei) / 1e18;
    if (eth === 0) return '0';
    if (eth < 0.0001) return '<0.0001';
    if (eth < 0.01) return eth.toFixed(6);
    return eth.toFixed(4);
  };

  // Format token supply
  const formatSupply = (supply: bigint): string => {
    const num = Number(supply) / 1e18;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  // Calculate progress percentage
  const progressPercent = token.totalSupply > BigInt(0)
    ? Math.min(100, Number((token.currentSupply * BigInt(100)) / token.totalSupply))
    : 0;

  // Calculate market cap estimate (assuming ETH = $2000)
  const marketCapUsd = Number(token.totalRaised) / 1e18 * 2000;
  const formatMarketCap = (usd: number): string => {
    if (usd >= 1000000) return `$${(usd / 1000000).toFixed(1)}M`;
    if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}K`;
    return `$${usd.toFixed(0)}`;
  };

  // Time ago helper
  const timeAgo = (timestamp?: number): string => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={() => navigate(`/token/${token.tokenAddress}`)}
        className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer group"
      >
        {/* Token Image */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
          {token.imageUrl ? (
            <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover" />
          ) : (
            token.symbol.slice(0, 2)
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">{token.name}</span>
            <span className="text-xs text-gray-500">${token.symbol}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{formatMarketCap(marketCapUsd)}</span>
            <span>•</span>
            <span className="text-green-400">{formatEth(token.currentPrice)} ETH</span>
          </div>
        </div>

        {/* Progress */}
        <div className="w-16 flex-shrink-0">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                token.graduated
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5 text-right">{progressPercent.toFixed(0)}%</p>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        onClick={() => navigate(`/token/${token.tokenAddress}`)}
        className="relative bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm hover:border-indigo-400/50 transition-all cursor-pointer overflow-hidden group"
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Featured Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
          <Flame className="w-3 h-3 text-yellow-400" />
          <span className="text-[10px] font-medium text-yellow-400">HOT</span>
        </div>

        {/* Token Header */}
        <div className="flex items-center gap-4 mb-6 relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 border-2 border-white/30 flex items-center justify-center text-2xl overflow-hidden shadow-lg shadow-indigo-500/20">
            {token.imageUrl ? (
              <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover" />
            ) : (
              token.symbol.slice(0, 2)
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{token.name}</h3>
            <p className="text-sm text-gray-400">${token.symbol}</p>
            {(token.twitter || token.website) && (
              <div className="flex items-center gap-2 mt-1">
                {token.twitter && (
                  <a
                    href={`https://twitter.com/${token.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    <Twitter className="w-3 h-3" />
                  </a>
                )}
                {token.website && (
                  <a
                    href={token.website.startsWith('http') ? token.website : `https://${token.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 relative">
          <div>
            <p className="text-xs text-gray-500 mb-1">Price</p>
            <p className="text-lg font-bold text-green-400">{formatEth(token.currentPrice)} ETH</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Market Cap</p>
            <p className="text-lg font-bold text-white">{formatMarketCap(marketCapUsd)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Raised</p>
            <p className="text-lg font-bold text-white">{formatEth(token.totalRaised)} ETH</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Bonding Curve Progress</span>
            <span className="font-medium text-white">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                token.graduated
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Trade Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/token/${token.tokenAddress}`);
          }}
          className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Trade Now
        </Button>
      </div>
    );
  }

  // Default variant
  return (
    <div
      onClick={() => navigate(`/token/${token.tokenAddress}`)}
      className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all cursor-pointer group"
    >
      {/* Token Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center text-xl overflow-hidden">
          {token.imageUrl ? (
            <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover" />
          ) : (
            token.symbol.slice(0, 2)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">{token.name}</h3>
            {token.graduated ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                Graduated
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">${token.symbol}</p>
        </div>
      </div>

      {/* Price & Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Price</span>
          <span className="text-sm font-semibold text-green-400">{formatEth(token.currentPrice)} ETH</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Market Cap</span>
          <span className="text-sm font-medium text-white">{formatMarketCap(marketCapUsd)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Raised</span>
          <span className="text-sm font-medium text-white">{formatEth(token.totalRaised)} ETH</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{progressPercent.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              token.graduated
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          {token.twitter && (
            <a
              href={`https://twitter.com/${token.twitter.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-500 hover:text-indigo-400 transition-colors"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>
          )}
          {token.website && (
            <a
              href={token.website.startsWith('http') ? token.website : `https://${token.website}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-500 hover:text-indigo-400 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
          <a
            href={`https://voyager.online/contract/${token.tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-500 hover:text-indigo-400 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {timeAgo(token.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default TokenCard;
