# Token Launch Components - Integration Guide

## Overview

Comprehensive token launch form system with privacy features, bonding curve configuration, and real-time visualization.

## Components Created

### 1. LaunchTokenDialog.tsx
**Location**: `/Users/kamal/Desktop/zypher/zumpfun/frontend/src/components/LaunchTokenDialog.tsx`

**Main launch dialog with 3-step wizard:**

#### Features:
- **Step 1: Basic Token Info**
  - Token name (3-32 chars)
  - Token symbol (2-10 uppercase letters/numbers)
  - Initial supply (default 800M, min 1M, max 1T)
  - Bonding curve type selector (Linear, Exponential, Sigmoid)
  - Creator commitment (privacy hash)

- **Step 2: Curve Parameters** (via CurveParametersForm)
- **Step 3: Preview & Confirm** (via LaunchPreview)

#### Validation:
```typescript
interface ValidationErrors {
  name?: string;        // Required, 3-32 chars
  symbol?: string;      // Required, 2-10 uppercase alphanumeric
  initialSupply?: string; // 1M - 1T range
  creatorCommitment?: string; // 32-byte hex (0x...)
}
```

#### Data Structure:
```typescript
export interface TokenLaunchFormData {
  name: string;
  symbol: string;
  initialSupply: number; // Default: 800,000,000
  curveType: 'linear' | 'exponential' | 'sigmoid';
  curveParameters: CurveParameters;
  creatorCommitment: string; // For privacy
}
```

---

### 2. CurveParametersForm.tsx
**Location**: `/Users/kamal/Desktop/zypher/zumpfun/frontend/src/components/CurveParametersForm.tsx`

**Interactive bonding curve configuration with live preview:**

#### Parameters:
```typescript
interface CurveParameters {
  basePrice: number;           // Starting price (SOL)
  slope: number;               // Price increase rate
  k: number;                   // Growth rate parameter
  maxPrice: number;            // Price cap (SOL)
  graduationThreshold: number; // SOL needed for Raydium migration
}
```

#### Default Configurations:
```typescript
const DEFAULT_CURVE_PARAMS = {
  linear: {
    basePrice: 0.0001,
    slope: 0.00001,
    k: 1,
    maxPrice: 1.0,
    graduationThreshold: 69000
  },
  exponential: {
    basePrice: 0.0001,
    slope: 0.00001,
    k: 1.5,
    maxPrice: 2.0,
    graduationThreshold: 69000
  },
  sigmoid: {
    basePrice: 0.0001,
    slope: 0.00001,
    k: 2.0,
    maxPrice: 1.5,
    graduationThreshold: 69000
  }
};
```

#### Features:
- **Interactive Sliders**: For all parameters
- **Real-time Chart**: Recharts line graph showing price curve
- **Tooltips**: Helpful explanations for each parameter
- **Summary Card**: Quick view of key metrics

#### Curve Calculations:
```typescript
// Linear: price = basePrice + slope × supply
// Exponential: price = basePrice × e^(slope × supply/1M)
// Sigmoid: price = basePrice + (maxPrice - basePrice) / (1 + e^(-k × (supply - threshold/2)/1M))
```

---

### 3. LaunchPreview.tsx
**Location**: `/Users/kamal/Desktop/zypher/zumpfun/frontend/src/components/LaunchPreview.tsx`

**Comprehensive launch summary and confirmation:**

#### Displays:
1. **Token Details**
   - Name, Symbol, Supply, Curve Type

2. **Bonding Curve Configuration**
   - All parameters with formatted values

3. **Estimated Costs**
   - Creation Fee: 0.05 SOL
   - Rent Exemption: 0.002 SOL
   - Platform Fee: 0.01 SOL
   - **Total: 0.062 SOL**

4. **Privacy Features**
   - Creator identity protection (ZK proofs)
   - Trading activity confidentiality
   - Balance privacy
   - Anonymous liquidity provision

5. **Creator Commitment**
   - Display of 32-byte hex commitment
   - Privacy explanation

#### Actions:
- **Edit Button**: Return to form
- **Launch Button**: Submit token creation

---

## Supporting UI Components

### 4. slider.tsx
**Location**: `/Users/kamal/Desktop/zypher/zumpfun/frontend/src/components/ui/slider.tsx`

Radix UI slider component for parameter adjustment.

### 5. separator.tsx
**Location**: `/Users/kamal/Desktop/zypher/zumpfun/frontend/src/components/ui/separator.tsx`

Visual separator for section organization.

### 6. badge.tsx
**Location**: `/Users/kamal/Desktop/zypher/zumpfun/frontend/src/components/ui/badge.tsx`

Styled badge component for curve type display.

### 7. select.tsx
**Location**: `/Users/kamal/Desktop/zypher/zumpfun/frontend/src/components/ui/select.tsx`

Dropdown select component for curve type selection.

### 8. tooltip.tsx
**Location**: `/Users/kamal/Desktop/zypher/zumpfun/frontend/src/components/ui/tooltip.tsx`

Tooltip component for helpful hints.

---

## Dependencies Installed

```json
{
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-separator": "^1.0.3",
  "@radix-ui/react-slider": "^1.1.2",
  "@radix-ui/react-tooltip": "^1.0.7",
  "recharts": "^2.10.4"
}
```

---

## Integration Steps

### 1. Import Components

```typescript
import { LaunchTokenDialog } from '@/components/LaunchTokenDialog';
```

### 2. Use in Your App

```tsx
// In your header or main page
<LaunchTokenDialog />
```

The component is self-contained and handles all state internally.

### 3. Backend Integration Points

**TODO: Connect these handlers to your backend API:**

```typescript
// In LaunchTokenDialog.tsx, line ~147
const handleLaunch = async () => {
  console.log('Launching token with data:', formData);
  // TODO: Replace with actual API call
  // Example:
  // const response = await fetch('/api/tokens/launch', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(formData)
  // });

  setOpen(false);
  resetForm();
};
```

### 4. Required Backend Endpoints

Create these API endpoints:

```typescript
POST /api/tokens/launch
Body: {
  name: string;
  symbol: string;
  initialSupply: number;
  curveType: 'linear' | 'exponential' | 'sigmoid';
  curveParameters: {
    basePrice: number;
    slope: number;
    k: number;
    maxPrice: number;
    graduationThreshold: number;
  };
  creatorCommitment: string;
}
Response: {
  tokenAddress: string;
  transactionHash: string;
  success: boolean;
}
```

---

## Form Validation

All validation is handled client-side before submission:

### Token Name
- ✅ Required
- ✅ 3-32 characters
- ❌ No special validation (allows any characters)

### Token Symbol
- ✅ Required
- ✅ 2-10 characters
- ✅ Uppercase letters and numbers only
- ✅ Auto-converts to uppercase

### Initial Supply
- ✅ Minimum: 1,000,000
- ✅ Maximum: 1,000,000,000,000
- ✅ Integer values only

### Creator Commitment
- ✅ Required
- ✅ Must start with "0x"
- ✅ Must be 64 hex characters (32 bytes)
- ✅ Format: `/^0x[a-fA-F0-9]{64}$/`

---

## Privacy Features

The form integrates with your privacy-preserving infrastructure:

1. **Creator Commitment**: 32-byte hash for ZK proof
2. **Identity Protection**: Explained in preview
3. **Trading Confidentiality**: All features listed
4. **Balance Privacy**: Built into token design

---

## Bonding Curve Visualization

The CurveParametersForm includes a live Recharts graph showing:

- **X-axis**: Supply (in millions of tokens)
- **Y-axis**: Price (in SOL)
- **100 data points**: Calculated across full curve
- **Interactive tooltips**: Hover for exact values
- **Responsive**: Adapts to container size

---

## Next Steps

### 1. Backend Integration
Connect the `handleLaunch` function to your Solana program:
- Create token mint
- Deploy bonding curve contract
- Store creator commitment
- Initialize privacy features

### 2. Wallet Integration
Add wallet connection check:
```typescript
const handleLaunch = async () => {
  if (!wallet.connected) {
    toast.error('Please connect your wallet');
    return;
  }
  // ... existing code
};
```

### 3. Transaction Signing
Integrate with Solana wallet adapter:
```typescript
const tx = await createTokenTransaction(formData);
const signature = await wallet.signTransaction(tx);
await connection.confirmTransaction(signature);
```

### 4. Success/Error Handling
Add toast notifications:
```typescript
import { toast } from 'sonner';

const handleLaunch = async () => {
  try {
    const result = await launchToken(formData);
    toast.success(`Token ${formData.symbol} launched!`);
    // Navigate to token page
  } catch (error) {
    toast.error('Failed to launch token');
    console.error(error);
  }
};
```

### 5. Loading States
Add loading indicators during submission:
```typescript
const [isLaunching, setIsLaunching] = useState(false);

const handleLaunch = async () => {
  setIsLaunching(true);
  try {
    // ... launch logic
  } finally {
    setIsLaunching(false);
  }
};
```

---

## File Structure

```
frontend/src/components/
├── LaunchTokenDialog.tsx      # Main dialog (3-step wizard)
├── CurveParametersForm.tsx    # Curve configuration with chart
├── LaunchPreview.tsx          # Final review screen
├── index.ts                   # Component exports
└── ui/
    ├── slider.tsx            # Radix slider
    ├── separator.tsx         # Section separator
    ├── badge.tsx            # Styled badge
    ├── select.tsx           # Dropdown select
    └── tooltip.tsx          # Helpful tooltips
```

---

## Exported Types

```typescript
export type CurveType = 'linear' | 'exponential' | 'sigmoid';

export interface CurveParameters {
  basePrice: number;
  slope: number;
  k: number;
  maxPrice: number;
  graduationThreshold: number;
}

export interface TokenLaunchFormData {
  name: string;
  symbol: string;
  initialSupply: number;
  curveType: CurveType;
  curveParameters: CurveParameters;
  creatorCommitment: string;
}
```

These are exported from `LaunchTokenDialog.tsx` and available via:
```typescript
import type { TokenLaunchFormData, CurveType, CurveParameters } from '@/components';
```

---

## Testing Checklist

- [ ] Form validation triggers for all fields
- [ ] Curve type selection updates parameters
- [ ] Slider changes update chart in real-time
- [ ] Back/Next buttons navigate correctly
- [ ] Preview displays all data accurately
- [ ] Tooltips show on hover
- [ ] Dialog closes and resets on cancel
- [ ] Launch handler receives correct data structure

---

## Known Limitations

1. **No wallet integration yet** - Add wallet check before launch
2. **Mock cost calculations** - Update with real Solana fees
3. **No transaction signing** - Integrate Solana wallet adapter
4. **Console logging only** - Replace with actual API calls
5. **No error recovery** - Add retry logic and error states

---

## Support

For questions or issues with these components:
1. Check component props in TypeScript definitions
2. Review Shadcn/Radix UI documentation
3. Examine validation logic in `validateBasicForm()`
4. Test curve calculations in `CurveParametersForm`

---

**Created by Agent 4: Token Launch Form Specialist**
**Date**: November 28, 2025
**Status**: ✅ Complete - Ready for backend integration
