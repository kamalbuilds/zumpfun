# Wallet Integration Documentation

## Overview

The wallet integration system provides a complete solution for connecting Starknet wallets (ArgentX, Braavos) to the ZumpFun platform on Ztarknet testnet.

## Components Created

### 1. useWallet Hook (`/src/hooks/useWallet.ts`)

**Purpose**: Central hook for all wallet operations and state management.

**Features**:
- Connect/disconnect wallet functionality
- Real-time balance tracking
- Network validation (Ztarknet detection)
- Address formatting utilities
- Available wallet detection

**API**:
```typescript
const {
  walletInfo,           // Complete wallet state
  connectWallet,        // Connect to specific wallet
  disconnectWallet,     // Disconnect current wallet
  getAvailableWallets,  // List available wallets
  formatAddress,        // Format address for display
  connectors           // Raw connector objects
} = useWallet();

// walletInfo structure:
{
  address: string;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  network: string;
  isCorrectNetwork: boolean;
}
```

### 2. WalletProvider (`/src/providers/WalletProvider.tsx`)

**Purpose**: Wraps the application with Starknet providers and configuration.

**Configuration**:
- Ztarknet custom chain (Chain ID: `0x534e5f5a454e44`)
- Fallback chains (Sepolia, Mainnet)
- ArgentX and Braavos connectors
- Auto-connect enabled

**Usage**:
```tsx
// In your main App.tsx or index.tsx
import { WalletProvider } from './providers/WalletProvider';

function App() {
  return (
    <WalletProvider>
      <YourApp />
    </WalletProvider>
  );
}
```

### 3. WalletConnect Component (`/src/components/WalletConnect.tsx`)

**Purpose**: User interface for wallet connection/disconnection.

**Features**:
- Beautiful modal-based wallet selection
- Loading states during connection
- Error handling and display
- Network indicator
- Balance display
- Connected state with address and disconnect button
- Links to install wallets if not present

**States**:
- **Disconnected**: Shows "Connect Wallet" button
- **Connecting**: Shows loading state
- **Connected**: Shows network badge, balance, address, and disconnect button

### 4. NetworkBanner Component (`/src/components/NetworkBanner.tsx`)

**Purpose**: Warns users when connected to wrong network.

**Features**:
- Auto-hides when on correct network or disconnected
- Expandable instructions for network switching
- Separate guides for ArgentX and Braavos
- Network configuration details
- Testnet token request information

## Integration Steps

### Step 1: Install Dependencies

```bash
cd frontend
npm install @starknet-react/core @starknet-react/chains starknet
```

### Step 2: Wrap Application

```tsx
// src/App.tsx or src/main.tsx
import { WalletProvider } from './providers/WalletProvider';
import { NetworkBanner } from './components/NetworkBanner';
import { WalletConnect } from './components/WalletConnect';

function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen">
        <NetworkBanner />
        <header className="p-4">
          <nav className="flex justify-between items-center">
            <div>Your Logo</div>
            <WalletConnect />
          </nav>
        </header>
        {/* Rest of your app */}
      </div>
    </WalletProvider>
  );
}
```

### Step 3: Use Wallet in Components

```tsx
import { useWallet } from '../hooks/useWallet';

function YourComponent() {
  const { walletInfo, connectWallet } = useWallet();

  if (!walletInfo.isConnected) {
    return <div>Please connect your wallet</div>;
  }

  if (!walletInfo.isCorrectNetwork) {
    return <div>Please switch to Ztarknet</div>;
  }

  return <div>Connected: {walletInfo.address}</div>;
}
```

## Wallet Integration Approach

### Connection Flow

1. **User clicks "Connect Wallet"**
   - Modal opens with available wallets
   - ArgentX and Braavos displayed with icons

2. **User selects wallet**
   - Loading state shown
   - Browser extension prompts for connection
   - User approves in wallet

3. **Connection established**
   - Address and balance fetched
   - Network validation performed
   - UI updates to connected state

4. **Network validation**
   - Check if Chain ID matches Ztarknet (`0x534e5f5a454e44`)
   - If wrong network, NetworkBanner appears
   - User guided to switch networks

### Disconnection Flow

1. **User clicks disconnect button**
   - Confirmation (implicit through click)
   - Wallet disconnected
   - State cleared
   - UI returns to disconnected state

## Error Handling Strategy

### 1. Connection Errors

**Types**:
- Wallet not installed
- User rejected connection
- Network errors
- Invalid connector

**Handling**:
```typescript
try {
  await connectWallet(connectorId);
} catch (error) {
  // Error displayed in modal
  setError(error.message);
  // Logged to console for debugging
  console.error('Connection error:', error);
}
```

### 2. Network Errors

**Detection**:
- Chain ID mismatch detected
- `isCorrectNetwork` flag set to false
- NetworkBanner automatically appears

**User Action**:
- Clear instructions provided
- Step-by-step guide for both wallets
- Configuration details included

### 3. Transaction Errors

**Future Implementation** (to be added when integrating with contracts):
```typescript
try {
  const tx = await contract.transfer(recipient, amount);
  await account.waitForTransaction(tx.transaction_hash);
} catch (error) {
  if (error.message.includes('user rejected')) {
    // User cancelled transaction
  } else if (error.message.includes('insufficient funds')) {
    // Not enough balance
  } else {
    // Other errors
  }
}
```

### 4. Balance Refresh

- Balance auto-refreshes on block changes (via `watch: true`)
- Manual refresh possible by reconnecting
- Cached in `walletInfo` state

## Configuration

### Ztarknet Network Details

```typescript
const ztarknet: Chain = {
  id: BigInt('0x534e5f5a454e44'),
  name: 'Ztarknet Testnet',
  network: 'ztarknet',
  nativeCurrency: {
    address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: true,
  rpcUrls: {
    default: { http: ['https://ztarknet-rpc.example.com'] },
    public: { http: ['https://ztarknet-rpc.example.com'] },
  },
};
```

**Note**: Update RPC URLs with actual Ztarknet endpoints.

## User Experience Features

### Visual Feedback

1. **Connection States**:
   - Clear button states (disabled, loading)
   - Loading spinners
   - Success indicators

2. **Network Status**:
   - Green badge: Correct network
   - Red badge: Wrong network
   - Yellow banner: Instructions

3. **Balance Display**:
   - Formatted to 4 decimals
   - Updates automatically
   - Clear ETH label

### Accessibility

- ARIA labels on buttons
- Keyboard navigation support
- Screen reader friendly
- Clear error messages

### Mobile Responsiveness

- Modal adapts to small screens
- Touch-friendly buttons
- Responsive padding

## Security Considerations

1. **No Private Key Handling**:
   - All signing done in wallet
   - Never request private keys
   - Use wallet's security model

2. **Network Validation**:
   - Always validate Chain ID
   - Warn on wrong network
   - Prevent transactions on wrong chain

3. **Input Validation**:
   - Validate addresses
   - Check balances before transactions
   - Handle edge cases

4. **Error Exposure**:
   - User-friendly error messages
   - Detailed logs in console (dev only)
   - No sensitive data in errors

## Testing Checklist

- [ ] Connect with ArgentX
- [ ] Connect with Braavos
- [ ] Disconnect wallet
- [ ] Wrong network detection
- [ ] Network switching instructions
- [ ] Balance display accuracy
- [ ] Address formatting
- [ ] Error handling (wallet not installed)
- [ ] Error handling (user rejection)
- [ ] Auto-reconnect on page reload
- [ ] Multiple wallet switching
- [ ] Mobile wallet connection

## Troubleshooting

### Wallet Not Detected

**Issue**: Connectors array is empty
**Solution**: Ensure wallet extensions are installed and enabled

### Wrong Network Persists

**Issue**: Network banner stays after switching
**Solution**: Refresh page after network switch, or check Chain ID configuration

### Balance Not Updating

**Issue**: Balance shows 0 or outdated
**Solution**: Check RPC connection, ensure `watch: true` is set in useBalance

### Connection Rejected

**Issue**: Wallet popup doesn't appear
**Solution**: Check browser extension settings, ensure popup blockers are disabled

## Future Enhancements

1. **Multi-Wallet Support**:
   - Switch between multiple connected wallets
   - Remember preferred wallet

2. **Transaction History**:
   - Show recent transactions
   - Transaction status tracking

3. **ENS/StarknetID Support**:
   - Display names instead of addresses
   - Reverse resolution

4. **WalletConnect Integration**:
   - Mobile wallet support
   - QR code scanning

5. **Hardware Wallet Support**:
   - Ledger integration
   - Enhanced security

## Files Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── WalletConnect.tsx      # Main wallet UI component
│   │   └── NetworkBanner.tsx      # Network warning banner
│   ├── hooks/
│   │   └── useWallet.ts           # Wallet state and operations
│   ├── providers/
│   │   └── WalletProvider.tsx     # Starknet provider configuration
│   └── docs/
│       └── WALLET_INTEGRATION.md  # This file
```

## Support

For issues or questions:
1. Check console for detailed error logs
2. Verify wallet extension is installed
3. Confirm network configuration
4. Check Ztarknet RPC status
5. Review starknet-react documentation

## References

- [starknet-react Documentation](https://starknet-react.com/)
- [ArgentX Wallet](https://www.argent.xyz/argent-x/)
- [Braavos Wallet](https://braavos.app/)
- [Starknet.js Documentation](https://www.starknetjs.com/)
