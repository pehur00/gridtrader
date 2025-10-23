import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

interface HistoricalData {
  time: number;
  price: number;
  timestamp: string;
}

interface UseMarketDataReturn {
  currentPrice: number;
  historicalData: HistoricalData[];
  loading: boolean;
  error: string | null;
  connected: boolean;
}

/**
 * Hook to use centralized market data service
 * Subscribes to real-time price updates via Socket.IO
 * Fetches historical data via REST API
 */
export function useMarketData(symbol: string): UseMarketDataReturn {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const subscribedSymbolRef = useRef<string | null>(null);

  // Fetch historical data
  const fetchHistoricalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}/api/market/historical/${symbol}?interval=1d&limit=365`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch historical data');
      }

      setHistoricalData(result.data);
      setLoading(false);
    } catch (err: any) {
      console.error('[useMarketData] Error fetching historical data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [symbol]);

  // Setup Socket.IO connection
  useEffect(() => {
    // Create socket connection
    if (!socketRef.current) {
      socketRef.current = io(BACKEND_URL, {
        transports: ['polling', 'websocket'], // Start with polling, then upgrade
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 20000,
        autoConnect: true,
        forceNew: false
      });

      socketRef.current.on('connect', () => {
        console.log('[useMarketData] Connected to market data service');
        setConnected(true);
        setError(null); // Clear any previous errors
      });

      socketRef.current.on('disconnect', (reason: string) => {
        console.log('[useMarketData] Disconnected:', reason);
        setConnected(false);
        // Only set error for unexpected disconnections
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          // Intentional disconnect, no error
        } else {
          setError('Connection lost. Reconnecting...');
        }
      });

      socketRef.current.on('price:update', (data: PriceUpdate) => {
        if (data.symbol === symbol.toUpperCase()) {
          setCurrentPrice(data.price);
        }
      });

      socketRef.current.on('connect_error', (error: any) => {
        // Suppress noisy connection errors during initial handshake
        console.debug('[useMarketData] Connection attempt, retrying...', error.message);
      });

      socketRef.current.on('error', (error: any) => {
        console.error('[useMarketData] Socket error:', error);
        setError('Connection error. Please refresh the page.');
      });
    }

    return () => {
      // Cleanup socket connection on unmount
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Subscribe to symbol
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !symbol) return;

    // Unsubscribe from previous symbol
    if (subscribedSymbolRef.current && subscribedSymbolRef.current !== symbol) {
      socket.emit('market:unsubscribe', { symbol: subscribedSymbolRef.current });
    }

    // Subscribe to new symbol
    socket.emit('market:subscribe', { symbol });
    subscribedSymbolRef.current = symbol;

    console.log(`[useMarketData] Subscribed to ${symbol}`);

    // Fetch historical data
    fetchHistoricalData();

    return () => {
      // Unsubscribe when symbol changes or component unmounts
      if (socket && subscribedSymbolRef.current) {
        socket.emit('market:unsubscribe', { symbol: subscribedSymbolRef.current });
        subscribedSymbolRef.current = null;
      }
    };
  }, [symbol, fetchHistoricalData]);

  return {
    currentPrice,
    historicalData,
    loading,
    error,
    connected
  };
}

/**
 * Hook to fetch 24h ticker data
 */
export function use24hTicker(symbol: string) {
  const [ticker, setTicker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${BACKEND_URL}/api/market/ticker/${symbol}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch ticker data');
        }

        setTicker(result.data);
        setLoading(false);
      } catch (err: any) {
        console.error('[use24hTicker] Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTicker();

    // Refresh ticker data every 60 seconds (1 minute)
    const interval = setInterval(fetchTicker, 60000);

    return () => clearInterval(interval);
  }, [symbol]);

  return { ticker, loading, error };
}
