import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Shield, TrendingUp, Rocket, Lock, Users, Zap, LineChart, CheckCircle } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Privacy-Preserving Trades',
      description: 'Trade with complete anonymity using Zero-Knowledge proofs. Your transaction history stays private.',
      highlights: ['ZK-SNARK proofs', 'Anonymous trading', 'No wallet tracking'],
      color: 'purple',
      gradient: 'from-purple-500 to-purple-700',
    },
    {
      icon: LineChart,
      title: 'Bonding Curve Pricing',
      description: 'Fair price discovery through mathematically guaranteed bonding curves. No manipulation, pure market dynamics.',
      highlights: ['Algorithmic pricing', 'Instant liquidity', 'No slippage'],
      color: 'pink',
      gradient: 'from-pink-500 to-pink-700',
    },
    {
      icon: TrendingUp,
      title: 'AMM Graduation',
      description: 'Successful tokens automatically graduate to full AMM with deep liquidity. Seamless transition guaranteed.',
      highlights: ['Auto-migration', 'Deep liquidity', 'CEX-ready'],
      color: 'blue',
      gradient: 'from-blue-500 to-blue-700',
    },
    {
      icon: Rocket,
      title: 'Fair Launch Protocol',
      description: 'No presales, no team allocations. Everyone gets the same opportunity at the same time.',
      highlights: ['Equal access', 'No insider advantage', 'Community-first'],
      color: 'green',
      gradient: 'from-green-500 to-green-700',
    },
    {
      icon: Lock,
      title: 'Secure by Design',
      description: 'Smart contracts audited by top security firms. Your funds are protected by battle-tested code.',
      highlights: ['Audited contracts', 'Bug bounty program', 'Multi-sig security'],
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-700',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Sub-second transactions on Starknet. Experience the speed of next-gen blockchain technology.',
      highlights: ['Instant trades', 'Low fees', 'High throughput'],
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-700',
    },
  ];

  return (
    <div className="relative py-24 bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm mb-4">
            <Users className="w-4 h-4 text-purple-400 mr-2" />
            <span className="text-sm font-medium text-purple-300">Why Choose ZumpFun</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Built for{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Privacy & Performance
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            The most advanced privacy-preserving token launchpad with institutional-grade security
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group"
            >
              <CardHeader>
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white mb-2">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-slate-400 text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feature.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center text-sm text-slate-300">
                      <CheckCircle className={`w-4 h-4 text-${feature.color}-400 mr-2`} />
                      {highlight}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <div className="flex items-center px-6 py-3 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-green-300">100% Uptime</span>
            </div>
            <div className="flex items-center px-6 py-3 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-blue-300">$45M+ Volume</span>
            </div>
            <div className="flex items-center px-6 py-3 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-purple-300">12K+ Users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
