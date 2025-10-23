/**
 * Grid Optimizer Routes
 *
 * API endpoints for AI-powered grid parameter optimization
 */

import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { gridOptimizerService } from '../services/gridOptimizer.service';

const router = Router();

/**
 * POST /api/grid/optimize/:symbol
 * Optimize grid parameters for a given symbol
 */
router.post('/optimize/:symbol', authenticateJWT, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { leverage = 1, investment = 1000 } = req.body;
    const userId = req.user.id;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    // Validate leverage
    if (leverage < 1 || leverage > 10) {
      return res.status(400).json({
        success: false,
        error: 'Leverage must be between 1 and 10'
      });
    }

    // Validate investment
    if (investment <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Investment must be greater than 0'
      });
    }

    console.log(`[GridOptimizer] Optimizing grid for ${symbol} with ${leverage}x leverage, $${investment} investment for user ${userId}`);

    // Optimize grid parameters
    const parameters = await gridOptimizerService.optimizeGridParameters(symbol, leverage, investment);

    // Save strategy to database
    const strategyId = await gridOptimizerService.saveGridStrategy(userId, symbol, parameters);

    res.json({
      success: true,
      data: {
        strategyId,
        symbol,
        parameters,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[GridOptimizer] Optimization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to optimize grid parameters'
    });
  }
});

/**
 * GET /api/grid/strategies
 * Get all grid strategies for authenticated user
 */
router.get('/strategies', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const strategies = await gridOptimizerService.getUserStrategies(userId);

    res.json({
      success: true,
      data: strategies
    });

  } catch (error: any) {
    console.error('[GridOptimizer] Error fetching strategies:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch strategies'
    });
  }
});

/**
 * GET /api/grid/optimize/:symbol/preview
 * Preview optimization without saving to database
 */
router.get('/optimize/:symbol/preview', authenticateJWT, async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    console.log(`[GridOptimizer] Previewing optimization for ${symbol}`);

    // Optimize grid parameters without saving
    const parameters = await gridOptimizerService.optimizeGridParameters(symbol);

    res.json({
      success: true,
      data: {
        symbol,
        parameters,
        timestamp: new Date().toISOString(),
        note: 'Preview optimization - not saved to database'
      }
    });

  } catch (error: any) {
    console.error('[GridOptimizer] Preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview optimization'
    });
  }
});

export default router;