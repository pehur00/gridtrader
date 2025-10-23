import { Server, Socket } from 'socket.io';
import { marketDataService } from '../services/marketData.service';

export function setupMarketDataSocket(io: Server) {
  // Initialize market data service with Socket.IO instance
  marketDataService.initialize(io);

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    /**
     * Subscribe to a symbol's real-time price updates
     */
    socket.on('market:subscribe', (data: { symbol: string }) => {
      const { symbol } = data;

      if (!symbol) {
        socket.emit('error', { message: 'Symbol is required' });
        return;
      }

      try {
        const normalizedSymbol = symbol.toUpperCase();

        // Join the symbol's room
        socket.join(`symbol:${normalizedSymbol}`);

        // Subscribe to market data
        marketDataService.subscribe(socket.id, normalizedSymbol);

        socket.emit('market:subscribed', { symbol: normalizedSymbol });
      } catch (error: any) {
        console.error(`[Socket] Error subscribing to ${symbol}:`, error);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Unsubscribe from a symbol
     */
    socket.on('market:unsubscribe', (data: { symbol: string }) => {
      const { symbol } = data;

      if (!symbol) return;

      try {
        const normalizedSymbol = symbol.toUpperCase();

        // Leave the symbol's room
        socket.leave(`symbol:${normalizedSymbol}`);

        // Unsubscribe from market data
        marketDataService.unsubscribe(socket.id, normalizedSymbol);

        socket.emit('market:unsubscribed', { symbol: normalizedSymbol });
      } catch (error: any) {
        console.error(`[Socket] Error unsubscribing from ${symbol}:`, error);
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);

      // Unsubscribe from all symbols
      marketDataService.unsubscribeAll(socket.id);
    });
  });

  console.log('[Socket] Market data socket handlers registered');
}
