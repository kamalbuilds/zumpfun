import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TrendingUp, TrendingDown, Rocket, Trophy, Clock } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface TokenLaunch {
  id: string;
  name: string;
  symbol: string;
  imageUrl: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  progress: number;
  graduationTarget: number;
  holders: number;
  launchedAt: Date;
  isGraduated: boolean;
  isHot: boolean;
}

export const LiveLaunches: React.FC = () => {
  const [launches, setLaunches] = useState<TokenLaunch[]>([
    {
      id: '1',
      name: 'Doge Vibes',
      symbol: 'DGVB',
      imageUrl: '🐕',
      price: 0.0234,
      priceChange24h: 234.5,
      volume24h: 456789,
      marketCap: 1234567,
      progress: 78,
      graduationTarget: 100000,
      holders: 234,
      launchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isGraduated: false,
      isHot: true,
    },
    {
      id: '2',
      name: 'Moon Pepe',
      symbol: 'MPEPE',
      imageUrl: '🐸',
      price: 0.0089,
      priceChange24h: 156.3,
      volume24h: 234567,
      marketCap: 876543,
      progress: 45,
      graduationTarget: 100000,
      holders: 189,
      launchedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isGraduated: false,
      isHot: true,
    },
    {
      id: '3',
      name: 'Shiba Rocket',
      symbol: 'SRKT',
      imageUrl: '🚀',
      price: 0.0456,
      priceChange24h: -12.4,
      volume24h: 123456,
      marketCap: 654321,
      progress: 92,
      graduationTarget: 100000,
      holders: 312,
      launchedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isGraduated: false,
      isHot: false,
    },
    {
      id: '4',
      name: 'Wojak Money',
      symbol: 'WJK',
      imageUrl: '💰',
      price: 0.0123,
      priceChange24h: 89.2,
      volume24h: 345678,
      marketCap: 987654,
      progress: 67,
      graduationTarget: 100000,
      holders: 267,
      launchedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      isGraduated: false,
      isHot: true,
    },
    {
      id: '5',
      name: 'Based Cat',
      symbol: 'BCAT',
      imageUrl: '🐱',
      price: 0.0678,
      priceChange24h: 412.8,
      volume24h: 567890,
      marketCap: 1456789,
      progress: 100,
      graduationTarget: 100000,
      holders: 456,
      launchedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      isGraduated: true,
      isHot: false,
    },
    {
      id: '6',
      name: 'Gigachad',
      symbol: 'GIGA',
      imageUrl: '💪',
      price: 0.0345,
      priceChange24h: 178.4,
      volume24h: 234890,
      marketCap: 789456,
      progress: 34,
      graduationTarget: 100000,
      holders: 145,
      launchedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      isGraduated: false,
      isHot: true,
    },
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLaunches(prev => prev.map(launch => ({
        ...launch,
        price: launch.price * (1 + (Math.random() - 0.5) * 0.02),
        volume24h: launch.volume24h * (1 + (Math.random() - 0.5) * 0.1),
        progress: Math.min(100, launch.progress + Math.random() * 2),
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <div className="relative py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 backdrop-blur-sm mb-4">
            <Rocket className="w-4 h-4 text-pink-400 mr-2" />
            <span className="text-sm font-medium text-pink-300">Live Token Launches</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Trending{' '}
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Launches
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Real-time feed of the hottest token launches. Trade with privacy, profit with confidence.
          </p>
        </div>

        {/* Token Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {launches.map((launch) => (
            <Card
              key={launch.id}
              className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer group"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-4xl">{launch.imageUrl}</div>
                    <div>
                      <CardTitle className="text-xl text-white flex items-center">
                        {launch.name}
                        {launch.isHot && (
                          <span className="ml-2 text-xs">🔥</span>
                        )}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-slate-400">${launch.symbol}</span>
                        {launch.isGraduated && (
                          <Badge variant="success" className="text-xs">
                            <Trophy className="w-3 h-3 mr-1" />
                            Graduated
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={launch.priceChange24h >= 0 ? 'success' : 'destructive'}>
                    {launch.priceChange24h >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {launch.priceChange24h >= 0 ? '+' : ''}
                    {launch.priceChange24h.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Price</p>
                    <p className="text-lg font-bold text-white">${launch.price.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Market Cap</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(launch.marketCap)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">24h Volume</p>
                    <p className="text-sm font-semibold text-slate-300">{formatCurrency(launch.volume24h)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Holders</p>
                    <p className="text-sm font-semibold text-slate-300">{formatNumber(launch.holders)}</p>
                  </div>
                </div>

                {/* Progress to Graduation */}
                {!launch.isGraduated && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-slate-500">Graduation Progress</p>
                      <p className="text-xs font-semibold text-purple-400">{launch.progress.toFixed(0)}%</p>
                    </div>
                    <Progress value={launch.progress} max={100} />
                    <p className="text-xs text-slate-500 mt-1">
                      {formatCurrency((launch.graduationTarget * launch.progress) / 100)} / {formatCurrency(launch.graduationTarget)}
                    </p>
                  </div>
                )}

                {/* Launch Time */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeAgo(launch.launchedAt)}
                  </div>
                  <button className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                    Trade Now →
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        <div className="mt-12 text-center">
          <button className="px-8 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-all duration-300 font-semibold">
            Load More Launches
          </button>
        </div>
      </div>
    </div>
  );
};
