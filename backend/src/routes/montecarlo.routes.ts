/**
 * Monte Carlo Simulation Routes
 *
 * API endpoints for Monte Carlo simulations of grid trading strategies
 */

import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { monteCarloService } from '../services/monteCarlo.service';

const router = Router();

/**
 * POST /api/montecarlo/simulate/:symbol
 * Run Monte Carlo simulation for a symbol and grid parameters
 */
router.post('/simulate/:symbol', authenticateJWT, async (req, res) => {
  try {
    const { symbol } = req.params;
    const userId = req.user.id;
    const {
      gridParams,
      investmentAmount = 1000,
      leverage = 3,
      numSimulations = 1000,
      projectionDays = 90
    } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    console.log(`[MonteCarlo] Running simulation for ${symbol} for user ${userId}`);

    // Validate grid parameters
    if (!gridParams) {
      return res.status(400).json({
        success: false,
        error: 'Grid parameters are required'
      });
    }

    // Run Monte Carlo simulation
    const results = await monteCarloService.runMonteCarloSimulation(
      symbol,
      gridParams,
      investmentAmount,
      leverage,
      numSimulations,
      projectionDays
    );

    // Save results to database
    const simulationId = await monteCarloService.saveMonteCarloResults(
      userId,
      symbol,
      gridParams,
      results
    );

    res.json({
      success: true,
      data: {
        simulationId,
        symbol,
        gridParams,
        investmentAmount,
        leverage,
        numSimulations,
        projectionDays,
        results,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[MonteCarlo] Simulation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run Monte Carlo simulation'
    });
  }
});

/**
 * POST /api/montecarlo/simulate/quick/:symbol
 * Quick Monte Carlo simulation with default parameters
 */
router.post('/simulate/quick/:symbol', authenticateJWT, async (req, res) => {
  try {
    const { symbol } = req.params;
    const userId = req.user.id;
    const { investmentAmount = 1000 } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    console.log(`[MonteCarlo] Running quick simulation for ${symbol} for user ${userId}`);

    // Run quick Monte Carlo simulation
    const results = await monteCarloService.runQuickSimulation(symbol, investmentAmount);

    res.json({
      success: true,
      data: {
        symbol,
        investmentAmount,
        results,
        timestamp: new Date().toISOString(),
        note: 'Quick simulation with default parameters'
      }
    });

  } catch (error: any) {
    console.error('[MonteCarlo] Quick simulation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run quick simulation'
    });
  }
});

export default router;