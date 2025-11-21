# ZumpFun - Zero-Knowledge Meme Token Launcher

Privacy-first meme token creation platform on Starknet with Noir-powered zero-knowledge circuits.

## 🎯 Overview

ZumpFun enables anonymous token creation with:
- **Zero-Knowledge Proofs**: Anonymous creator identity via Noir circuits
- **Fair Launch Mechanics**: Bonding curves and liquidity bootstrapping
- **Starknet Integration**: Cairo smart contracts for token management
- **Web3 Frontend**: React-based user interface with wallet integration

## 🏗️ Architecture

```
zumpfun/
├── contracts/          # Cairo smart contracts (Starknet)
├── circuits/           # Noir ZK circuits
├── frontend/           # React web application
├── backend/            # Node.js + Rust services
├── tests/              # Test suites
├── scripts/            # Deployment scripts
└── docs/               # Documentation
```

## 📋 Prerequisites

### Required Tools

1. **Scarb** (Cairo compiler) - v2.8.2+
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
   ```

2. **Nargo** (Noir toolchain) - v0.36.0+
   ```bash
   curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
   noirup
   ```

3. **Node.js** - v18.0.0+
   ```bash
   # Via nvm
   nvm install 18
   nvm use 18
   ```

4. **Rust** (for backend services) - v1.75.0+
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

5. **Starkli** (Starknet CLI)
   ```bash
   curl https://get.starkli.sh | sh
   starkliup
   ```

### Verify Installation

```bash
make check-tools
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
cd zumpfun
make setup
```

### 2. Environment Configuration

Create `.env` files:

```bash
# Root .env
cp .env.example .env

# Frontend .env
cp frontend/.env.example frontend/.env

# Backend .env
cp backend/.env.example backend/.env
```

Required environment variables:
- `STARKNET_RPC_URL`: Starknet RPC endpoint
- `PRIVATE_KEY`: Deployment wallet private key (testnet only)
- `ACCOUNT_ADDRESS`: Starknet account address

### 3. Build All Components

```bash
make build
```

This will:
1. Compile Cairo contracts → `contracts/target/`
2. Compile Noir circuits → `circuits/target/`
3. Build React frontend → `frontend/dist/`
4. Build backend services → `backend/dist/`

### 4. Run Tests

```bash
make test
```

### 5. Start Development

```bash
make dev
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📦 Project Structure

### Contracts (`/contracts`)

Cairo smart contracts for Starknet:

```
contracts/
├── src/
│   ├── lib.cairo                 # Main module
│   ├── token_factory.cairo       # Token creation logic
│   ├── bonding_curve.cairo       # Price discovery
│   ├── liquidity_pool.cairo      # AMM integration
│   └── zkp_verifier.cairo        # ZK proof verification
└── tests/
```

### Circuits (`/circuits`)

Noir zero-knowledge circuits:

```
circuits/
├── src/
│   ├── main.nr                   # Circuit entrypoint
│   ├── identity_proof.nr         # Anonymous identity
│   ├── commitment.nr             # Pedersen commitments
│   └── merkle_proof.nr           # Merkle tree verification
└── Prover.toml                   # Proving parameters
```

### Frontend (`/frontend`)

React application with TypeScript:

```
frontend/
├── src/
│   ├── components/               # React components
│   ├── hooks/                    # Custom hooks
│   ├── services/                 # API clients
│   ├── utils/                    # Helper functions
│   └── App.tsx                   # Main app
├── public/
└── package.json
```

### Backend (`/backend`)

Node.js + Rust microservices:

```
backend/
├── src/
│   ├── api/                      # REST API routes
│   ├── services/                 # Business logic
│   │   ├── prover.rs            # Rust proof generation
│   │   └── indexer.ts           # Event indexing
│   └── utils/                    # Utilities
└── package.json
```

## 🔧 Development Workflow

### Building Components

```bash
# Build everything
make build

# Build specific components
npm run build:contracts
npm run build:circuits
npm run build:frontend
npm run build:backend
```

### Running Tests

```bash
# All tests
make test

# Specific test suites
npm run test:contracts      # Cairo tests
npm run test:circuits       # Noir tests
npm run test:frontend       # React tests
npm run test:backend        # API tests
```

### Code Formatting

```bash
make fmt
```

## 🚀 Deployment

### Testnet Deployment

```bash
make deploy-test
```

This will:
1. Compile all contracts and circuits
2. Generate verification keys
3. Deploy to Starknet Sepolia testnet
4. Save deployment addresses to `deployments/testnet.json`

### Mainnet Deployment

```bash
make deploy-main
```

⚠️ **Warning**: Requires confirmation. Ensure:
- All tests pass
- Contracts are audited
- Mainnet wallet is funded
- Environment variables are correct

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [Smart Contracts](docs/contracts.md)
- [ZK Circuits](docs/circuits.md)
- [API Reference](docs/api.md)
- [Frontend Guide](docs/frontend.md)
- [Deployment Guide](docs/deployment.md)

## 🧪 Testing

### Unit Tests

```bash
# Contract tests
cd contracts && scarb test

# Circuit tests
cd circuits && nargo test

# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

## 🔒 Security

- **Never commit private keys** - Use `.env` files (gitignored)
- **Audit contracts** - Before mainnet deployment
- **Test circuits** - Verify ZK proof soundness
- **Rate limiting** - Implement on API endpoints
- **Input validation** - All user inputs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🆘 Support

- Documentation: [docs/](docs/)
- Issues: GitHub Issues
- Discord: [Coming Soon]

## 🗺️ Roadmap

- [x] Project setup and architecture
- [ ] Core Cairo contracts
- [ ] Noir ZK circuits
- [ ] Frontend MVP
- [ ] Backend services
- [ ] Testnet deployment
- [ ] Security audit
- [ ] Mainnet launch
- [ ] Mobile app
- [ ] Advanced features

---

Built with ❤️ by the ZumpFun Team
