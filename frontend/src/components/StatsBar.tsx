import React, { useState, useEffect } from 'react';
import { TrendingUp, Rocket, Trophy, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Stats {
  totalVolume: number;
  activeLaunches: number;
  graduatedTokens: number;
  volume24h: number;
}

export const StatsBar: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalVolume: 45678900,
    activeLaunches: 234,
    graduatedTokens: 89,
    volume24h: 1234567,
  });

  // Animate numbers on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalVolume: prev.totalVolume + Math.random() * 10000,
        volume24h: prev.volume24h + Math.random() * 1000,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const statItems = [
    {
      icon: Activity,
      label: 'Total Volume',
      value: formatCurrency(stats.totalVolume),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Rocket,
      label: 'Active Launches',
      value: stats.activeLaunches.toString(),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Trophy,
      label: 'Graduated',
      value: stats.graduatedTokens.toString(),
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: TrendingUp,
      label: '24h Volume',
      value: formatCurrency(stats.volume24h),
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
  ];

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-all duration-300"
            >
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
