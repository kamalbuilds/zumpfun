import { useState, useEffect, useCallback } from 'react';

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

/**
 * Custom hook for real-time trade updates via WebSocket
 */
export function useRealtimeTrades(tokenAddress: string, maxTrades = 50) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    // WebSocket connection for real-time trade updates
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(`${wsUrl}/trades/${tokenAddress}`);

    ws.onopen = () => {
      console.log('WebSocket connected for trades:', tokenAddress);
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'initial') {
          // Initial trade history
          setTrades(data.trades.slice(0, maxTrades));
        } else if (data.type === 'trade') {
          // New trade update
          setTrades((prev) => {
            const updated = [data.trade, ...prev];
            return updated.slice(0, maxTrades);
          });
        }
      } catch (err) {
        console.error('Failed to parse trade data:', err);
        setError('Invalid trade data received');
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('WebSocket connection error');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, [tokenAddress, maxTrades]);

  // Fallback REST API fetch if WebSocket fails
  const fetchTrades = useCallback(async () => {
    if (!tokenAddress) return;

    try {
      const response = await fetch(`/api/tokens/${tokenAddress}/trades?limit=${maxTrades}`);
      if (!response.ok) throw new Error('Failed to fetch trades');

      const data = await response.json();
      setTrades(data.trades);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch trades:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
    }
  }, [tokenAddress, maxTrades]);

  // Initial fetch if WebSocket not connected
  useEffect(() => {
    if (!isConnected && tokenAddress) {
      fetchTrades();
    }
  }, [isConnected, tokenAddress, fetchTrades]);

  const refresh = useCallback(async () => {
    await fetchTrades();
  }, [fetchTrades]);

  return {
    trades,
    isConnected,
    error,
    refresh,
  };
}
