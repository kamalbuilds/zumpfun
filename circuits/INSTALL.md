# ZumpFun Circuits - Installation & Setup Guide

## Prerequisites

### System Requirements
- **OS**: macOS, Linux, or Windows (WSL2)
- **RAM**: Minimum 8GB, recommended 16GB+
- **Disk**: 2GB free space for Noir toolchain
- **CPU**: Multi-core processor recommended for faster proving

### Software Dependencies
- **Rust**: 1.70.0 or later
- **Node.js**: 16.x or later (for integration)
- **Git**: For version control

---

## Step 1: Install Rust

```bash
# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Configure current shell
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

---

## Step 2: Install Noir

### Option A: Using noirup (Recommended)

```bash
# Install noirup (Noir version manager)
curl -L https://noir-lang.org/install | bash

# Restart shell or source config
source ~/.bashrc  # or ~/.zshrc on macOS

# Install latest Noir
noirup

# Verify installation
nargo --version
```

### Option B: Manual Installation

```bash
# Clone Noir repository
git clone https://github.com/noir-lang/noir.git
cd noir

# Build from source
cargo build --release

# Add to PATH
export PATH="$PWD/target/release:$PATH"

# Verify
nargo --version
```

Expected output: `nargo version = 0.23.0` (or later)

---

## Step 3: Clone ZumpFun Repository

```bash
# Clone the repository
git clone https://github.com/zumpfun/zumpfun.git
cd zumpfun/circuits

# Verify structure
ls -la
# Should see: Nargo.toml, src/, README.md, etc.
```

---

## Step 4: Install Circuit Dependencies

```bash
# Navigate to circuits directory
cd circuits

# Check circuit configuration
cat Nargo.toml

# Install dependencies (if any external packages)
# Currently using only std library, so no additional installs needed
```

---

## Step 5: Verify Installation

### Check Circuits

```bash
# Type check all circuits
nargo check

# Expected output:
# Constraint system successfully built!
```

### Run Tests

```bash
# Run all tests
nargo test

# Expected output:
# [contribution] Testing...
# [contribution] 5 tests passed
# [eligibility] Testing...
# [eligibility] 6 tests passed
# [allocation] Testing...
# [allocation] 6 tests passed
# [disclosure] Testing...
# [disclosure] 6 tests passed
```

### Compile Circuits

```bash
# Compile to ACIR (Abstract Circuit Intermediate Representation)
nargo compile

# Output files created in target/ directory
ls target/
# Should see: contribution.json, eligibility.json, allocation.json, disclosure.json
```

---

## Step 6: Generate Keys (Optional)

For production use, generate proving and verification keys:

```bash
# Generate keys for contribution circuit
nargo prove --circuit contribution

# Generate keys for eligibility circuit
nargo prove --circuit eligibility

# Generate keys for allocation circuit
nargo prove --circuit allocation

# Generate keys for disclosure circuit
nargo prove --circuit disclosure

# Keys stored in target/ directory
```

---

## Troubleshooting

### Issue: `nargo: command not found`

**Solution**: Ensure Noir is in your PATH

```bash
# Check if noirup installed correctly
which noirup

# If not found, reinstall
curl -L https://noir-lang.org/install | bash
source ~/.bashrc  # or ~/.zshrc

# Try installing Noir again
noirup
```

---

### Issue: `failed to compile circuits`

**Solution**: Update Noir to latest version

```bash
# Update Noir
noirup

# Clean and rebuild
nargo clean
nargo compile
```

---

### Issue: `std library not found`

**Solution**: Noir may need to download standard library

```bash
# Force recompile with dependency fetch
nargo compile --force

# If still failing, check Nargo.toml
cat Nargo.toml
# Ensure compiler_version is set correctly
```

---

### Issue: `tests failing`

**Solution**: Check circuit syntax and dependencies

```bash
# Run tests with verbose output
nargo test --show-output

# Check specific failing test
nargo test test_name --show-output

# Verify Noir version compatibility
nargo --version  # Should be >= 0.23.0
```

---

### Issue: `out of memory during proving`

**Solution**: Increase system resources or reduce circuit complexity

```bash
# Use smaller test inputs
# Or increase swap space (Linux)
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# macOS: Restart with more RAM allocated
```

---

## Development Setup

### VS Code Integration

```bash
# Install Noir extension for VS Code
code --install-extension noir-lang.noir

# Open project
code .
```

### Recommended VS Code Settings

```json
{
  "noir.enableLanguageServer": true,
  "noir.autoFormatOnSave": true,
  "editor.formatOnSave": true,
  "files.associations": {
    "*.nr": "noir"
  }
}
```

---

## IDE Configuration

### Vim/Neovim

```bash
# Install Noir syntax highlighting
git clone https://github.com/noir-lang/noir-vim.git
cp -r noir-vim/* ~/.vim/

# For Neovim
mkdir -p ~/.config/nvim/syntax
cp noir-vim/syntax/noir.vim ~/.config/nvim/syntax/
```

### Emacs

```bash
# Install noir-mode
git clone https://github.com/noir-lang/noir-mode.git
cp noir-mode/noir-mode.el ~/.emacs.d/

# Add to init.el
echo '(require "noir-mode")' >> ~/.emacs.d/init.el
```

---

## Testing Your Installation

Create a simple test circuit:

```bash
# Create test directory
mkdir -p test-circuit/src

# Create Nargo.toml
cat > test-circuit/Nargo.toml << EOF
[package]
name = "test_circuit"
type = "bin"
authors = ["You"]
compiler_version = ">=0.23.0"
EOF

# Create simple circuit
cat > test-circuit/src/main.nr << EOF
fn main(x: Field, y: pub Field) {
    assert(x + 1 == y);
}
EOF

# Test it
cd test-circuit
nargo check
nargo test
```

If this works, your installation is successful!

---

## Integration with Backend

### Install Backend Dependencies

```bash
cd ../backend
npm install

# Install proof generation library
npm install @noir-lang/noir_js @noir-lang/backend_barretenberg
```

### Test Backend Integration

```typescript
// test-proof.ts
import { compile, createFileManager } from '@noir-lang/noir_wasm';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';

async function testProof() {
    const fm = createFileManager('/');
    const compiled = await compile(fm);
    const backend = new BarretenbergBackend(compiled.program);

    const witness = { x: '1', y: '2' };
    const proof = await backend.generateProof(witness);

    console.log('Proof generated:', proof);
}

testProof();
```

```bash
# Run test
npx ts-node test-proof.ts
```

---

## Performance Optimization

### WASM Compilation

```bash
# Compile circuits to WASM for browser use
nargo compile --target wasm

# Output in target/wasm/
ls target/wasm/
```

### Parallel Proving

```bash
# Set number of threads for proving
export RAYON_NUM_THREADS=8

# Prove with parallel execution
nargo prove
```

### Caching

```bash
# Enable aggressive caching
export NOIR_CACHE_DIR=~/.cache/noir
mkdir -p $NOIR_CACHE_DIR
```

---

## Production Deployment

### 1. Generate Production Keys

```bash
# Generate all keys
./scripts/generate-keys.sh

# Backup keys securely
tar -czf keys-backup.tar.gz target/*.keys
# Store in secure location
```

### 2. Build Verifier Contracts

```bash
# Export Solidity verifiers
nargo codegen-verifier --circuit contribution --output ../contracts/verifiers/
nargo codegen-verifier --circuit eligibility --output ../contracts/verifiers/
nargo codegen-verifier --circuit allocation --output ../contracts/verifiers/
nargo codegen-verifier --circuit disclosure --output ../contracts/verifiers/
```

### 3. Deploy to Production

```bash
# Compile for production
nargo compile --release

# Verify all tests pass
nargo test

# Deploy verifier contracts
cd ../contracts
npx hardhat deploy --network mainnet
```

---

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/circuits.yml
name: Circuits CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Noir
        run: |
          curl -L https://noir-lang.org/install | bash
          source ~/.bashrc
          noirup
      - name: Check circuits
        run: |
          cd circuits
          nargo check
      - name: Run tests
        run: |
          cd circuits
          nargo test
      - name: Compile
        run: |
          cd circuits
          nargo compile
```

---

## Updating Circuits

### Version Upgrade

```bash
# Check current version
nargo --version

# Upgrade Noir
noirup

# Update circuit dependencies
cd circuits
nargo check --update-dependencies

# Recompile
nargo clean
nargo compile

# Run tests
nargo test
```

---

## Getting Help

### Resources
- **Noir Documentation**: https://noir-lang.org/docs
- **Discord**: https://discord.gg/noir
- **GitHub Issues**: https://github.com/noir-lang/noir/issues

### Common Commands Reference

```bash
nargo check              # Type check circuits
nargo test              # Run all tests
nargo test <name>       # Run specific test
nargo compile           # Compile circuits
nargo prove             # Generate proof
nargo verify            # Verify proof
nargo clean             # Clean build artifacts
nargo info              # Show circuit info
nargo --help            # Show all commands
```

---

## Next Steps

After successful installation:

1. **Read Documentation**: Check `README.md` and `SPECIFICATIONS.md`
2. **Run Examples**: Try the integration examples
3. **Explore Tests**: Look at test cases in each circuit
4. **Integrate**: Connect circuits with backend and contracts
5. **Optimize**: Profile and optimize for your use case

---

## Support

For issues specific to ZumpFun circuits:
- Open issue on GitHub
- Contact: dev@zumpfun.io
- Discord: [ZumpFun Community](#)

---

**Last Updated**: 2025-11-27
**Version**: 1.0.0
