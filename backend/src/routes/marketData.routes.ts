import express from 'express';
import { marketDataService } from '../services/marketData.service';

const router = express.Router();

/**
 * GET /api/market/historical/:symbol
 * Get historical price data for a symbol
 */
router.get('/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1d', limit = '365' } = req.query;

    const data = await marketDataService.fetchHistoricalData(
      symbol,
      interval as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[API] Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/market/ticker/:symbol
 * Get 24h ticker data for a symbol
 */
router.get('/ticker/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    const data = await marketDataService.fetch24hTicker(symbol);

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[API] Error fetching ticker data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/market/stats
 * Get market data service statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = marketDataService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('[API] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
