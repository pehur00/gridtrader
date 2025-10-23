import WebSocket from 'ws';
import NodeCache from 'node-cache';
import axios from 'axios';

interface PriceData {
  time: number;
  price: number;
  timestamp: string;
}

interface SymbolSubscription {
  symbol: string;
  ws: WebSocket | null;
  subscribers: Set<string>; // Set of socket.io client IDs
  lastPrice: number;
  reconnectAttempts: number;
  reconnectTimeout?: NodeJS.Timeout;
}

class MarketDataService {
  private subscriptions: Map<string, SymbolSubscription>;
  private cache: NodeCache;
  private io: any; // Socket.IO server instance

  constructor() {
    this.subscriptions = new Map();
    // Cache with 5 minute TTL for historical data
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }

  /**
   * Initialize with Socket.IO server
   */
  initialize(io: any) {
    this.io = io;
    console.log('[MarketData] Service initialized');
  }

  /**
   * Subscribe a client to a symbol's real-time data
   */
  subscribe(clientId: string, symbol: string) {
    const normalizedSymbol = symbol.toUpperCase();

    let subscription = this.subscriptions.get(normalizedSymbol);

    if (!subscription) {
      // Create new subscription
      subscription = {
        symbol: normalizedSymbol,
        ws: null,
        subscribers: new Set(),
        lastPrice: 0,
        reconnectAttempts: 0
      };
      this.subscriptions.set(normalizedSymbol, subscription);

      console.log(`[MarketData] New subscription created for ${normalizedSymbol}`);

      // Start WebSocket connection to Binance
      this.connectToBinance(normalizedSymbol);
    }

    // Add client to subscribers
    subscription.subscribers.add(clientId);
    console.log(`[MarketData] Client ${clientId} subscribed to ${normalizedSymbol}. Total subscribers: ${subscription.subscribers.size}`);

    // Send last known price immediately if available
    if (subscription.lastPrice > 0) {
      this.io.to(clientId).emit('price:update', {
        symbol: normalizedSymbol,
        price: subscription.lastPrice,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Unsubscribe a client from a symbol
   */
  unsubscribe(clientId: string, symbol: string) {
    const normalizedSymbol = symbol.toUpperCase();
    const subscription = this.subscriptions.get(normalizedSymbol);

    if (!subscription) return;

    subscription.subscribers.delete(clientId);
    console.log(`[MarketData] Client ${clientId} unsubscribed from ${normalizedSymbol}. Remaining: ${subscription.subscribers.size}`);

    // If no more subscribers, close WebSocket connection
    if (subscription.subscribers.size === 0) {
      this.closeSubscription(normalizedSymbol);
    }
  }

  /**
   * Unsubscribe client from all symbols
   */
  unsubscribeAll(clientId: string) {
    for (const [symbol, subscription] of this.subscriptions.entries()) {
      if (subscription.subscribers.has(clientId)) {
        this.unsubscribe(clientId, symbol);
      }
    }
  }

  /**
   * Connect to Binance WebSocket for a symbol
   */
  private connectToBinance(symbol: string) {
    const subscription = this.subscriptions.get(symbol);
    if (!subscription) return;

    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`;

    try {
      const ws = new WebSocket(wsUrl);
      subscription.ws = ws;

      ws.on('open', () => {
        console.log(`[MarketData] Connected to Binance for ${symbol}`);
        subscription.reconnectAttempts = 0;
      });

      ws.on('message', (data: Buffer) => {
        try {
          const trade = JSON.parse(data.toString());
          const price = parseFloat(trade.p);

          // Update last price
          subscription.lastPrice = price;

          // Broadcast to all subscribers in this symbol's room
          this.io.to(`symbol:${symbol}`).emit('price:update', {
            symbol,
            price,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error(`[MarketData] Error parsing message for ${symbol}:`, error);
        }
      });

      ws.on('error', (error) => {
        console.error(`[MarketData] WebSocket error for ${symbol}:`, error.message);
      });

      ws.on('close', () => {
        console.log(`[MarketData] WebSocket closed for ${symbol}`);

        // Only reconnect if there are still subscribers
        if (subscription.subscribers.size > 0) {
          this.reconnect(symbol);
        }
      });
    } catch (error) {
      console.error(`[MarketData] Failed to connect to Binance for ${symbol}:`, error);
      this.reconnect(symbol);
    }
  }

  /**
   * Reconnect to Binance with exponential backoff
   */
  private reconnect(symbol: string) {
    const subscription = this.subscriptions.get(symbol);
    if (!subscription) return;

    subscription.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, subscription.reconnectAttempts), 30000);

    console.log(`[MarketData] Reconnecting to ${symbol} in ${delay}ms (attempt ${subscription.reconnectAttempts})`);

    subscription.reconnectTimeout = setTimeout(() => {
      if (subscription.subscribers.size > 0) {
        this.connectToBinance(symbol);
      }
    }, delay);
  }

  /**
   * Close subscription and clean up
   */
  private closeSubscription(symbol: string) {
    const subscription = this.subscriptions.get(symbol);
    if (!subscription) return;

    console.log(`[MarketData] Closing subscription for ${symbol}`);

    // Close WebSocket
    if (subscription.ws) {
      subscription.ws.close();
      subscription.ws = null;
    }

    // Clear reconnect timeout
    if (subscription.reconnectTimeout) {
      clearTimeout(subscription.reconnectTimeout);
    }

    // Remove from subscriptions
    this.subscriptions.delete(symbol);
  }

  /**
   * Fetch historical data from Binance (with caching)
   */
  async fetchHistoricalData(symbol: string, interval: string = '1d', limit: number = 365): Promise<PriceData[]> {
    const normalizedSymbol = symbol.toUpperCase();
    const cacheKey = `historical:${normalizedSymbol}:${interval}:${limit}`;

    // Check cache first
    const cached = this.cache.get<PriceData[]>(cacheKey);
    if (cached) {
      console.log(`[MarketData] Serving cached historical data for ${normalizedSymbol}`);
      return cached;
    }

    try {
      const endTime = Date.now();
      const startTime = endTime - (limit * 24 * 60 * 60 * 1000); // days to milliseconds

      const response = await axios.get('https://api.binance.com/api/v3/klines', {
        params: {
          symbol: normalizedSymbol,
          interval,
          startTime,
          endTime,
          limit
        }
      });

      const data: PriceData[] = response.data.map((candle: any[], index: number) => {
        const [timestamp, open, high, low, close] = candle;
        return {
          time: index,
          price: parseFloat(close),
          timestamp: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });

      // Cache the data
      this.cache.set(cacheKey, data);
      console.log(`[MarketData] Fetched and cached historical data for ${normalizedSymbol}`);

      return data;
    } catch (error: any) {
      console.error(`[MarketData] Error fetching historical data for ${normalizedSymbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch 24h ticker data
   */
  async fetch24hTicker(symbol: string) {
    const normalizedSymbol = symbol.toUpperCase();
    const cacheKey = `ticker24h:${normalizedSymbol}`;

    // Check cache (1 minute TTL for ticker)
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
        params: { symbol: normalizedSymbol }
      });

      const data = {
        lastPrice: parseFloat(response.data.lastPrice),
        priceChangePercent: parseFloat(response.data.priceChangePercent),
        highPrice: parseFloat(response.data.highPrice),
        lowPrice: parseFloat(response.data.lowPrice),
        volume: parseFloat(response.data.volume)
      };

      // Cache for 1 minute
      this.cache.set(cacheKey, data, 60);

      return data;
    } catch (error: any) {
      console.error(`[MarketData] Error fetching 24h ticker for ${normalizedSymbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get current subscription stats
   */
  getStats() {
    const stats = {
      totalSymbols: this.subscriptions.size,
      symbols: [] as any[]
    };

    for (const [symbol, subscription] of this.subscriptions.entries()) {
      stats.symbols.push({
        symbol,
        subscribers: subscription.subscribers.size,
        lastPrice: subscription.lastPrice,
        connected: subscription.ws?.readyState === WebSocket.OPEN
      });
    }

    return stats;
  }
}

// Singleton instance
export const marketDataService = new MarketDataService();
