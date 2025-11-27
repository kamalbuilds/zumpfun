import React, { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { Rocket, Shield, TrendingUp, Info } from 'lucide-react';
import { ContributionForm } from './ContributionForm';
import { useStarknet } from '../hooks/useStarknet';

interface TokenFormData {
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

export const TokenLaunch: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { launchToken, isLoading } = useStarknet();
  const [showContribution, setShowContribution] = useState(false);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);

  const [formData, setFormData] = useState<TokenFormData>({
    name: '',
    symbol: '',
    totalSupply: '1000000',
    initialPrice: '0.001',
    targetPrice: '0.1',
    privacyEnabled: true,
    metadata: {
      description: '',
      website: '',
      twitter: '',
      telegram: '',
    },
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TokenFormData, string>>>({});

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TokenFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Token name is required';
    }
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Token symbol is required';
    }
    if (formData.symbol.length > 10) {
      newErrors.symbol = 'Symbol must be 10 characters or less';
    }
    if (parseFloat(formData.totalSupply) <= 0) {
      newErrors.totalSupply = 'Total supply must be greater than 0';
    }
    if (parseFloat(formData.initialPrice) <= 0) {
      newErrors.initialPrice = 'Initial price must be greater than 0';
    }
    if (parseFloat(formData.targetPrice) <= parseFloat(formData.initialPrice)) {
      newErrors.targetPrice = 'Target price must be greater than initial price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const result = await launchToken({
        name: formData.name,
        symbol: formData.symbol,
        totalSupply: formData.totalSupply,
        initialPrice: formData.initialPrice,
        targetPrice: formData.targetPrice,
        privacyEnabled: formData.privacyEnabled,
        metadata: formData.metadata,
      });

      setTokenAddress(result.tokenAddress);
      setShowContribution(true);
    } catch (error) {
      console.error('Token launch failed:', error);
      alert('Token launch failed. Please try again.');
    }
  };

  // Update form field
  const updateField = (field: keyof TokenFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Update metadata field
  const updateMetadata = (field: keyof TokenFormData['metadata'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value },
    }));
  };

  if (showContribution && tokenAddress) {
    return <ContributionForm tokenAddress={tokenAddress} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">
          Launch Your Token
        </h1>
        <p className="text-gray-400 text-lg">
          Create a privacy-first token with bonding curve mechanics
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/20">
          <Shield className="w-8 h-8 text-purple-400 mb-2" />
          <h3 className="text-white font-semibold mb-1">Private by Default</h3>
          <p className="text-gray-400 text-sm">
            Zero-knowledge proofs protect contributor privacy
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/20">
          <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
          <h3 className="text-white font-semibold mb-1">Bonding Curve</h3>
          <p className="text-gray-400 text-sm">
            Automated market making with predictable pricing
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/20">
          <Rocket className="w-8 h-8 text-pink-400 mb-2" />
          <h3 className="text-white font-semibold mb-1">Fair Launch</h3>
          <p className="text-gray-400 text-sm">
            No pre-mine, no team allocation, community-first
          </p>
        </div>
      </div>

      {/* Launch Form */}
      <form onSubmit={handleLaunch} className="bg-gray-800/50 rounded-lg p-6 border border-purple-500/20">
        <h2 className="text-xl font-semibold text-white mb-4">Token Details</h2>

        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={`w-full bg-gray-900 border ${
                errors.name ? 'border-red-500' : 'border-purple-500/30'
              } rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500`}
              placeholder="My Awesome Token"
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Symbol *
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => updateField('symbol', e.target.value.toUpperCase())}
              className={`w-full bg-gray-900 border ${
                errors.symbol ? 'border-red-500' : 'border-purple-500/30'
              } rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500`}
              placeholder="MAT"
              maxLength={10}
            />
            {errors.symbol && (
              <p className="text-red-400 text-sm mt-1">{errors.symbol}</p>
            )}
          </div>
        </div>

        {/* Supply & Pricing */}
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Supply *
            </label>
            <input
              type="number"
              value={formData.totalSupply}
              onChange={(e) => updateField('totalSupply', e.target.value)}
              className={`w-full bg-gray-900 border ${
                errors.totalSupply ? 'border-red-500' : 'border-purple-500/30'
              } rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500`}
              min="1"
            />
            {errors.totalSupply && (
              <p className="text-red-400 text-sm mt-1">{errors.totalSupply}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Initial Price (ETH) *
            </label>
            <input
              type="number"
              step="0.001"
              value={formData.initialPrice}
              onChange={(e) => updateField('initialPrice', e.target.value)}
              className={`w-full bg-gray-900 border ${
                errors.initialPrice ? 'border-red-500' : 'border-purple-500/30'
              } rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500`}
              min="0.001"
            />
            {errors.initialPrice && (
              <p className="text-red-400 text-sm mt-1">{errors.initialPrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Price (ETH) *
            </label>
            <input
              type="number"
              step="0.001"
              value={formData.targetPrice}
              onChange={(e) => updateField('targetPrice', e.target.value)}
              className={`w-full bg-gray-900 border ${
                errors.targetPrice ? 'border-red-500' : 'border-purple-500/30'
              } rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500`}
              min="0.001"
            />
            {errors.targetPrice && (
              <p className="text-red-400 text-sm mt-1">{errors.targetPrice}</p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.metadata.description}
            onChange={(e) => updateMetadata('description', e.target.value)}
            className="w-full bg-gray-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            rows={3}
            placeholder="Tell us about your token..."
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.metadata.website}
              onChange={(e) => updateMetadata('website', e.target.value)}
              className="w-full bg-gray-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Twitter
            </label>
            <input
              type="text"
              value={formData.metadata.twitter}
              onChange={(e) => updateMetadata('twitter', e.target.value)}
              className="w-full bg-gray-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="@mytoken"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Telegram
            </label>
            <input
              type="text"
              value={formData.metadata.telegram}
              onChange={(e) => updateMetadata('telegram', e.target.value)}
              className="w-full bg-gray-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="t.me/mytoken"
            />
          </div>
        </div>

        {/* Privacy Toggle */}
        <div className="mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.privacyEnabled}
              onChange={(e) => updateField('privacyEnabled', e.target.checked)}
              className="w-5 h-5 bg-gray-900 border border-purple-500/30 rounded focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-white font-medium">Enable Privacy Features</span>
            <div className="relative group">
              <Info className="w-4 h-4 text-gray-400" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded p-2 w-64">
                When enabled, contributions are private using zero-knowledge proofs.
                Contributors can prove ownership without revealing amounts.
              </div>
            </div>
          </label>
        </div>

        {/* Launch Button */}
        <button
          type="submit"
          disabled={isLoading || !isConnected}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              <span>Launching...</span>
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              <span>Launch Token</span>
            </>
          )}
        </button>

        {!isConnected && (
          <p className="text-yellow-400 text-sm text-center mt-3">
            Please connect your wallet to launch a token
          </p>
        )}
      </form>
    </div>
  );
};
