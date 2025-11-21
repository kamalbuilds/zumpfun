/**
 * ZumpFun Backend Service
 * REST API for proof generation and event indexing
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

// API routes
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'ZumpFun API is running',
    network: process.env.STARKNET_NETWORK || 'sepolia',
    features: {
      zkProofs: true,
      indexing: true,
      analytics: false,
    },
  });
});

// Proof generation endpoint (to be implemented)
app.post('/api/v1/proof/generate', async (req, res) => {
  try {
    const { secret, randomness } = req.body;

    if (!secret || !randomness) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // TODO: Implement proof generation
    res.json({
      success: false,
      message: 'Proof generation not yet implemented',
    });
  } catch (error) {
    console.error('Proof generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Token list endpoint (to be implemented)
app.get('/api/v1/tokens', async (req, res) => {
  try {
    // TODO: Fetch from indexer
    res.json({
      tokens: [],
      total: 0,
    });
  } catch (error) {
    console.error('Token list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ZumpFun Backend running on port ${PORT}`);
  console.log(`📡 Network: ${process.env.STARKNET_NETWORK || 'sepolia'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
});

export default app;
