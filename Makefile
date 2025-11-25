# ZumpFun Development Makefile
# Comprehensive automation for development, testing, and deployment

.PHONY: help setup build test deploy-devnet deploy-mainnet prove verify clean install-deps

# Default target
help:
	@echo "ZumpFun Development Commands"
	@echo "============================"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup              - Install all dependencies and setup environment"
	@echo "  make install-deps       - Install system dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make build              - Build all components (contracts, circuits, frontend)"
	@echo "  make build-contracts    - Build Cairo contracts only"
	@echo "  make build-circuits     - Build Noir circuits only"
	@echo "  make build-frontend     - Build frontend only"
	@echo ""
	@echo "Testing:"
	@echo "  make test               - Run all test suites"
	@echo "  make test-contracts     - Run contract tests"
	@echo "  make test-circuits      - Run circuit tests"
	@echo "  make test-frontend      - Run frontend tests"
	@echo "  make test-e2e           - Run end-to-end tests"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-devnet      - Deploy to Starknet devnet (local)"
	@echo "  make deploy-testnet     - Deploy to Starknet testnet"
	@echo "  make deploy-mainnet     - Deploy to Starknet mainnet"
	@echo ""
	@echo "Zero-Knowledge:"
	@echo "  make prove              - Generate example ZK proofs"
	@echo "  make verify             - Verify proofs on-chain"
	@echo "  make generate-verifier  - Generate Cairo verifiers with Garaga"
	@echo ""
	@echo "Development Environment:"
	@echo "  make docker-up          - Start local development environment"
	@echo "  make docker-down        - Stop local development environment"
	@echo "  make devnet-start       - Start Starknet devnet"
	@echo "  make devnet-stop        - Stop Starknet devnet"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean              - Clean build artifacts"
	@echo "  make lint               - Run linters"
	@echo "  make format             - Format code"
	@echo ""

# Setup and Installation
setup:
	@echo "🚀 Setting up ZumpFun development environment..."
	@./scripts/setup_environment.sh
	@echo "✅ Setup complete!"

install-deps:
	@echo "📦 Installing system dependencies..."
	@./scripts/setup_environment.sh --deps-only
	@echo "✅ Dependencies installed!"

# Build Targets
build: build-contracts build-circuits build-frontend
	@echo "✅ All components built successfully!"

build-contracts:
	@echo "🏗️  Building Cairo contracts..."
	@cd contracts && scarb build
	@echo "✅ Contracts built!"

build-circuits:
	@echo "🔐 Building Noir circuits..."
	@cd zk-circuits && nargo compile
	@echo "✅ Circuits compiled!"

build-frontend:
	@echo "🎨 Building frontend..."
	@cd frontend && npm run build
	@echo "✅ Frontend built!"

# Testing Targets
test: test-contracts test-circuits test-frontend
	@echo "✅ All tests passed!"

test-contracts:
	@echo "🧪 Testing Cairo contracts..."
	@cd contracts && scarb test
	@echo "✅ Contract tests passed!"

test-circuits:
	@echo "🔐 Testing ZK circuits..."
	@cd zk-circuits && nargo test
	@echo "✅ Circuit tests passed!"

test-frontend:
	@echo "🎨 Testing frontend..."
	@cd frontend && npm test
	@echo "✅ Frontend tests passed!"

test-e2e:
	@echo "🔄 Running end-to-end tests..."
	@cd backend && npm run test:e2e
	@echo "✅ E2E tests passed!"

# Deployment Targets
deploy-devnet:
	@echo "🚀 Deploying to Starknet devnet..."
	@./scripts/deploy_contracts.sh --network devnet
	@echo "✅ Deployed to devnet!"

deploy-testnet:
	@echo "🚀 Deploying to Starknet testnet..."
	@./scripts/deploy_contracts.sh --network testnet
	@echo "✅ Deployed to testnet!"

deploy-mainnet:
	@echo "🚀 Deploying to Starknet mainnet..."
	@read -p "⚠️  Are you sure you want to deploy to mainnet? (yes/no): " confirm && \
	if [ "$$confirm" = "yes" ]; then \
		./scripts/deploy_contracts.sh --network mainnet; \
		echo "✅ Deployed to mainnet!"; \
	else \
		echo "❌ Deployment cancelled"; \
	fi

# Zero-Knowledge Operations
prove:
	@echo "🔐 Generating example ZK proofs..."
	@cd zk-circuits && nargo prove
	@echo "✅ Proofs generated!"

verify:
	@echo "🔍 Verifying proofs on-chain..."
	@cd zk-circuits && nargo verify
	@./scripts/verify_on_chain.sh
	@echo "✅ Proofs verified!"

generate-verifier:
	@echo "🔧 Generating Cairo verifiers with Garaga..."
	@./scripts/generate_verifier.sh
	@echo "✅ Verifiers generated!"

# Docker and Development Environment
docker-up:
	@echo "🐳 Starting Docker development environment..."
	@docker-compose up -d
	@echo "✅ Development environment started!"

docker-down:
	@echo "🐳 Stopping Docker development environment..."
	@docker-compose down
	@echo "✅ Development environment stopped!"

devnet-start:
	@echo "🌐 Starting Starknet devnet..."
	@docker-compose up -d starknet-devnet
	@echo "✅ Starknet devnet started on http://localhost:5050"

devnet-stop:
	@echo "🌐 Stopping Starknet devnet..."
	@docker-compose stop starknet-devnet
	@echo "✅ Starknet devnet stopped!"

# Utility Targets
clean:
	@echo "🧹 Cleaning build artifacts..."
	@cd contracts && scarb clean || true
	@cd zk-circuits && rm -rf target proofs || true
	@cd frontend && rm -rf build dist .next || true
	@cd backend && rm -rf dist || true
	@echo "✅ Clean complete!"

lint:
	@echo "🔍 Running linters..."
	@cd contracts && scarb fmt --check || true
	@cd frontend && npm run lint || true
	@cd backend && npm run lint || true
	@echo "✅ Linting complete!"

format:
	@echo "✨ Formatting code..."
	@cd contracts && scarb fmt || true
	@cd frontend && npm run format || true
	@cd backend && npm run format || true
	@echo "✅ Formatting complete!"

# Development Workflow Shortcuts
dev-backend:
	@echo "🚀 Starting backend development server..."
	@cd backend && npm run dev

dev-frontend:
	@echo "🎨 Starting frontend development server..."
	@cd frontend && npm run dev

dev-full:
	@echo "🚀 Starting full development environment..."
	@make docker-up
	@make dev-backend & make dev-frontend

# Database Operations
db-migrate:
	@echo "🗄️  Running database migrations..."
	@cd backend && npm run migrate
	@echo "✅ Migrations complete!"

db-seed:
	@echo "🌱 Seeding database..."
	@cd backend && npm run seed
	@echo "✅ Database seeded!"

db-reset:
	@echo "🔄 Resetting database..."
	@cd backend && npm run db:reset
	@echo "✅ Database reset!"

# Security and Auditing
audit:
	@echo "🔒 Running security audits..."
	@cd contracts && scarb build --check || true
	@cd frontend && npm audit || true
	@cd backend && npm audit || true
	@echo "✅ Audit complete!"

# Performance Testing
perf-test:
	@echo "⚡ Running performance tests..."
	@cd backend && npm run test:perf
	@echo "✅ Performance tests complete!"

# Documentation
docs:
	@echo "📚 Generating documentation..."
	@cd contracts && scarb doc || true
	@cd frontend && npm run docs || true
	@echo "✅ Documentation generated!"

# Git Hooks Setup
hooks:
	@echo "🪝 Setting up git hooks..."
	@cp scripts/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "✅ Git hooks installed!"
