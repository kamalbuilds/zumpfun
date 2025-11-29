import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { WalletConnect } from './components/WalletConnect';
import { DevModeToggle } from './components/DevModeToggle';
import { NetworkBanner } from './components/NetworkBanner';
import { DevModeProvider } from './hooks/useDevAccount';
import Landing from './pages/Landing';
import Launch from './pages/Launch';
import Market from './pages/Market';
import TokenDetail from './pages/TokenDetail';
import { Toaster } from './components/ui/sonner';
import { Rocket, Store } from 'lucide-react';
import './styles/global.css';

// Note: WalletProvider handles Starknet configuration internally

// Layout component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Launch', icon: Rocket },
    { path: '/market', label: 'Market', icon: Store },
  ];

  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      {/* Modern Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight">
                  ZumpFun
                </span>
                <span className="text-xs text-gray-400 font-medium -mt-1">
                  Privacy Launchpad
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="ml-4 pl-4 border-l border-white/10 flex items-center gap-3">
                <DevModeToggle />
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 ZumpFun. Privacy-first token launches on Ztarknet.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Docs</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <DevModeProvider>
      <BrowserRouter>
        <NetworkBanner />
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/launch" element={<Launch />} />
            <Route path="/market" element={<Market />} />
            <Route path="/token/:tokenAddress" element={<TokenDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Toaster />
      </BrowserRouter>
    </DevModeProvider>
  );
};

export default App;
