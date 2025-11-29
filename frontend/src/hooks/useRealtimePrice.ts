import { useState, useEffect, useCallback } from 'react';

interface PriceData {
  price: number;
  supply: number;
  timestamp: number;
}

/**
 * Custom hook for real-time price updates via WebSocket
 */
export function useRealtimePrice(tokenAddress: string, updateInterval = 1000) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    // WebSocket connection for real-time updates
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(`${wsUrl}/price/${tokenAddress}`);

    ws.onopen = () => {
      console.log('WebSocket connected for token:', tokenAddress);
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setPriceData({
          price: data.price,
          supply: data.supply,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Failed to parse price data:', err);
        setError('Invalid price data received');
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
  }, [tokenAddress]);

  // Fallback polling if WebSocket fails
  useEffect(() => {
    if (isConnected || !tokenAddress) return;

    const fetchPrice = async () => {
      try {
        const response = await fetch(`/api/tokens/${tokenAddress}/price`);
        if (!response.ok) throw new Error('Failed to fetch price');

        const data = await response.json();
        setPriceData({
          price: data.price,
          supply: data.supply,
          timestamp: Date.now(),
        });
        setError(null);
      } catch (err) {
        console.error('Failed to fetch price:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch price');
      }
    };

    // Initial fetch
    fetchPrice();

    // Polling interval
    const interval = setInterval(fetchPrice, updateInterval);

    return () => clearInterval(interval);
  }, [tokenAddress, isConnected, updateInterval]);

  const refresh = useCallback(async () => {
    if (!tokenAddress) return;

    try {
      const response = await fetch(`/api/tokens/${tokenAddress}/price`);
      if (!response.ok) throw new Error('Failed to fetch price');

      const data = await response.json();
      setPriceData({
        price: data.price,
        supply: data.supply,
        timestamp: Date.now(),
      });
      setError(null);
    } catch (err) {
      console.error('Failed to refresh price:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh price');
    }
  }, [tokenAddress]);

  return {
    price: priceData?.price ?? 0,
    supply: priceData?.supply ?? 0,
    timestamp: priceData?.timestamp,
    isConnected,
    error,
    refresh,
  };
}
