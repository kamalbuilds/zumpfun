import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';

export function NetworkBanner() {
  const { walletInfo } = useWallet();
  const [showDetails, setShowDetails] = useState(false);

  // Don't show banner if not connected or on correct network
  if (!walletInfo.isConnected || walletInfo.isCorrectNetwork) {
    return null;
  }

  return (
    <div className="bg-yellow-500 border-b border-yellow-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="h-6 w-6 text-yellow-900 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Wrong Network Detected
              </p>
              <p className="text-xs text-yellow-800">
                Please switch to Ztarknet Testnet to use this application
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-yellow-900 hover:text-yellow-700 text-sm font-medium"
          >
            {showDetails ? 'Hide' : 'Show'} Instructions
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">
              How to Switch to Ztarknet:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
              <li>
                <strong>For ArgentX:</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>Open ArgentX browser extension</li>
                  <li>Click on Settings (gear icon)</li>
                  <li>Go to "Developer Settings"</li>
                  <li>Enable "Add Custom Network"</li>
                  <li>Add Ztarknet with the following details:</li>
                  <div className="bg-yellow-100 p-2 rounded mt-2 font-mono text-xs">
                    <div>Network Name: Ztarknet Testnet</div>
                    <div>Chain ID: 0x534e5f5a454e44</div>
                    <div>RPC URL: https://ztarknet-rpc.example.com</div>
                    <div>Block Explorer: https://ztarknet-explorer.example.com</div>
                  </div>
                </ul>
              </li>
              <li className="mt-3">
                <strong>For Braavos:</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>Open Braavos wallet</li>
                  <li>Click on network dropdown (top right)</li>
                  <li>Select "Add Custom Network"</li>
                  <li>Enter the same network details as above</li>
                </ul>
              </li>
              <li className="mt-3">
                After adding the network, select "Ztarknet Testnet" from your wallet's network dropdown
              </li>
            </ol>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> You'll need Ztarknet testnet ETH to interact with the platform.
                Contact the team for testnet tokens if needed.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NetworkBanner;
