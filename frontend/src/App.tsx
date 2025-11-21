import React from 'react';
import './App.css';

/**
 * ZumpFun - Main Application Component
 * Privacy-first meme token launcher on Starknet
 */

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🎭 ZumpFun</h1>
        <p>Zero-Knowledge Meme Token Launcher</p>
        <p className="subtitle">
          Create tokens anonymously with privacy-preserving zero-knowledge proofs
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>🔒 Private</h3>
            <p>Anonymous token creation with ZK proofs</p>
          </div>

          <div className="feature-card">
            <h3>⚡ Fast</h3>
            <p>Deployed on Starknet L2</p>
          </div>

          <div className="feature-card">
            <h3>📈 Fair</h3>
            <p>Bonding curve price discovery</p>
          </div>

          <div className="feature-card">
            <h3>💧 Liquid</h3>
            <p>Automatic liquidity provision</p>
          </div>
        </div>

        <div className="cta-section">
          <button className="btn-primary">
            Connect Wallet
          </button>
          <button className="btn-secondary">
            Learn More
          </button>
        </div>

        <div className="status-bar">
          <span>🟢 Testnet Active</span>
          <span>📊 0 Tokens Launched</span>
          <span>💎 $0 TVL</span>
        </div>
      </header>
    </div>
  );
}

export default App;
