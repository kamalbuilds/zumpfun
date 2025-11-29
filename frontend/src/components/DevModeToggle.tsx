import { useDevMode } from '@/hooks/useDevAccount';
import { Bug, Check } from 'lucide-react';

export function DevModeToggle() {
  const { isDevMode, toggleDevMode, devAddress } = useDevMode();

  return (
    <div className="relative">
      <button
        onClick={toggleDevMode}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          isDevMode
            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
            : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
        }`}
        title={isDevMode ? 'Dev Mode Active - Using pre-funded test account' : 'Enable Dev Mode'}
      >
        <Bug className={`w-4 h-4 ${isDevMode ? 'text-amber-400' : ''}`} />
        <span className="text-sm font-medium">Dev</span>
        {isDevMode && <Check className="w-3 h-3 text-green-400" />}
      </button>

      {isDevMode && devAddress && (
        <div className="absolute top-full mt-2 right-0 z-50 w-72 p-3 rounded-lg bg-gray-900/95 border border-amber-500/30 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-medium text-sm mb-2">
            <Bug className="w-4 h-4" />
            Dev Mode Active
          </div>
          <div className="text-xs text-gray-400 mb-2">
            Using pre-deployed test account on Ztarknet
          </div>
          <div className="font-mono text-xs text-amber-300/80 bg-black/30 rounded px-2 py-1 break-all">
            {devAddress.slice(0, 20)}...{devAddress.slice(-10)}
          </div>
          <div className="mt-2 pt-2 border-t border-white/10">
            <ul className="text-xs text-gray-400 space-y-1">
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-500" />
                No wallet signature required
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-500" />
                Direct RPC transactions
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-500" />
                Pre-funded with ETH
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
