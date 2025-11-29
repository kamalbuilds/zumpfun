import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurveParameters, CurveType } from './LaunchTokenDialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface CurveParametersFormProps {
  curveType: CurveType;
  parameters: CurveParameters;
  onChange: (parameters: CurveParameters) => void;
}

export function CurveParametersForm({ curveType, parameters, onChange }: CurveParametersFormProps) {
  const calculatePrice = (supply: number): number => {
    const { basePrice, slope, k } = parameters;

    switch (curveType) {
      case 'linear':
        return basePrice + slope * supply;
      case 'exponential':
        return basePrice * Math.exp(slope * supply / 1000000);
      case 'sigmoid':
        return basePrice + (parameters.maxPrice - basePrice) / (1 + Math.exp(-k * (supply - parameters.graduationThreshold / 2) / 1000000));
      default:
        return basePrice;
    }
  };

  const chartData = useMemo(() => {
    const data = [];
    const maxSupply = parameters.graduationThreshold;
    const step = maxSupply / 100;

    for (let i = 0; i <= 100; i++) {
      const supply = i * step;
      const price = calculatePrice(supply);
      data.push({
        supply: supply / 1000000, // Convert to millions for readability
        price: Math.min(price, parameters.maxPrice),
      });
    }

    return data;
  }, [curveType, parameters]);

  const handleParameterChange = (key: keyof CurveParameters, value: number) => {
    onChange({
      ...parameters,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Price Curve Preview</CardTitle>
          <CardDescription>
            Visualize how your token price changes with supply
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="supply"
                  label={{ value: 'Supply (Millions)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Price (SOL)', angle: -90, position: 'insideLeft' }}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`${value.toFixed(6)} SOL`, 'Price']}
                  labelFormatter={(value: number) => `${value.toFixed(2)}M tokens`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Base Price (SOL)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      The starting price of your token. This is the price for the first token purchased.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              step="0.0001"
              value={parameters.basePrice}
              onChange={(e) => handleParameterChange('basePrice', parseFloat(e.target.value) || 0)}
              className="w-32 text-right"
            />
          </div>
          <Slider
            value={[parameters.basePrice * 10000]}
            onValueChange={([value]) => handleParameterChange('basePrice', value / 10000)}
            min={1}
            max={100}
            step={1}
          />
          <p className="text-sm text-muted-foreground">
            Current: {parameters.basePrice.toFixed(4)} SOL
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Slope</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Controls how quickly the price increases. Higher values mean steeper price growth.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              step="0.00001"
              value={parameters.slope}
              onChange={(e) => handleParameterChange('slope', parseFloat(e.target.value) || 0)}
              className="w-32 text-right"
            />
          </div>
          <Slider
            value={[parameters.slope * 100000]}
            onValueChange={([value]) => handleParameterChange('slope', value / 100000)}
            min={1}
            max={100}
            step={1}
          />
          <p className="text-sm text-muted-foreground">
            Current: {parameters.slope.toFixed(5)}
          </p>
        </div>

        {curveType !== 'linear' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>K Parameter (Growth Rate)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {curveType === 'exponential'
                          ? 'Controls the exponential growth rate. Higher values mean faster price acceleration.'
                          : 'Controls the steepness of the S-curve. Higher values mean more dramatic transition.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                step="0.1"
                value={parameters.k}
                onChange={(e) => handleParameterChange('k', parseFloat(e.target.value) || 0)}
                className="w-32 text-right"
              />
            </div>
            <Slider
              value={[parameters.k * 10]}
              onValueChange={([value]) => handleParameterChange('k', value / 10)}
              min={1}
              max={50}
              step={1}
            />
            <p className="text-sm text-muted-foreground">
              Current: {parameters.k.toFixed(1)}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Max Price (SOL)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      The maximum price cap for your token. Price will not exceed this value.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              step="0.1"
              value={parameters.maxPrice}
              onChange={(e) => handleParameterChange('maxPrice', parseFloat(e.target.value) || 0)}
              className="w-32 text-right"
            />
          </div>
          <Slider
            value={[parameters.maxPrice * 10]}
            onValueChange={([value]) => handleParameterChange('maxPrice', value / 10)}
            min={1}
            max={100}
            step={1}
          />
          <p className="text-sm text-muted-foreground">
            Current: {parameters.maxPrice.toFixed(2)} SOL
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Graduation Threshold</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Amount of SOL required for token to graduate to Raydium. Once reached, liquidity migrates to Raydium pool.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              step="1000"
              value={parameters.graduationThreshold}
              onChange={(e) => handleParameterChange('graduationThreshold', parseFloat(e.target.value) || 0)}
              className="w-32 text-right"
            />
          </div>
          <Slider
            value={[parameters.graduationThreshold / 1000]}
            onValueChange={([value]) => handleParameterChange('graduationThreshold', value * 1000)}
            min={10}
            max={200}
            step={1}
          />
          <p className="text-sm text-muted-foreground">
            Current: {parameters.graduationThreshold.toLocaleString()} SOL
          </p>
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Starting Price</p>
              <p className="font-mono font-semibold">{parameters.basePrice.toFixed(6)} SOL</p>
            </div>
            <div>
              <p className="text-muted-foreground">Price at Graduation</p>
              <p className="font-mono font-semibold">
                {Math.min(calculatePrice(parameters.graduationThreshold), parameters.maxPrice).toFixed(6)} SOL
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Price Cap</p>
              <p className="font-mono font-semibold">{parameters.maxPrice.toFixed(4)} SOL</p>
            </div>
            <div>
              <p className="text-muted-foreground">Curve Type</p>
              <p className="font-semibold capitalize">{curveType}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
