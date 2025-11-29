import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Activity, BarChart3 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PricePoint {
  timestamp: number;
  price: number;
  supply: number;
}

interface TokenChartProps {
  tokenAddress: string;
  currentPrice: number;
  currentSupply: number;
  graduationThreshold: number;
  priceHistory: PricePoint[];
}

export function TokenChart({
  tokenAddress,
  currentPrice,
  currentSupply,
  graduationThreshold,
  priceHistory,
}: TokenChartProps) {
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | 'all'>('24h');
  const [chartType, setChartType] = useState<'price' | 'volume'>('price');

  // Filter data based on timeframe
  const getFilteredData = () => {
    const now = Date.now();
    let cutoff = 0;

    switch (timeframe) {
      case '1h':
        cutoff = now - 60 * 60 * 1000;
        break;
      case '24h':
        cutoff = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        cutoff = now - 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        return priceHistory;
    }

    return priceHistory.filter(point => point.timestamp >= cutoff);
  };

  const filteredData = getFilteredData();

  // Generate bonding curve data
  const generateBondingCurve = () => {
    const points = [];
    const step = graduationThreshold / 100;

    for (let supply = 0; supply <= graduationThreshold; supply += step) {
      // Bonding curve formula: price = basePrice + (supply^2 / constant)
      const price = 0.0001 + (supply * supply) / 1000000000;
      points.push({ supply, price });
    }

    return points;
  };

  const bondingCurve = generateBondingCurve();

  // Chart data for price history
  const priceChartData = {
    labels: filteredData.map(point =>
      new Date(point.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    ),
    datasets: [
      {
        label: 'Price (SOL)',
        data: filteredData.map(point => point.price),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart data for bonding curve
  const bondingCurveData = {
    labels: bondingCurve.map(point => point.supply.toFixed(0)),
    datasets: [
      {
        label: 'Bonding Curve',
        data: bondingCurve.map(point => point.price),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Current Position',
        data: bondingCurve.map(point =>
          Math.abs(point.supply - currentSupply) < graduationThreshold / 100
            ? point.price
            : null
        ),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgb(34, 197, 94)',
        pointRadius: 8,
        pointHoverRadius: 10,
        showLine: false,
      },
      {
        label: 'Graduation Threshold',
        data: bondingCurve.map(point =>
          Math.abs(point.supply - graduationThreshold) < graduationThreshold / 100
            ? point.price
            : null
        ),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgb(239, 68, 68)',
        pointRadius: 8,
        pointHoverRadius: 10,
        showLine: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return value.toFixed(6) + ' SOL';
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Price Chart
          </CardTitle>

          {/* Timeframe Selection */}
          <div className="flex gap-1">
            {(['1h', '24h', '7d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs rounded ${
                  timeframe === tf
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'price' | 'volume')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="price" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Price History
            </TabsTrigger>
            <TabsTrigger value="volume" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Bonding Curve
            </TabsTrigger>
          </TabsList>

          {/* Price History Chart */}
          <TabsContent value="price" className="h-[400px]">
            {filteredData.length > 0 ? (
              <Line data={priceChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No trading data available yet</p>
                  <p className="text-sm">Make the first trade to see the chart</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Bonding Curve Chart */}
          <TabsContent value="volume" className="h-[400px]">
            <Line data={bondingCurveData} options={chartOptions} />

            {/* Legend Explanation */}
            <div className="mt-4 p-3 bg-muted rounded-lg space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Bonding curve trajectory</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Current supply: {currentSupply.toLocaleString()} tokens</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Graduation at: {graduationThreshold.toLocaleString()} tokens</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Current Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Current Price</p>
            <p className="text-lg font-bold">{currentPrice.toFixed(6)}</p>
            <p className="text-xs text-muted-foreground">SOL</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Supply</p>
            <p className="text-lg font-bold">{currentSupply.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Tokens</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-lg font-bold">
              {((currentSupply / graduationThreshold) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">to AMM</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
