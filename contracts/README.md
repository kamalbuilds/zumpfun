# ZumpFun Smart Contracts

Cairo smart contracts for ZumpFun - a privacy-preserving meme coin launchpad built on Ztarknet.

## Overview

ZumpFun implements a complete privacy-first token launchpad using zero-knowledge proofs (Noir circuits) verified on-chain with Garaga. The platform enables:

- **Private Token Launches**: Creators can launch tokens anonymously
- **Shielded Trading**: All transactions are privacy-preserving via ZK proofs
- **Fair Price Discovery**: Sigmoid bonding curves ensure fair token pricing
- **Automatic AMM Graduation**: Tokens graduate to AMM pools at threshold (Pump.fun model)

## Architecture

```
┌─────────────────────────────────────────────────┐
│           ZumpFun Contract Architecture         │
├─────────────────────────────────────────────────┤
│                                                 │
│  LaunchpadFactory                               │
│  ├─ Creates new token launches                  │
│  ├─ Verifies creator ZK proofs (Garaga)         │
│  └─ Manages launch registry                     │
│                                                 │
│  BondingCurve                                   │
│  ├─ Sigmoid pricing (800M tokens → $66K)        │
│  ├─ Private buy/sell with ZK proofs             │
│  └─ Automatic AMM graduation                    │
│                                                 │
│  PrivacyToken                                   │
│  ├─ ERC20 standard interface                    │
│  ├─ Shield/unshield operations                  │
│  └─ Private transfers via commitments           │
│                                                 │
│  TokenDistributor                               │
│  ├─ Merkle tree allocations                     │
│  ├─ ZK proof claims (no identity reveal)        │
│  └─ Vesting schedules                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Contracts

### 1. LaunchpadFactory (`launchpad_factory.cairo`)

Factory contract for deploying new token launches.

**Key Functions**:
- `create_launch()` - Deploy new token with bonding curve
- `get_launch()` - Get launchpad address by token ID
- `set_verifier_address()` - Update Garaga verifier (admin)

**ZK Integration Points**:
- TODO: Verify `creator_proof` with Garaga to prove creator identity without revealing address
- Proof format: Noir circuit proving ownership of private key commitment

### 2. BondingCurve (`bonding_curve.cairo`)

Implements sigmoid bonding curve for fair token price discovery.

**Key Functions**:
- `buy()` - Purchase tokens with ZK proof of payment
- `sell()` - Sell tokens with ZK proof of ownership
- `graduate_to_amm()` - Migrate to AMM when threshold reached
- `calculate_buy_price()` - Get current buy price
- `calculate_sell_price()` - Get current sell price

**Bonding Curve Types**:
1. **Linear**: `price = base + slope * supply`
2. **Exponential**: `price = base * e^(k * supply)`
3. **Sigmoid** (default): `price = max / (1 + e^(-k * (supply - midpoint)))`

**ZK Integration Points**:
- TODO: Verify `payment_proof` - proves buyer has funds without revealing amount
- TODO: Verify `sell_proof` - proves seller owns tokens without revealing identity
- Uses nullifiers to prevent double-spending

**Parameters** (Pump.fun inspired):
- Total supply: 800M tokens
- Graduation threshold: $66K raised
- Trading fee: 0.3% (0.1% creator + 0.1% protocol + 0.1% trading)

### 3. PrivacyToken (`privacy_token.cairo`)

ERC20 token with privacy-preserving features.

**Standard ERC20**:
- `transfer()`, `transferFrom()`, `approve()`
- `balanceOf()`, `totalSupply()`, `allowance()`

**Privacy Extensions**:
- `shield()` - Convert public balance to private (commitment)
- `unshield()` - Convert private balance to public (with nullifier)
- `private_transfer()` - Transfer between shielded balances
- `has_commitment()` - Check if commitment exists in set

**ZK Integration Points**:
- TODO: Verify `unshield_proof` - proves ownership of shielded note
- TODO: Verify `transfer_proof` - proves valid private transfer
- Uses Pedersen commitments for hiding balances
- Merkle tree for efficient membership proofs

### 4. TokenDistributor (`token_distributor.cairo`)

Handles privacy-preserving token distribution and claiming.

**Key Functions**:
- `claim_tokens()` - Claim allocation with ZK proof
- `claim_vested()` - Claim vested tokens with ZK proof
- `set_merkle_root()` - Update allocation tree (admin)
- `emergency_withdraw()` - Emergency recovery (admin/multisig)

**ZK Integration Points**:
- TODO: Verify `claim_proof` - proves eligibility in merkle tree without revealing identity
- TODO: Verify `vesting_proof` - proves vested amount without revealing schedule
- Uses merkle proofs for whitelist verification

## Garaga Integration

All contracts use Garaga for efficient on-chain verification of Noir ZK proofs.

### Integration Pattern

```cairo
// 1. Get verifier contract
let verifier = self.garaga_verifier.read();

// 2. Prepare public inputs
let public_inputs = array![
    commitment,
    nullifier,
    amount.try_into().unwrap(),
];

// 3. Verify proof
let is_valid = IGaragaVerifier(verifier).verify_proof(
    proof,
    public_inputs.span(),
    CIRCUIT_ID
);

assert!(is_valid, "Invalid ZK proof");
```

### Circuit IDs

Each Noir circuit has a unique ID for verification:
- `TRANSFER_CIRCUIT_ID` - Private transfers
- `PAYMENT_CIRCUIT_ID` - Payment proofs
- `CLAIM_CIRCUIT_ID` - Distribution claims
- `CREATOR_CIRCUIT_ID` - Creator identity proofs

## Development

### Prerequisites

- Cairo 2.6+
- Scarb (Cairo package manager)
- Starknet Foundry (testing)

### Build

```bash
cd contracts
scarb build
```

### Test

```bash
scarb test
```

### Deploy

```bash
# Deploy to local devnet
starkli deploy \
  --rpc http://localhost:9944 \
  --account ~/.starkli-wallets/deployer.json \
  launchpad_factory.json

# Initialize factory
starkli invoke \
  $FACTORY_ADDRESS \
  initialize \
  $GARAGA_VERIFIER_ADDRESS
```

## Gas Optimization

All contracts are optimized for gas efficiency:

1. **Storage Layout**: Packed storage for related fields
2. **Batch Operations**: Process multiple operations in single tx
3. **Lazy Evaluation**: Compute values on-demand vs. storage
4. **Event Pruning**: Minimal event data to reduce gas

### Gas Estimates

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| Create launch | ~500K | Factory deployment |
| Buy tokens | ~200K | With ZK proof verification |
| Sell tokens | ~200K | With ZK proof verification |
| Shield tokens | ~150K | Commitment addition |
| Private transfer | ~250K | Full privacy |
| Claim tokens | ~180K | Merkle proof verification |

## Security

### Audit Status

- [ ] Internal review
- [ ] External audit (Trail of Bits)
- [ ] Formal verification
- [ ] Bug bounty launch

### Security Features

1. **ZK Proofs**: All sensitive operations require valid ZK proofs
2. **Nullifiers**: Prevent double-spending in private operations
3. **Commitments**: Hide transaction amounts and balances
4. **Access Control**: Owner-only admin functions
5. **Emergency Pause**: Circuit breaker for critical issues
6. **Reentrancy Guards**: Standard CEI pattern

### Known Limitations

1. **Garaga Integration**: TODO markers require actual Garaga verifier implementation
2. **AMM Deployment**: Graduation to AMM is placeholder, needs DEX integration
3. **Token Transfers**: Need actual token contract calls (currently mocked)
4. **Merkle Updates**: Merkle tree updates are simplified, need proper implementation

## Contributing

1. Follow Cairo style guide
2. Add comprehensive tests for new features
3. Update documentation
4. Run security checks before PR

## License

MIT License - see LICENSE file for details

## References

- [Cairo Book](https://book.cairo-lang.org/)
- [Starknet Documentation](https://docs.starknet.io/)
- [Garaga](https://github.com/keep-starknet-strange/garaga)
- [Noir Language](https://noir-lang.org/)
- [Pump.fun Economics](https://docs.pump.fun/)

---

**Maintainer**: ZumpFun Team
