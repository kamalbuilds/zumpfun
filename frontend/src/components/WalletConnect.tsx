import {
  Connector,
  useAccount,
  useConnect,
  useDisconnect,
} from '@starknet-react/core';
import { useStarknetkitConnectModal } from 'starknetkit';
import { Wallet, LogOut } from 'lucide-react';

export function WalletConnect() {
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as any,
  });

  async function connectWallet() {
    const { connector } = await starknetkitConnectModal();
    if (!connector) {
      return;
    }
    await connect({ connector: connector as unknown as Connector });
  }

  const { address } = useAccount();

  if (!address) {
    return (
      <button
        onClick={connectWallet}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-3 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-lg backdrop-blur-sm transition-all"
      >
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-white">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
      </button>
    </div>
  );
}
