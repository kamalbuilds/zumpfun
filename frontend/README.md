# ZumpFun Frontend

Privacy-first token launch platform built with React, TypeScript, and Starknet.

## Features

- **Wallet Integration**: ArgentX and Braavos wallet support
- **Token Launch UI**: Create tokens with bonding curves and privacy settings
- **Private Contributions**: Client-side ZK proof generation with Noir
- **Trading Interface**: Buy/sell tokens with privacy-preserving trades
- **Real-time Updates**: WebSocket integration for live market data
- **Responsive Design**: Mobile-first with TailwindCSS
- **Dark Mode**: Beautiful purple gradient theme

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **TailwindCSS** - Styling
- **starknet-react** - Starknet wallet integration
- **@noir-lang/noir_js** - Client-side ZK proof generation
- **Chart.js** - Price charts
- **React Router** - Navigation
- **lucide-react** - Icons

## Project Structure

```
src/
├── components/          # React components
│   ├── WalletConnect.tsx       # Wallet connection UI
│   ├── TokenLaunch.tsx         # Token creation form
│   ├── ContributionForm.tsx    # Private contribution interface
│   └── MarketView.tsx          # Trading interface with charts
├── hooks/              # Custom React hooks
│   ├── useNoirProver.ts        # Client-side ZK proof generation
│   └── useStarknet.ts          # Starknet contract interactions
├── lib/                # Utilities
│   └── api.ts                  # Backend API client + WebSocket
├── providers/          # React context providers
│   └── ThemeProvider.tsx       # Dark/light theme management
├── styles/             # Global styles
│   └── global.css              # TailwindCSS + custom styles
├── types/              # TypeScript definitions
│   └── index.ts                # Shared type definitions
├── App.tsx             # Main app with routing
└── main.tsx            # Entry point with error boundary
```

## Installation

```bash
cd frontend
npm install
```

## Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Update environment variables:

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000
REACT_APP_RPC_URL=http://localhost:5050
REACT_APP_FACTORY_ADDRESS=0x...
```

## Development

```bash
# Start dev server
npm run dev

# Open http://localhost:3001
```

## Build

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Production build
npm run build

# Preview build
npm run preview
```

## Key Components

### WalletConnect

Handles wallet connection with ArgentX and Braavos:

```tsx
import { WalletConnect } from './components/WalletConnect';

<WalletConnect />
```

### TokenLaunch

Token creation form with bonding curve configuration:

```tsx
import { TokenLaunch } from './components/TokenLaunch';

<TokenLaunch />
```

### ContributionForm

Private contribution with ZK proof generation:

```tsx
import { ContributionForm } from './components/ContributionForm';

<ContributionForm tokenAddress="0x..." />
```

### MarketView

Trading interface with live price charts:

```tsx
import { MarketView } from './components/MarketView';

<MarketView />
```

## Custom Hooks

### useNoirProver

Client-side ZK proof generation:

```typescript
const { generateProof, isGenerating, proofProgress } = useNoirProver();

const proof = await generateProof({
  circuitName: 'contribution',
  inputs: {
    contributor: address,
    amount: '1.0',
    tokenAddress: '0x...'
  }
});
```

### useStarknet

Starknet contract interactions:

```typescript
const { launchToken, contribute, buyToken, sellToken } = useStarknet();

// Launch token
await launchToken({
  name: 'MyToken',
  symbol: 'MTK',
  totalSupply: '1000000',
  initialPrice: '0.001',
  targetPrice: '0.1',
  privacyEnabled: true
});

// Private contribution
await contribute({
  tokenAddress: '0x...',
  amount: '1.0',
  proof: zkProof,
  usePrivacy: true
});
```

## API Integration

### REST API

```typescript
import { tokenApi, circuitApi, analyticsApi } from './lib/api';

// Get all tokens
const tokens = await tokenApi.getAll();

// Get token stats
const stats = await tokenApi.getStats('0x...');

// Get circuit manifest
const manifest = await circuitApi.getManifest('contribution');
```

### WebSocket

```typescript
import { realtimeClient } from './lib/api';

// Connect
realtimeClient.connect();

// Subscribe to events
const unsubscribe = realtimeClient.subscribe('token:created', (data) => {
  console.log('New token:', data);
});

// Cleanup
unsubscribe();
realtimeClient.disconnect();
```

## Styling

### TailwindCSS

Custom theme with purple gradients:

```tsx
<button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
  Launch Token
</button>
```

### Dark Mode

Managed by ThemeProvider:

```tsx
import { useTheme } from './providers/ThemeProvider';

const { theme, toggleTheme } = useTheme();
```

## Performance Optimization

### Code Splitting

Configured in `vite.config.ts`:

```typescript
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  starknet: ['starknet', '@starknet-react/core'],
  noir: ['@noir-lang/noir_js', '@noir-lang/backend_barretenberg'],
  charts: ['chart.js', 'react-chartjs-2'],
}
```

### Lazy Loading

Use React.lazy for route-based splitting:

```tsx
const MarketView = React.lazy(() => import('./components/MarketView'));
```

## Accessibility

- WCAG 2.1 compliant
- Keyboard navigation
- Screen reader support
- Focus management
- ARIA labels

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## Troubleshooting

### Wallet Connection Issues

1. Install ArgentX or Braavos extension
2. Connect to Ztarknet devnet
3. Check network settings

### Proof Generation Slow

ZK proof generation takes 5-15 seconds. This is normal for client-side proving.

### Build Errors

```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

## Contributing

1. Follow React best practices
2. Use TypeScript strictly
3. Add tests for new features
4. Run linter before committing

## License

MIT
