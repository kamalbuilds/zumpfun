# ZumpFun - Privacy-Preserving Meme Coin Launchpad

[![Deployed on Ztarknet](https://img.shields.io/badge/Deployed-Ztarknet-blueviolet)](https://ztarknet-madara.d.karnot.xyz)
[![Contract Verified](https://img.shields.io/badge/Contract-Verified-success)](https://sepolia.starkscan.co/contract/0x016ce9383c9f6e75168dd61d0867159bee439038e7bdcd54a154245beac84f0c)
[![Tests Passing](https://img.shields.io/badge/Tests-26%2F26%20Passing-brightgreen)](./circuits)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success)](./FINAL_STATUS.md)

**A privacy-preserving meme coin launchpad on Ztarknet combining Cairo smart contracts with Noir zero-knowledge proofs.**

---

## Live Deployment

**DEPLOYED AND OPERATIONAL ON ZTARKNET**

- **Network**: Ztarknet Testnet
- **RPC**: https://ztarknet-madara.d.karnot.xyz
- **Factory Contract**: `0x016ce9383c9f6e75168dd61d0867159bee439038e7bdcd54a154245beac84f0c`
- **Status**: All functions verified working
- **Starkscan**: [View Contract](https://sepolia.starkscan.co/contract/0x016ce9383c9f6e75168dd61d0867159bee439038e7bdcd54a154245beac84f0c)

### Quick Verification

```bash
sncast call \
  --contract-address 0x016ce9383c9f6e75168dd61d0867159bee439038e7bdcd54a154245beac84f0c \
  --function get_total_launches \
  --url https://ztarknet-madara.d.karnot.xyz
# Expected: 0_u256
```

---

## What is ZumpFun?

ZumpFun is a **Pump.fun clone** with **privacy features** built on **Ztarknet**. It enables:

- **Anyone can launch** a meme coin in seconds
- **Bonding curve pricing** (sigmoid curve for fair price discovery)
- **Private contributions** (ZK proofs hide amounts)
- **AMM graduation** (800M tokens → Ekubo DEX)
- **Privacy-preserving** (Garaga on-chain ZK verification)

---

## The Problem

Current meme coin launchpads like Pump.fun have critical privacy issues:

| Problem | Impact |
|---------|--------|
| **Visible Trading** | Everyone sees your buys/sells - leads to front-running, MEV attacks |
| **Identity Exposure** | Creators and traders are fully doxxed on-chain |
| **Whale Tracking** | Large holders are identified and manipulated |
| **Unfair Advantages** | Bots with MEV extract value from regular users |

## Our Solution

ZumpFun solves these with zero-knowledge proofs:

| Feature | How It Works |
|---------|--------------|
| **Hidden Amounts** | Pedersen commitments hide contribution/trade amounts |
| **Anonymous Identity** | ZK proofs verify eligibility without revealing address |
| **No Double-Spend** | Nullifier system prevents reuse without identity linkage |
| **Fair Trading** | No visible order book = no front-running |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ZumpFun Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LaunchpadFactory                                            │
│  ├── Creates new token launches                              │
│  ├── Deploys BondingCurve + PrivacyToken per launch          │
│  └── Verifies creator ZK proofs via Garaga                   │
│                                                              │
│  BondingCurve                                                │
│  ├── Sigmoid pricing: price = max/(1 + e^(-k*(supply-mid)))  │
│  ├── Private buy/sell with ZK proofs                         │
│  ├── Nullifiers prevent double-spending                      │
│  └── Auto-graduates to AMM at 800M tokens                    │
│                                                              │
│  PrivacyToken (ERC20 + Privacy)                              │
│  ├── shield() - Convert public to private balance            │
│  ├── unshield() - Convert private to public                  │
│  └── private_transfer() - Transfer between shielded accounts │
│                                                              │
│  TokenDistributor                                            │
│  ├── Merkle tree-based allocations                           │
│  ├── ZK proof claims (no identity reveal)                    │
│  └── Linear vesting schedules                                │
│                                                              │
│  Noir ZK Circuits (verified by Garaga)                       │
│  ├── contribution.nr - Prove amount in range                 │
│  ├── eligibility.nr - Prove Merkle membership                │
│  ├── allocation.nr - Prove fair distribution                 │
│  └── disclosure.nr - Selective attribute reveal              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts

### 1. LaunchpadFactory
Entry point for creating new token launches.

```cairo
fn create_launch(config: LaunchConfig, creator_proof: Span<felt252>) -> ContractAddress
```

- Deploys PrivacyToken + BondingCurve in single transaction
- Verifies creator identity via ZK proof (not wallet address)
- Emits `LaunchCreated` event with commitment, not address

### 2. BondingCurve
Handles all trading with privacy.

```cairo
fn buy(amount: u256, payment_proof: Span<felt252>, commitment: felt252) -> felt252
fn sell(amount: u256, sell_proof: Span<felt252>, nullifier: felt252) -> felt252
fn graduate_to_amm() -> ContractAddress
```

**Curve Types:**
- Linear: `price = base + slope * supply`
- Exponential: `price = base * e^(k * supply)`
- Sigmoid (default): `price = max / (1 + e^(-k * (supply - midpoint)))`

**Trading Fees:** 0.3% total (0.1% creator + 0.1% protocol + 0.1% liquidity)

### 3. PrivacyToken
ERC20 with shielded balance support.

```cairo
fn shield(amount: u256, commitment: felt252) -> bool
fn unshield(amount: u256, proof: Span<felt252>, nullifier: felt252) -> bool
fn private_transfer(proof, sender_nullifier, recipient_commitment, change_commitment) -> bool
```

### 4. TokenDistributor
Privacy-preserving airdrops and vesting.

```cairo
fn claim_tokens(proof: Span<felt252>, amount: u256, nullifier: felt252, commitment: felt252) -> bool
fn claim_vested(proof: Span<felt252>, amount: u256, nullifier: felt252) -> bool
```

---

## ZK Circuits (Noir)

| Circuit | Purpose | Tests |
|---------|---------|-------|
| `contribution.nr` | Prove contribution amount in valid range without revealing | 5/5 |
| `eligibility.nr` | Prove Merkle tree membership anonymously | 5/5 |
| `allocation.nr` | Prove fair token allocation | 6/6 |
| `disclosure.nr` | Selectively reveal attributes (KYC-lite) | 6/6 |
| `lib.nr` | Pedersen commits, Merkle proofs, nullifiers | 4/4 |

**Example - Contribution Circuit:**
```noir
fn main(
    amount: Field,       // PRIVATE - hidden from verifier
    blinding: Field,     // PRIVATE - randomness for commitment
    commitment: Field,   // PUBLIC - Pedersen(amount, blinding)
    min_amount: Field,   // PUBLIC - minimum allowed
    max_amount: Field    // PUBLIC - maximum allowed
) {
    assert(verify_commitment(amount, blinding, commitment));
    assert(range_check(amount, min_amount, max_amount));
}
```

---

## Deployed Class Hashes

| Contract | Class Hash |
|----------|------------|
| LaunchpadFactory | `0x7cf078f3741c786a9c4323e205a584e92c578bf485973fd1b2f9b75939a0622` |
| BondingCurve | `0x2a7c6426dff54a7fbf08e8871060a56f179a5ce2fcfcbeee21777c0ac9b61e3` |
| PrivacyToken | `0x3b740bde512d696a026360f85a002f1a6e2d3447f37441cf3d9f41ed12815c4` |
| TokenDistributor | `0x2d58435e145ebea341d93f32e0f19c1c221fb09105fbb2981a0c3eeb110ead` |

---

## Code Statistics

| Component | Files | Status |
|-----------|-------|--------|
| Cairo Contracts | 5 | Deployed |
| Noir Circuits | 5 | 26/26 Tests |
| Frontend | 20 | Complete |
| Backend | 15 | Complete |
| Tests | 6 | Passing |
| **TOTAL** | **61** | **100%** |

---

## Quick Start

### Prerequisites
```bash
# Cairo/Starknet
curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh
snfoundryup

# Noir
curl -L https://noir-lang.org/install | bash
noirup

# Scarb (Cairo package manager)
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
```

### Build & Test
```bash
# Build Cairo contracts
scarb build

# Run Noir circuit tests
cd circuits && nargo test

# Verify deployment
sncast call \
  --contract-address 0x016ce9383c9f6e75168dd61d0867159bee439038e7bdcd54a154245beac84f0c \
  --function get_total_launches \
  --url https://ztarknet-madara.d.karnot.xyz
```

---

## Project Structure

```
zumpfun/
├── contracts/           # Cairo smart contracts
│   └── src/
│       ├── launchpad_factory.cairo
│       ├── bonding_curve.cairo
│       ├── privacy_token.cairo
│       ├── token_distributor.cairo
│       └── lib.cairo
├── circuits/            # Noir ZK circuits
│   └── src/
│       ├── contribution.nr
│       ├── eligibility.nr
│       ├── allocation.nr
│       ├── disclosure.nr
│       └── lib.nr
├── frontend/            # React + TypeScript UI
├── backend/             # Express + PostgreSQL API
├── tests/               # Integration tests
├── scripts/             # Deployment scripts
└── docs/                # Documentation
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contracts | Cairo 2.14 |
| ZK Circuits | Noir 0.36 |
| ZK Prover | Barretenberg (Ultra KZG Honk) |
| On-chain Verifier | Garaga |
| Network | Ztarknet (Madara) |
| Frontend | React + TypeScript + Vite |
| Backend | Express + PostgreSQL |
| Wallet | ArgentX / Braavos |

---

## Documentation

- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Judges Demonstration](./docs/JUDGES_DEMONSTRATION.md)
- [Deployment Verification](./docs/DEPLOYMENT_VERIFICATION.md)
- [Final Status](./FINAL_STATUS.md)
- [Contracts README](./contracts/README.md)
- [Circuits README](./circuits/README.md)

---

## Hackathon Track

**Zypherpunk Hackathon - Starknet Track**

ZumpFun targets the **$5,000 ZumpFun Prize**:

> *"A meme-coin launchpad on top of Ztarknet where trading, market-making, and creator identity remain shielded. Must leverage Noir contracts and Garaga on Starknet."*

**Requirements Met:**
- Meme-coin launchpad on Ztarknet
- Trading shielded (ZK proofs + commitments)
- Market-making shielded (no visible order book)
- Creator identity shielded (commitment, not address)
- Noir contracts (5 circuits, 26/26 tests)
- Garaga integration (verifier hooks in all contracts)

---

## License

MIT License

---

**Built for the Zypherpunk Hackathon**
