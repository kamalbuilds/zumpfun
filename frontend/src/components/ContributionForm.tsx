import React, { useState, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNoirProver } from '../hooks/useNoirProver';
import { useStarknet } from '../hooks/useStarknet';

interface ContributionFormProps {
  tokenAddress: string;
}

type ProofStatus = 'idle' | 'generating' | 'generated' | 'submitting' | 'success' | 'error';

export const ContributionForm: React.FC<ContributionFormProps> = ({ tokenAddress }) => {
  const { address, isConnected } = useAccount();
  const { generateProof, isGenerating, proofProgress } = useNoirProver();
  const { contribute, isLoading } = useStarknet();

  const [amount, setAmount] = useState('1');
  const [usePrivacy, setUsePrivacy] = useState(true);
  const [proofStatus, setProofStatus] = useState<ProofStatus>('idle');
  const [proof, setProof] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Reset proof when amount changes
  useEffect(() => {
    if (proof) {
      setProof(null);
      setProofStatus('idle');
    }
  }, [amount, usePrivacy]);

  // Handle proof generation
  const handleGenerateProof = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return;
    }

    setProofStatus('generating');
    setError(null);

    try {
      // Generate ZK proof for contribution
      const generatedProof = await generateProof({
        circuitName: 'contribution',
        inputs: {
          contributor: address,
          amount: amount,
          tokenAddress: tokenAddress,
        },
      });

      setProof(generatedProof);
      setProofStatus('generated');
    } catch (err) {
      console.error('Proof generation failed:', err);
      setError('Failed to generate proof. Please try again.');
      setProofStatus('error');
    }
  };

  // Handle contribution submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      setError('Please connect your wallet');
      return;
    }

    if (usePrivacy && !proof) {
      setError('Please generate a proof first');
      return;
    }

    setProofStatus('submitting');
    setError(null);

    try {
      const result = await contribute({
        tokenAddress,
        amount,
        proof: usePrivacy ? proof : null,
        usePrivacy,
      });

      setTxHash(result.transactionHash);
      setProofStatus('success');
    } catch (err) {
      console.error('Contribution failed:', err);
      setError('Contribution failed. Please try again.');
      setProofStatus('error');
    }
  };

  // Calculate estimated tokens
  const estimatedTokens = parseFloat(amount) * 1000; // Simplified calculation

  if (proofStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800/50 rounded-lg p-8 border border-purple-500/20 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Contribution Successful!
          </h2>
          <p className="text-gray-400 mb-4">
            Your contribution has been processed
          </p>
          {txHash && (
            <div className="bg-gray-900 rounded p-3 mb-4">
              <p className="text-xs text-gray-400 mb-1">Transaction Hash:</p>
              <p className="text-sm text-purple-400 font-mono break-all">{txHash}</p>
            </div>
          )}
          <div className="space-y-2 text-sm text-gray-300">
            <p>Amount contributed: {amount} ETH</p>
            <p>Estimated tokens: ~{estimatedTokens.toLocaleString()}</p>
            {usePrivacy && (
              <p className="flex items-center justify-center text-green-400">
                <Shield className="w-4 h-4 mr-1" />
                Privacy-preserving contribution
              </p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Make Another Contribution
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Contribute to Token Launch
        </h1>
        <p className="text-gray-400">
          Be an early contributor with privacy protection
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gray-800/50 rounded-lg p-6 border border-purple-500/20">
        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contribution Amount (ETH)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-purple-500"
            placeholder="1.0"
          />
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gray-400">Estimated tokens:</span>
            <span className="text-white font-semibold">
              ~{estimatedTokens.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Privacy Toggle */}
        <div className="mb-6 bg-gray-900/50 rounded-lg p-4 border border-purple-500/20">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={usePrivacy}
              onChange={(e) => setUsePrivacy(e.target.checked)}
              className="mt-1 w-5 h-5 bg-gray-900 border border-purple-500/30 rounded focus:ring-2 focus:ring-purple-500"
            />
            <div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <span className="text-white font-medium">Private Contribution</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Use zero-knowledge proofs to keep your contribution amount private.
                You can prove ownership later without revealing the amount.
              </p>
            </div>
          </label>
        </div>

        {/* Proof Generation */}
        {usePrivacy && (
          <div className="mb-6">
            {!proof && proofStatus !== 'generating' && (
              <button
                type="button"
                onClick={handleGenerateProof}
                disabled={isGenerating || !isConnected}
                className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500 text-purple-300 font-semibold py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <Shield className="w-5 h-5" />
                <span>Generate Privacy Proof</span>
              </button>
            )}

            {proofStatus === 'generating' && (
              <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400" />
                  <span className="text-white font-medium">Generating Proof...</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${proofProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  This may take a few moments. Please don't close this window.
                </p>
              </div>
            )}

            {proof && proofStatus === 'generated' && (
              <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Proof Generated Successfully</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Your privacy proof is ready. You can now submit your contribution.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 rounded-lg p-4 border border-red-500/30">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            isLoading ||
            !isConnected ||
            (usePrivacy && !proof) ||
            proofStatus === 'submitting'
          }
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          {proofStatus === 'submitting' ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              <span>Submit Contribution</span>
            </>
          )}
        </button>

        {!isConnected && (
          <p className="text-yellow-400 text-sm text-center mt-3">
            Please connect your wallet to contribute
          </p>
        )}
      </form>

      {/* Info Box */}
      <div className="mt-6 bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
        <h3 className="text-white font-semibold mb-2">How It Works</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start">
            <span className="text-purple-400 mr-2">1.</span>
            Choose your contribution amount in ETH
          </li>
          <li className="flex items-start">
            <span className="text-purple-400 mr-2">2.</span>
            Generate a privacy proof (takes ~10 seconds)
          </li>
          <li className="flex items-start">
            <span className="text-purple-400 mr-2">3.</span>
            Submit your contribution - only you know the amount
          </li>
          <li className="flex items-start">
            <span className="text-purple-400 mr-2">4.</span>
            Receive tokens based on the bonding curve price
          </li>
        </ul>
      </div>
    </div>
  );
};
