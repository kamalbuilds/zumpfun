# Token Launch Components

## Quick Start

```tsx
import { LaunchTokenDialog } from '@/components';

function App() {
  return <LaunchTokenDialog />;
}
```

## Components

### LaunchTokenDialog
3-step wizard for token creation with privacy features.

### CurveParametersForm
Interactive bonding curve configuration with live chart.

### LaunchPreview
Comprehensive launch summary and cost estimation.

## Files Created

✅ `/frontend/src/components/LaunchTokenDialog.tsx`
✅ `/frontend/src/components/CurveParametersForm.tsx`
✅ `/frontend/src/components/LaunchPreview.tsx`
✅ `/frontend/src/components/index.ts`
✅ `/frontend/src/components/ui/slider.tsx`
✅ `/frontend/src/components/ui/separator.tsx`
✅ `/frontend/src/components/ui/badge.tsx`
✅ `/frontend/src/components/ui/select.tsx`
✅ `/frontend/src/components/ui/tooltip.tsx`
✅ `/frontend/src/components/INTEGRATION.md` (Full docs)

## Dependencies Installed

- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-tooltip
- recharts

## Next Steps

1. Connect `handleLaunch()` to backend API
2. Add wallet integration
3. Implement transaction signing
4. Add success/error toasts

See `INTEGRATION.md` for complete documentation.
