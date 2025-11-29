import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Rocket, Shield, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const LandingHero: React.FC = () => {
  const navigate = useNavigate();
  const [animatedStats, setAnimatedStats] = useState({
    launches: 1234,
    volume: 45678900,
    users: 12456,
  });

  // Animate stats
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedStats(prev => ({
        launches: prev.launches + Math.floor(Math.random() * 3),
        volume: prev.volume + Math.random() * 50000,
        users: prev.users + Math.floor(Math.random() * 5),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0B0D] via-[#111318] to-[#0A0B0D]">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
        {/* Subtle glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[128px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32">
        <div className="text-center space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-300">Powered by Zero-Knowledge Proofs</span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] tracking-tight">
            Launch Tokens
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Anonymously
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The first privacy-preserving token launchpad on Ztarknet.
            Fair launches, bonding curves, and seamless AMM graduation — all with zero-knowledge privacy.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/launch')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all group"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Launch Token
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/market')}
              className="border border-white/10 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 font-semibold px-8 py-6 text-base rounded-xl"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Explore Tokens
            </Button>
          </div>

          {/* Animated Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-4xl mx-auto">
            {[
              {
                icon: Rocket,
                label: 'Total Launches',
                value: animatedStats.launches.toLocaleString(),
                color: 'indigo',
              },
              {
                icon: TrendingUp,
                label: 'Total Volume',
                value: formatCurrency(animatedStats.volume),
                color: 'purple',
              },
              {
                icon: Shield,
                label: 'Active Users',
                value: animatedStats.users.toLocaleString(),
                color: 'pink',
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1 tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                </div>
              );
            })}
          </div>

          {/* Features highlights */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 text-sm text-gray-400">
            {[
              'Zero-Knowledge Privacy',
              'Bonding Curve Pricing',
              'Automatic AMM Graduation',
              'Fair Launch Protocol'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center p-1.5">
          <div className="w-1.5 h-3 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
