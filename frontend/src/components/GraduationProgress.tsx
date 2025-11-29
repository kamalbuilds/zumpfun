import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Rocket, TrendingUp, Clock, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GraduationProgressProps {
  currentSupply: number;
  graduationThreshold: number;
  currentPrice: number;
  estimatedAMMPrice: number;
  ammPoolAddress?: string;
  isGraduated: boolean;
}

export function GraduationProgress({
  currentSupply,
  graduationThreshold,
  currentPrice,
  estimatedAMMPrice,
  ammPoolAddress,
  isGraduated,
}: GraduationProgressProps) {
  const progress = (currentSupply / graduationThreshold) * 100;
  const tokensNeeded = graduationThreshold - currentSupply;
  const estimatedCost = tokensNeeded * currentPrice;

  // Estimate time to graduation based on recent trading velocity
  // This would come from real data in production
  const estimateTimeToGraduation = () => {
    if (isGraduated) return 'Graduated';
    if (currentSupply === 0) return 'Not started';

    // Simplified estimation - would use actual trading velocity
    const velocity = currentSupply / 24; // tokens per hour (example)
    const hoursRemaining = tokensNeeded / velocity;

    if (hoursRemaining < 1) return '< 1 hour';
    if (hoursRemaining < 24) return `~${Math.round(hoursRemaining)} hours`;
    return `~${Math.round(hoursRemaining / 24)} days`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            AMM Graduation Progress
          </CardTitle>

          {isGraduated ? (
            <Badge className="bg-green-500 hover:bg-green-600">
              <Zap className="h-3 w-3 mr-1" />
              Graduated
            </Badge>
          ) : (
            <Badge variant="outline">
              {progress.toFixed(1)}% Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Supply Progress</span>
            <span className="font-medium">
              {currentSupply.toLocaleString()} / {graduationThreshold.toLocaleString()}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {!isGraduated ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tokens Needed</span>
                </div>
                <p className="text-2xl font-bold">
                  {tokensNeeded.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {estimatedCost.toFixed(2)} SOL
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Est. Time</span>
                </div>
                <p className="text-2xl font-bold">
                  {estimateTimeToGraduation()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  At current pace
                </p>
              </div>
            </div>

            {/* Price Impact */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold mb-1">Price at Graduation</p>
                  <p className="text-sm text-muted-foreground">
                    Expected AMM listing price
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {estimatedAMMPrice.toFixed(6)} SOL
                </Badge>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Price</span>
                  <span>{currentPrice.toFixed(6)} SOL</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Potential Gain</span>
                  <span className="text-green-500 font-medium">
                    +{(((estimatedAMMPrice - currentPrice) / currentPrice) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">What happens at graduation?</h4>
              <div className="space-y-2">
                <div className="flex gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <p className="text-muted-foreground">
                    Bonding curve liquidity migrated to AMM
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <p className="text-muted-foreground">
                    Trading moves to decentralized AMM pool
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <p className="text-muted-foreground">
                    Privacy features maintained with ZK proofs
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">4</span>
                  </div>
                  <p className="text-muted-foreground">
                    Full DeFi composability unlocked
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Graduated State */}
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                <Rocket className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Token Graduated! 🎉</h3>
                <p className="text-muted-foreground">
                  This token has successfully graduated to AMM trading
                </p>
              </div>

              {/* AMM Pool Info */}
              {ammPoolAddress && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">AMM Pool Address</p>
                  <code className="text-xs font-mono bg-background px-3 py-2 rounded block">
                    {ammPoolAddress}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => window.open(`https://solscan.io/account/${ammPoolAddress}`, '_blank')}
                  >
                    View on Solscan
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Final Bonding Price</p>
                  <p className="text-lg font-bold">{currentPrice.toFixed(6)} SOL</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">AMM Price</p>
                  <p className="text-lg font-bold">{estimatedAMMPrice.toFixed(6)} SOL</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Privacy Notice */}
        <div className="text-xs text-center text-muted-foreground pt-4 border-t">
          🔒 All graduation processes maintain zero-knowledge privacy
        </div>
      </CardContent>
    </Card>
  );
}
