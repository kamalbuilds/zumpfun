import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StarknetConfig, InjectedConnector } from '@starknet-react/core';
import { WalletConnect } from './components/WalletConnect';
import { TokenLaunch } from './components/TokenLaunch';
import { MarketView } from './components/MarketView';
import { ThemeProvider } from './providers/ThemeProvider';
import './styles/global.css';

// Configure Starknet connectors
const connectors = [
  new InjectedConnector({ options: { id: 'argentX', name: 'ArgentX' } }),
  new InjectedConnector({ options: { id: 'braavos', name: 'Braavos' } }),
];

// Layout component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <nav className="border-b border-purple-500/20 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ZumpFun
              </h1>
              <span className="ml-2 text-xs text-purple-300 bg-purple-900/50 px-2 py-1 rounded">
                Private Launch
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Launch
              </a>
              <a
                href="/market"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Market
              </a>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-purple-500/20 bg-gray-900/50 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-400 text-sm">
            ZumpFun - Privacy-First Token Launches on Ztarknet
          </p>
        </div>
      </footer>
    </div>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <StarknetConfig connectors={connectors} autoConnect>
      <ThemeProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<TokenLaunch />} />
              <Route path="/market" element={<MarketView />} />
              <Route path="/market/:tokenAddress" element={<MarketView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </StarknetConfig>
  );
};

export default App;
