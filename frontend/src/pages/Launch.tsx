import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@starknet-react/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Rocket, ArrowLeft, Upload, AlertCircle, Settings2, Info, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { useLaunchpadFactory } from '@/hooks/useContracts';
import { useDevMode, useDevContracts } from '@/hooks/useDevAccount';
import { TOKEN_DEFAULTS, CURVE_TYPES, CONTRACT_ADDRESSES } from '@/config/contracts';

export default function Launch() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { createLaunch, totalLaunches, isPaused } = useLaunchpadFactory();
  const { isDevMode, devAddress } = useDevMode();
  const { createLaunch: devCreateLaunch, isLoading: devLoading, error: devError } = useDevContracts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Use dev address if dev mode is active, otherwise use wallet address
  const activeAddress = isDevMode ? devAddress : address;

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    initialSupply: '800000000', // 800M default
    imageUrl: '',
    twitter: '',
    website: '',
    curveType: CURVE_TYPES.SIGMOID as number,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeAddress) {
      toast.error(isDevMode ? 'Dev mode account not initialized' : 'Please connect your wallet first');
      return;
    }

    if (isPaused) {
      toast.error('Factory is currently paused');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate supply with 18 decimals
      const supplyWithDecimals = BigInt(formData.initialSupply) * BigInt(10 ** 18);

      const launchConfig = {
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        curveType: formData.curveType,
        basePrice: TOKEN_DEFAULTS.basePrice,
        slope: TOKEN_DEFAULTS.slope,
        kParam: TOKEN_DEFAULTS.kParam,
        maxPrice: TOKEN_DEFAULTS.maxPrice,
        initialSupply: supplyWithDecimals,
        graduationThreshold: supplyWithDecimals,
        metadataUri: formData.description || 'ipfs://default',
        creatorCommitment: '0x1', // Placeholder for ZK proof
        // Optional social/media fields
        imageUri: formData.imageUrl || undefined,
        twitter: formData.twitter || undefined,
        website: formData.website || undefined,
      };

      let result;
      if (isDevMode) {
        // Use dev account for direct RPC transactions
        toast.info('Creating token with dev account (direct RPC)...');
        result = await devCreateLaunch(launchConfig);
      } else {
        // Use wallet for signed transactions
        result = await createLaunch(launchConfig);
      }

      if (result?.transaction_hash) {
        setTxHash(result.transaction_hash);
        toast.success(
          <div>
            <p className="font-medium">Token launched successfully!</p>
            <p className="text-sm text-gray-400 mt-1">
              TX: {result.transaction_hash.slice(0, 10)}...
            </p>
            {isDevMode && (
              <p className="text-xs text-amber-400 mt-1">Via Dev Mode (Direct RPC)</p>
            )}
          </div>
        );

        // Navigate to market after delay
        setTimeout(() => navigate('/market'), 2000);
      }
    } catch (error: any) {
      console.error('Launch error:', error);
      toast.error(error?.message || 'Failed to launch token. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white py-12">
      <div className="max-w-3xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <Rocket className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">Token Launch</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Launch Your Token
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Create your privacy-preserving token with zero-knowledge proofs on Ztarknet
          </p>
        </div>

        {/* Dev Mode Banner */}
        {isDevMode && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-8">
            <Bug className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-amber-200 font-medium">Dev Mode Active</p>
              <p className="text-amber-300/80 text-sm mt-1">
                Using pre-funded test account for direct RPC transactions. No wallet signature required.
              </p>
              <p className="text-amber-400/60 text-xs mt-2 font-mono">
                {devAddress?.slice(0, 20)}...{devAddress?.slice(-10)}
              </p>
            </div>
          </div>
        )}

        {/* Wallet Warning */}
        {!activeAddress && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-8">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-amber-200 font-medium">No account available</p>
              <p className="text-amber-300/80 text-sm mt-1">
                {isDevMode
                  ? 'Dev mode not initialized. Please enable dev mode.'
                  : 'Please connect your wallet or enable dev mode to launch a token'}
              </p>
            </div>
          </div>
        )}

        {/* Launch Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            {/* Token Name */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                Token Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., My Awesome Token"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Token Symbol */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="symbol" className="text-sm font-medium text-gray-300">
                Token Symbol
              </Label>
              <Input
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="e.g., MAT"
                required
                maxLength={5}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="description" className="text-sm font-medium text-gray-300">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your token project..."
                required
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Initial Supply */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="initialSupply" className="text-sm font-medium text-gray-300">
                Initial Supply
              </Label>
              <Input
                id="initialSupply"
                name="initialSupply"
                type="number"
                value={formData.initialSupply}
                onChange={handleChange}
                placeholder="e.g., 1000000"
                required
                min="1"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-300">
                Token Image URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://... or ipfs://..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">IPFS or HTTP URL for your token logo</p>
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Twitter */}
              <div className="space-y-2">
                <Label htmlFor="twitter" className="text-sm font-medium text-gray-300">
                  Twitter Handle (optional)
                </Label>
                <Input
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="@yourtoken"
                  maxLength={31}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium text-gray-300">
                  Website (optional)
                </Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourtoken.xyz"
                  maxLength={31}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mt-6"
            >
              <Settings2 className="w-4 h-4" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </button>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">
                    Bonding Curve Type
                  </Label>
                  <select
                    value={formData.curveType}
                    onChange={(e) => setFormData({ ...formData, curveType: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                  >
                    <option value={CURVE_TYPES.LINEAR}>Linear (Simple)</option>
                    <option value={CURVE_TYPES.EXPONENTIAL}>Exponential</option>
                    <option value={CURVE_TYPES.SIGMOID}>Sigmoid (Recommended)</option>
                  </select>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Sigmoid curves provide the most capital-efficient price discovery, similar to pump.fun</p>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mt-8">
              <p className="text-sm text-indigo-200">
                <strong>Privacy Notice:</strong> Your token launch will be processed with zero-knowledge proofs,
                ensuring complete privacy while maintaining full transparency on the blockchain.
              </p>
            </div>

            {/* Contract Info */}
            <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Factory Contract</span>
                <a
                  href={`https://voyager.online/contract/${CONTRACT_ADDRESSES.launchpadFactory}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-mono text-xs"
                >
                  {CONTRACT_ADDRESSES.launchpadFactory.slice(0, 10)}...
                </a>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-400">Total Launches</span>
                <span className="text-white font-medium">{totalLaunches.toString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-400">Network</span>
                <span className="text-green-400 font-medium">Ztarknet</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!activeAddress || isSubmitting || devLoading || isPaused}
            className={`w-full font-semibold py-6 text-base rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              isDevMode
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20 hover:shadow-amber-500/30'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/20 hover:shadow-indigo-500/30'
            } text-white`}
          >
            {isSubmitting || devLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Launching Token...
              </>
            ) : (
              <>
                {isDevMode ? <Bug className="w-5 h-5 mr-2" /> : <Rocket className="w-5 h-5 mr-2" />}
                {isDevMode ? 'Launch Token (Dev Mode)' : 'Launch Token'}
              </>
            )}
          </Button>

          {/* Transaction Hash */}
          {txHash && (
            <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-200">
                <strong>Transaction submitted!</strong>
              </p>
              <a
                href={`https://voyager.online/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-400 hover:text-green-300 font-mono mt-1 block"
              >
                {txHash}
              </a>
            </div>
          )}
        </form>

        {/* Additional Info */}
        <div className="mt-12 text-center text-sm text-gray-400">
          <p>Launch fee: 0.01 ETH | Bonding curve graduation: $69,000 market cap</p>
          <p className="mt-2 text-xs">
            RPC: https://ztarknet-madara.d.karnot.xyz
          </p>
        </div>
      </div>
    </div>
  );
}
