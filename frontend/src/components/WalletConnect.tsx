import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';

export const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);

  // Format address for display
  const formatAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Handle wallet connection
  const handleConnect = (connector: any) => {
    connect({ connector });
    setShowMenu(false);
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
    setShowMenu(false);
  };

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          aria-label="Wallet menu"
        >
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-medium">{formatAddress(address)}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
              aria-hidden="true"
            />

            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-purple-500/20 z-20">
              <div className="p-2">
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        aria-label="Connect wallet"
      >
        <Wallet className="w-4 h-4" />
        <span className="text-sm font-medium">Connect Wallet</span>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-purple-500/20 z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs text-gray-400 font-medium uppercase">
                Select Wallet
              </div>
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-white hover:bg-gray-700 rounded-md transition-colors"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {connector.name.charAt(0)}
                  </div>
                  <span>{connector.name}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-purple-500/20 p-2">
              <p className="text-xs text-gray-400 px-3 py-2">
                Connect to Ztarknet devnet
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
