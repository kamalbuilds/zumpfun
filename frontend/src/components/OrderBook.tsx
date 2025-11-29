import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Clock, Shield, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  timestamp: number;
  commitment?: string;
  isPrivate: boolean;
}

interface OrderBookProps {
  trades: Trade[];
  isRealtime?: boolean;
}

export function OrderBook({ trades, isRealtime = true }: OrderBookProps) {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTrades = trades.filter(trade =>
    filter === 'all' || trade.type === filter
  );

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Trades
            {isRealtime && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live
              </span>
            )}
          </CardTitle>

          {/* Privacy Notice */}
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            ZK Protected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buy" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Buys
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Sells
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            <ScrollArea className="h-[500px] pr-4">
              {filteredTrades.length > 0 ? (
                <div className="space-y-3">
                  {filteredTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                        trade.type === 'buy'
                          ? 'border-green-500/20 bg-green-500/5'
                          : 'border-red-500/20 bg-red-500/5'
                      }`}
                    >
                      {/* Trade Header */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {trade.type === 'buy' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-semibold capitalize">
                            {trade.type}
                          </span>
                          {trade.isPrivate && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-2 w-2 mr-1" />
                              Private
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(trade.timestamp)}
                        </span>
                      </div>

                      {/* Trade Details */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="font-medium">
                            {trade.amount.toLocaleString()} TOKENS
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="font-medium">{trade.price.toFixed(6)} SOL</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-medium text-lg">
                            {trade.total.toFixed(6)} SOL
                          </p>
                        </div>
                      </div>

                      {/* Commitment Hash (Privacy) */}
                      {trade.isPrivate && trade.commitment && (
                        <div className="pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">
                                ZK Commitment
                              </p>
                              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                {truncateHash(trade.commitment)}
                              </code>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(trade.commitment!, trade.id)}
                            >
                              {copiedId === trade.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <Clock className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">No trades yet</p>
                  <p className="text-sm">Be the first to trade this token</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        {filteredTrades.length > 0 && (
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Trades</p>
              <p className="text-lg font-bold">{filteredTrades.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Volume</p>
              <p className="text-lg font-bold">
                {filteredTrades
                  .reduce((sum, trade) => sum + trade.total, 0)
                  .toFixed(2)} SOL
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg Price</p>
              <p className="text-lg font-bold">
                {(filteredTrades.reduce((sum, trade) => sum + trade.price, 0) /
                  filteredTrades.length).toFixed(6)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
