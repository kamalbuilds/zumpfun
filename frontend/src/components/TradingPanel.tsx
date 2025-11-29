import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowDownUp, Settings2, TrendingUp, TrendingDown } from 'lucide-react';

interface TradingPanelProps {
  tokenAddress: string;
  currentPrice: number;
  userBalance: number;
  onTrade: (type: 'buy' | 'sell', amount: number, slippage: number) => Promise<void>;
}

export function TradingPanel({ tokenAddress, currentPrice, userBalance, onTrade }: TradingPanelProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(1);
  const [showSettings, setShowSettings] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [priceImpact, setPriceImpact] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Calculate estimated cost and price impact
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setEstimatedCost(0);
      setPriceImpact(0);
      return;
    }

    const amountNum = parseFloat(amount);

    // Bonding curve formula: price increases with supply
    // Simplified calculation - should match backend bonding curve
    const avgPrice = currentPrice * (1 + (amountNum * 0.0001));
    const cost = avgPrice * amountNum;
    const impact = ((avgPrice - currentPrice) / currentPrice) * 100;

    setEstimatedCost(cost);
    setPriceImpact(impact);
  }, [amount, currentPrice]);

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (tradeType === 'sell' && parseFloat(amount) > userBalance) {
      setError('Insufficient balance');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onTrade(tradeType, parseFloat(amount), slippage);
      setAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setIsLoading(false);
    }
  };

  const setPresetAmount = (percentage: number) => {
    if (tradeType === 'sell') {
      setAmount((userBalance * percentage / 100).toFixed(6));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Trade</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Slippage Settings */}
        {showSettings && (
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <Label>Slippage Tolerance: {slippage}%</Label>
            <Slider
              value={[slippage]}
              onValueChange={(value) => setSlippage(value[0])}
              min={0.1}
              max={5}
              step={0.1}
              className="w-full"
            />
            <div className="flex gap-2">
              {[0.5, 1, 2, 5].map((value) => (
                <Button
                  key={value}
                  variant={slippage === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSlippage(value)}
                >
                  {value}%
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Buy/Sell Tabs */}
        <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as 'buy' | 'sell')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tradeType} className="space-y-4 mt-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  TOKENS
                </span>
              </div>

              {/* Preset Buttons for Sell */}
              {tradeType === 'sell' && (
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map((percentage) => (
                    <Button
                      key={percentage}
                      variant="outline"
                      size="sm"
                      onClick={() => setPresetAmount(percentage)}
                    >
                      {percentage}%
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Display */}
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Price</span>
                <span className="font-medium">{currentPrice.toFixed(6)} SOL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated {tradeType === 'buy' ? 'Cost' : 'Return'}</span>
                <span className="font-medium">{estimatedCost.toFixed(6)} SOL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={`font-medium ${priceImpact > 5 ? 'text-red-500' : 'text-green-500'}`}>
                  {priceImpact > 0 ? '+' : ''}{priceImpact.toFixed(2)}%
                </span>
              </div>
              {tradeType === 'sell' && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className="font-medium">{userBalance.toFixed(6)} TOKENS</span>
                </div>
              )}
            </div>

            {/* Price Impact Warning */}
            {priceImpact > 5 && (
              <Alert variant="destructive">
                <AlertDescription>
                  High price impact ({priceImpact.toFixed(2)}%). Consider reducing amount.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Execute Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleTrade}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? (
                'Processing...'
              ) : (
                <>
                  <ArrowDownUp className="h-4 w-4 mr-2" />
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} Tokens
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Privacy Note */}
        <p className="text-xs text-muted-foreground text-center">
          🔒 All trades are privacy-protected using zero-knowledge proofs
        </p>
      </CardContent>
    </Card>
  );
}
