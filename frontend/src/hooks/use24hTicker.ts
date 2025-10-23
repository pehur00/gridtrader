import { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

interface TickerData {
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  high: number;
  low: number;
}

interface Use24hTickerReturn {
  tickerData: TickerData | null;
  loading: boolean;
  error: string | null;
}

export function use24hTicker(symbol: string): Use24hTickerReturn {
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchTicker = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${BACKEND_URL}/api/market/ticker/${symbol}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch ticker data: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setTickerData(result.data);
        } else {
          throw new Error('Invalid ticker data response');
        }
      } catch (err) {
        console.error('Error fetching 24h ticker:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTicker();

    // Refresh ticker data every 60 seconds (1 minute)
    const intervalId = setInterval(fetchTicker, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [symbol]);

  return { tickerData, loading, error };
}
