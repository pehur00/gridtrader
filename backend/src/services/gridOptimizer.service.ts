/**
 * AI Grid Optimization Service
 *
 * Backend implementation of the AI-powered grid parameter optimization
 * that analyzes historical market data to predict optimal grid trading parameters
 */

import { query } from '../db';
import axios from 'axios';

interface PriceCandle {
  time: number;
  price: number;
  timestamp: string;
  high?: number;
  low?: number;
  volume?: number;
}

interface SeasonalPattern {
  month: number;
  avgReturn: number;
  avgVolatility: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

interface PredictedRange {
  lower: number;
  upper: number;
  expectedMid: number;
  confidence: number;
}

export interface OptimizedGridParameters {
  priceRange: { lower: number; upper: number };
  gridLevels: number;
  profitPerGrid: number;
  gridSpacing: number;
  confidence: number;
  volatilityScore: number;
  marketRegime: 'ranging' | 'trending' | 'highly_volatile';

  // Enhanced AI features
  predictedRange3M: PredictedRange;
  expectedVolatility: number;
  seasonalityFactor: number;
  trendPrediction: 'bullish' | 'bearish' | 'neutral';
  optimalEntryZones: number[];
  riskScore: number;

  // Forward-looking metrics
  estimatedProfit3M: number;
  estimatedFills3M: number;
  avgTradeTime: number;
  recommendedInvestment: number;

  // Leverage-related parameters
  leverage?: number;
  effectiveCapital?: number;
  liquidationPrice?: number;
  marginRequirement?: number;
  fundingFeeRate?: number;
}

class GridOptimizerService {
  /**
   * Calculate leverage-related parameters
   */
  private calculateLeverageParameters(
    currentPrice: number,
    investment: number,
    leverage: number = 1
  ): {
    effectiveCapital: number;
    liquidationPrice: number;
    marginRequirement: number;
    fundingFeeRate: number;
  } {
    const effectiveCapital = investment * leverage;
    
    // Liquidation price calculation (simplified for long position)
    // liquidation occurs when losses = initial margin
    // For long: liquidationPrice = entryPrice * (1 - 1/leverage * maintenanceMarginRate)
    // Using 0.5% maintenance margin rate (typical for crypto futures)
    const maintenanceMarginRate = 0.005;
    const liquidationPrice = currentPrice * (1 - (1 / leverage) * (1 - maintenanceMarginRate));
    
    // Margin requirement per grid level (simplified)
    const marginRequirement = effectiveCapital * 0.01; // 1% of effective capital per level
    
    // Typical funding fee rate for perpetual futures (0.01% per 8 hours = 0.03% daily)
    const fundingFeeRate = 0.0003;
    
    return {
      effectiveCapital: Math.round(effectiveCapital),
      liquidationPrice: Math.round(liquidationPrice),
      marginRequirement: Math.round(marginRequirement * 100) / 100,
      fundingFeeRate
    };
  }

  /**
   * Fetch historical data from Binance API
   */
  private async fetchHistoricalData(symbol: string, interval: string = '1d', limit: number = 365): Promise<PriceCandle[]> {
    try {
      const response = await axios.get('https://api.binance.com/api/v3/klines', {
        params: {
          symbol,
          interval,
          limit
        }
      });

      return response.data.map((candle: any[]) => ({
        time: parseInt(candle[0]),
        price: parseFloat(candle[4]), // Close price
        timestamp: new Date(parseInt(candle[0])).toISOString(),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        volume: parseFloat(candle[5])
      }));
    } catch (error) {
      console.error('[GridOptimizer] Error fetching historical data:', error);
      throw new Error('Failed to fetch historical market data');
    }
  }

  /**
   * Analyze seasonal patterns from historical data
   */
  private analyzeSeasonality(candles: PriceCandle[]): SeasonalPattern[] {
    const monthlyData = new Map<number, { returns: number[], volatilities: number[] }>();

    for (let i = 30; i < candles.length; i++) {
      const date = new Date(candles[i].timestamp);
      const month = date.getMonth();

      // Calculate 30-day return
      const return30d = (candles[i].price - candles[i - 30].price) / candles[i - 30].price;

      // Calculate 30-day volatility
      const prices30d = candles.slice(i - 30, i).map(c => c.price);
      const returns = [];
      for (let j = 1; j < prices30d.length; j++) {
        returns.push((prices30d[j] - prices30d[j - 1]) / prices30d[j - 1]);
      }
      const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length);

      if (!monthlyData.has(month)) {
        monthlyData.set(month, { returns: [], volatilities: [] });
      }

      monthlyData.get(month)!.returns.push(return30d);
      monthlyData.get(month)!.volatilities.push(volatility);
    }

    const patterns: SeasonalPattern[] = [];

    monthlyData.forEach((data, month) => {
      const avgReturn = data.returns.reduce((sum, r) => sum + r, 0) / data.returns.length;
      const avgVolatility = data.volatilities.reduce((sum, v) => sum + v, 0) / data.volatilities.length;

      patterns.push({
        month,
        avgReturn,
        avgVolatility,
        trend: avgReturn > 0.02 ? 'bullish' : avgReturn < -0.02 ? 'bearish' : 'neutral'
      });
    });

    return patterns;
  }

  /**
   * Predict price range for next 3 months using ML-inspired techniques
   */
  private predictPriceRange3M(
    candles: PriceCandle[],
    currentPrice: number,
    seasonalPatterns: SeasonalPattern[]
  ): PredictedRange {
    if (candles.length < 180) {
      // Fallback for insufficient data
      return {
        lower: currentPrice * 0.85,
        upper: currentPrice * 1.15,
        expectedMid: currentPrice,
        confidence: 0.5
      };
    }

    // 1. Calculate historical moves for similar periods
    const historicalMoves3M: number[] = [];
    for (let i = 90; i < candles.length; i++) {
      const move = (candles[i].price - candles[i - 90].price) / candles[i - 90].price;
      historicalMoves3M.push(move);
    }

    // 2. Weight recent data more heavily (exponential weighting)
    const weightedMoves = historicalMoves3M.map((move, idx) => {
      const weight = Math.exp((idx - historicalMoves3M.length) / 50); // Decay factor
      return move * weight;
    });

    const totalWeight = historicalMoves3M.map((_, idx) =>
      Math.exp((idx - historicalMoves3M.length) / 50)
    ).reduce((sum, w) => sum + w, 0);

    const expectedMove = weightedMoves.reduce((sum, m) => sum + m, 0) / totalWeight;

    // 3. Apply seasonal adjustment
    const currentMonth = new Date().getMonth();
    const nextThreeMonths = [
      currentMonth,
      (currentMonth + 1) % 12,
      (currentMonth + 2) % 12
    ];

    const seasonalAdjustment = nextThreeMonths
      .map(month => {
        const pattern = seasonalPatterns.find(p => p.month === month);
        return pattern ? pattern.avgReturn : 0;
      })
      .reduce((sum, r) => sum + r, 0) / 3;

    const adjustedExpectedMove = expectedMove + seasonalAdjustment;

    // 4. Calculate range based on historical volatility patterns
    const volatilities3M = [];
    for (let i = 90; i < candles.length; i++) {
      const window = candles.slice(i - 90, i);
      const high90d = Math.max(...window.map(c => c.high || c.price));
      const low90d = Math.min(...window.map(c => c.low || c.price));
      const mid90d = window[Math.floor(window.length / 2)].price;

      if (mid90d > 0 && high90d > low90d) {
        volatilities3M.push((high90d - low90d) / mid90d);
      }
    }

    if (volatilities3M.length === 0) {
      // Fallback if no valid volatility data
      console.warn('[GridOptimizer] No valid volatility data, using fallback');
      return {
        lower: currentPrice * 0.85,
        upper: currentPrice * 1.15,
        expectedMid: currentPrice,
        confidence: 0.5
      };
    }

    const avgVolatility3M = volatilities3M.reduce((sum, v) => sum + v, 0) / volatilities3M.length;
    const volatilityStd = Math.sqrt(
      volatilities3M.reduce((sum, v) => sum + Math.pow(v - avgVolatility3M, 2), 0) / volatilities3M.length
    );

    // 5. Predict range with confidence bands
    const expectedMid = currentPrice * (1 + adjustedExpectedMove);
    const rangeSize = currentPrice * (avgVolatility3M + volatilityStd * 0.5); // Add half std for safety

    const predictedLower = expectedMid - rangeSize / 2;
    const predictedUpper = expectedMid + rangeSize / 2;

    // 6. Calculate confidence based on pattern consistency
    const moveConsistency = avgVolatility3M > 0 ? 1 - (volatilityStd / avgVolatility3M) : 0.5;
    const dataQuality = Math.min(candles.length / 365, 1);
    const confidence = (moveConsistency * 0.7 + dataQuality * 0.3) * 0.85; // Max 85% confidence

    // Validate all values are numbers
    if (isNaN(predictedLower) || isNaN(predictedUpper) || isNaN(expectedMid)) {
      console.error('[GridOptimizer] NaN detected in predictions, using fallback');
      return {
        lower: Math.round(currentPrice * 0.85),
        upper: Math.round(currentPrice * 1.15),
        expectedMid: Math.round(currentPrice),
        confidence: 0.5
      };
    }

    return {
      lower: Math.round(predictedLower),
      upper: Math.round(predictedUpper),
      expectedMid: Math.round(expectedMid),
      confidence: Math.min(Math.max(confidence, 0.3), 0.85)
    };
  }

  /**
   * Identify optimal entry zones using support/resistance clustering
   */
  private findOptimalEntryZones(
    candles: PriceCandle[],
    predictedRange: PredictedRange
  ): number[] {
    // Find price levels with high touch frequency (support/resistance)
    const priceLevels = new Map<number, number>();
    const bucketSize = 500; // $500 buckets for BTC

    candles.forEach(candle => {
      const bucket = Math.round(candle.price / bucketSize) * bucketSize;
      priceLevels.set(bucket, (priceLevels.get(bucket) || 0) + 1);

      if (candle.high) {
        const highBucket = Math.round(candle.high / bucketSize) * bucketSize;
        priceLevels.set(highBucket, (priceLevels.get(highBucket) || 0) + 0.5);
      }

      if (candle.low) {
        const lowBucket = Math.round(candle.low / bucketSize) * bucketSize;
        priceLevels.set(lowBucket, (priceLevels.get(lowBucket) || 0) + 0.5);
      }
    });

    // Sort levels by frequency and filter within predicted range
    const sortedLevels = Array.from(priceLevels.entries())
      .filter(([price]) => price >= predictedRange.lower && price <= predictedRange.upper)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([price]) => price)
      .sort((a, b) => a - b);

    return sortedLevels;
  }

  /**
   * Main AI optimization function with forward-looking analysis
   */
  async optimizeGridParameters(
    symbol: string, 
    leverage: number = 1,
    investment: number = 1000
  ): Promise<OptimizedGridParameters> {
    try {
      // Fetch historical data
      const candles = await this.fetchHistoricalData(symbol);
      const currentPrice = candles[candles.length - 1]?.price || 0;

      if (candles.length < 90 || currentPrice === 0) {
        // Fallback to basic parameters
        return {
          priceRange: { lower: currentPrice * 0.9, upper: currentPrice * 1.1 },
          gridLevels: 40,
          profitPerGrid: 0.5,
          gridSpacing: currentPrice * 0.002,
          confidence: 0,
          volatilityScore: 0,
          marketRegime: 'ranging',

          predictedRange3M: {
            lower: currentPrice * 0.85,
            upper: currentPrice * 1.15,
            expectedMid: currentPrice,
            confidence: 0
          },
          expectedVolatility: 0.02,
          seasonalityFactor: 1.0,
          trendPrediction: 'neutral',
          optimalEntryZones: [],
          riskScore: 5,

          estimatedProfit3M: 0,
          estimatedFills3M: 0,
          avgTradeTime: 24,
          recommendedInvestment: 100
        };
      }

      // 1. Analyze seasonal patterns
      const seasonalPatterns = this.analyzeSeasonality(candles);
      const currentMonth = new Date().getMonth();
      const currentSeasonality = seasonalPatterns.find(p => p.month === currentMonth) ||
        { month: currentMonth, avgReturn: 0, avgVolatility: 0.02, trend: 'neutral' };

      // 2. Predict 3-month price range
      const predictedRange3M = this.predictPriceRange3M(candles, currentPrice, seasonalPatterns);

      // 3. Calculate volatility metrics for optimization
      const recentCandles = candles.slice(-90);
      const returns = [];
      for (let i = 1; i < recentCandles.length; i++) {
        returns.push((recentCandles[i].price - recentCandles[i - 1].price) / recentCandles[i - 1].price);
      }

      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
      const expectedVolatility = (volatility + currentSeasonality.avgVolatility) / 2;

      // 4. Determine market regime based on predicted conditions
      const trendStrength = Math.abs(predictedRange3M.expectedMid - currentPrice) / currentPrice;
      let marketRegime: 'ranging' | 'trending' | 'highly_volatile';
      let trendPrediction: 'bullish' | 'bearish' | 'neutral';

      if (expectedVolatility > 0.04) {
        marketRegime = 'highly_volatile';
      } else if (trendStrength > 0.05) {
        marketRegime = 'trending';
      } else {
        marketRegime = 'ranging';
      }

      if (predictedRange3M.expectedMid > currentPrice * 1.03) {
        trendPrediction = 'bullish';
      } else if (predictedRange3M.expectedMid < currentPrice * 0.97) {
        trendPrediction = 'bearish';
      } else {
        trendPrediction = 'neutral';
      }

      // 5. Find optimal entry zones
      const optimalEntryZones = this.findOptimalEntryZones(candles, predictedRange3M);

      // 6. Optimize grid parameters for predicted conditions
      const priceRange = {
        lower: Math.min(predictedRange3M.lower, currentPrice * 0.92),
        upper: Math.max(predictedRange3M.upper, currentPrice * 1.08)
      };

      // Dynamic grid count based on volatility
      const optimalGridCount = marketRegime === 'highly_volatile' ? 60 :
                               marketRegime === 'trending' ? 40 : 50;

      const gridSpacing = (priceRange.upper - priceRange.lower) / optimalGridCount;
      const profitPerGrid = (gridSpacing / currentPrice) * 100;

      // 7. Estimate 3-month performance
      const dailyVolatilityMoves = expectedVolatility * Math.sqrt(365);
      const estimatedDailyTrades = (dailyVolatilityMoves * currentPrice / gridSpacing) * 0.6;
      const estimatedFills3M = Math.round(estimatedDailyTrades * 90);
      const estimatedProfit3M = Math.round(estimatedFills3M * gridSpacing * (profitPerGrid / 100));

      // 8. Calculate risk score (1-10, lower is better)
      const riskFactors = [
        expectedVolatility > 0.05 ? 3 : expectedVolatility > 0.03 ? 2 : 1,
        marketRegime === 'highly_volatile' ? 3 : marketRegime === 'trending' ? 2 : 1,
        predictedRange3M.confidence < 0.5 ? 2 : 0,
        Math.abs(trendStrength) > 0.1 ? 2 : 0
      ];
      const riskScore = Math.min(riskFactors.reduce((sum, r) => sum + r, 0), 10);

      // 9. Recommend investment amount based on risk
      const baseInvestment = 100;
      const riskMultiplier = 1 - (riskScore / 20); // Lower investment for higher risk
      const recommendedInvestment = Math.max(50, Math.round(baseInvestment * riskMultiplier / 10) * 10);

      // 10. Calculate overall confidence
      const confidence = (
        predictedRange3M.confidence * 0.4 +
        (1 - riskScore / 10) * 0.3 +
        (marketRegime === 'ranging' ? 0.9 : marketRegime === 'trending' ? 0.7 : 0.5) * 0.3
      );

      // 11. Calculate leverage-related parameters
      const leverageParams = this.calculateLeverageParameters(currentPrice, investment, leverage);

      return {
        priceRange,
        gridLevels: optimalGridCount,
        profitPerGrid: parseFloat(profitPerGrid.toFixed(2)),
        gridSpacing: Math.round(gridSpacing),
        confidence: Math.round(confidence * 100),
        volatilityScore: expectedVolatility,
        marketRegime,

        predictedRange3M,
        expectedVolatility,
        seasonalityFactor: 1 + currentSeasonality.avgReturn,
        trendPrediction,
        optimalEntryZones,
        riskScore,

        estimatedProfit3M,
        estimatedFills3M,
        avgTradeTime: marketRegime === 'highly_volatile' ? 12 :
                      marketRegime === 'trending' ? 24 : 36,
        recommendedInvestment,

        // Leverage parameters
        leverage,
        effectiveCapital: leverageParams.effectiveCapital,
        liquidationPrice: leverageParams.liquidationPrice,
        marginRequirement: leverageParams.marginRequirement,
        fundingFeeRate: leverageParams.fundingFeeRate
      };

    } catch (error) {
      console.error('[GridOptimizer] Error optimizing grid parameters:', error);
      throw new Error('Failed to optimize grid parameters');
    }
  }

  /**
   * Save optimized parameters to database for a user
   */
  async saveGridStrategy(userId: string, symbol: string, parameters: OptimizedGridParameters): Promise<string> {
    try {
      const result = await query(
        `INSERT INTO grid_strategies (user_id, symbol, parameters, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'draft', NOW(), NOW())
         RETURNING id`,
        [userId, symbol, JSON.stringify(parameters)]
      );

      return result.rows[0].id;
    } catch (error) {
      console.error('[GridOptimizer] Error saving grid strategy:', error);
      throw new Error('Failed to save grid strategy');
    }
  }

  /**
   * Get all strategies for a user
   */
  async getUserStrategies(userId: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT id, symbol, parameters, status, created_at, updated_at
         FROM grid_strategies
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows.map(row => ({
        ...row,
        parameters: JSON.parse(row.parameters)
      }));
    } catch (error) {
      console.error('[GridOptimizer] Error fetching user strategies:', error);
      throw new Error('Failed to fetch user strategies');
    }
  }
}

export const gridOptimizerService = new GridOptimizerService();