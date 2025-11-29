import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  Shield,
  TrendingUp,
  Coins,
  Lock,
  InfoIcon,
  Edit
} from 'lucide-react';
import { TokenLaunchFormData } from './LaunchTokenDialog';

interface LaunchPreviewProps {
  formData: TokenLaunchFormData;
  onEdit: () => void;
}

export function LaunchPreview({ formData, onEdit }: LaunchPreviewProps) {
  const { name, symbol, initialSupply, curveType, curveParameters, creatorCommitment } = formData;

  const calculateEstimatedCosts = () => {
    // Estimate based on Solana transaction costs
    const creationFee = 0.05; // SOL for token creation
    const rentExemption = 0.002; // SOL for rent exemption
    const platformFee = 0.01; // Platform fee

    return {
      creationFee,
      rentExemption,
      platformFee,
      total: creationFee + rentExemption + platformFee,
    };
  };

  const costs = calculateEstimatedCosts();

  const privacyFeatures = [
    'Creator identity protected by zero-knowledge proofs',
    'Trading activity remains confidential',
    'Balance privacy for all token holders',
    'Anonymous liquidity provision',
  ];

  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{name}</CardTitle>
              <CardDescription className="text-lg mt-1">${symbol}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Details */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Token Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Symbol</p>
                <p className="font-medium font-mono">${symbol}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Initial Supply</p>
                <p className="font-medium">{initialSupply.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Curve Type</p>
                <Badge variant="secondary" className="capitalize">
                  {curveType}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Bonding Curve Parameters */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Bonding Curve Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Base Price</p>
                <p className="font-medium font-mono">{curveParameters.basePrice.toFixed(6)} SOL</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Slope</p>
                <p className="font-medium font-mono">{curveParameters.slope.toFixed(5)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Growth Rate (k)</p>
                <p className="font-medium font-mono">{curveParameters.k.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Max Price</p>
                <p className="font-medium font-mono">{curveParameters.maxPrice.toFixed(4)} SOL</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Graduation Threshold</p>
                <p className="font-medium font-mono">{curveParameters.graduationThreshold.toLocaleString()} SOL</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Estimated Costs */}
          <div>
            <h3 className="font-semibold mb-3">Estimated Costs</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Token Creation Fee</span>
                <span className="font-mono">{costs.creationFee.toFixed(3)} SOL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rent Exemption</span>
                <span className="font-mono">{costs.rentExemption.toFixed(3)} SOL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-mono">{costs.platformFee.toFixed(3)} SOL</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Cost</span>
                <span className="font-mono">{costs.total.toFixed(3)} SOL</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Privacy Features */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Features Enabled
            </h3>
            <div className="space-y-2">
              {privacyFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Creator Commitment */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Privacy Commitment
            </h3>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs font-mono break-all">{creatorCommitment}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              This commitment proves your ownership without revealing your identity.
            </p>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Once launched, token parameters cannot be modified. Please review carefully before confirming.
          Your token will be immediately tradeable on the Zumpfun bonding curve.
        </AlertDescription>
      </Alert>

      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-semibold">Ready to Launch</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your token will be created with full privacy protections. After graduation at {curveParameters.graduationThreshold.toLocaleString()} SOL,
              liquidity will automatically migrate to Raydium with LP tokens burned.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
