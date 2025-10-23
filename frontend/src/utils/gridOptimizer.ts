/**
 * Real Grid Optimization Algorithm
 *
 * This calculates optimal grid parameters based on:
 * - Historical volatility (ATR, Standard Deviation)
 * - Market regime detection (trending vs ranging)
 * - Support/resistance levels
 * - Risk-adjusted optimal spacing
 */

interface PriceCandle {
  time: number;
  price: number;
  timestamp: string;
  high?: number;
  low?: number;
}

interface OptimizedGridParameters {
  priceRange: { lower: number; upper: number };
  gridLevels: number;
  profitPerGrid: number;
  gridSpacing: number;
  confidence: number;
  volatilityScore: number;
  marketRegime: 'ranging' | 'trending' | 'highly_volatile';
  estimatedProfit24h: number;
  estimatedFills24h: number;
  avgTradeTime: number;
}

/**
 * Calculate Average True Range (ATR) - standard volatility measure
 */
function calculateATR(candles: PriceCandle[], period: number = 14): number {
  if (candles.length < period + 1) return 0;

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high || candles[i].price;
    const low = candles[i].low || candles[i].price;
    const prevClose = candles[i - 1].price;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trueRanges.push(tr);
  }

  // Calculate average of last 'period' true ranges
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((sum, tr) => sum + tr, 0) / period;
}

/**
 * Calculate Standard Deviation of returns
 */
function calculateStdDev(candles: PriceCandle[], period: number = 30): number {
  if (candles.length < period) return 0;

  const recentCandles = candles.slice(-period);
  const returns = [];

  for (let i = 1; i < recentCandles.length; i++) {
    const returnPct = (recentCandles[i].price - recentCandles[i - 1].price) / recentCandles[i - 1].price;
    returns.push(returnPct);
  }

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

  return Math.sqrt(variance);
}

/**
 * Detect market regime based on price action
 */
function detectMarketRegime(candles: PriceCandle[]): {
  regime: 'ranging' | 'trending' | 'highly_volatile';
  score: number;
} {
  if (candles.length < 30) {
    return { regime: 'ranging', score: 0.5 };
  }

  const recent = candles.slice(-30);
  const prices = recent.map(c => c.price);

  // Calculate trend strength using linear regression
  const n = prices.length;
  const xSum = (n * (n - 1)) / 2;
  const ySum = prices.reduce((sum, p) => sum + p, 0);
  const xySum = prices.reduce((sum, p, i) => sum + (i * p), 0);
  const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
  const avgPrice = ySum / n;
  const trendStrength = Math.abs(slope) / avgPrice;

  // Calculate price range
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const priceRangePct = (high - low) / avgPrice;

  // Detect regime
  if (priceRangePct > 0.15) {
    return { regime: 'highly_volatile', score: 0.65 }; // Lower confidence in volatile markets
  } else if (trendStrength > 0.001) {
    return { regime: 'trending', score: 0.70 }; // Moderate confidence in trends
  } else {
    return { regime: 'ranging', score: 0.92 }; // High confidence in ranging markets (ideal for grids)
  }
}

/**
 * Find support and resistance levels using price clustering
 */
function findSupportResistance(candles: PriceCandle[], currentPrice: number): {
  support: number;
  resistance: number;
} {
  if (candles.length < 30) {
    return {
      support: currentPrice * 0.95,
      resistance: currentPrice * 1.05
    };
  }

  const prices = candles.slice(-90).map(c => c.price);
  const sortedPrices = [...prices].sort((a, b) => a - b);

  // Find price levels with clustering (support/resistance)
  const clusters: number[] = [];
  let currentCluster = [sortedPrices[0]];

  for (let i = 1; i < sortedPrices.length; i++) {
    const priceDiff = (sortedPrices[i] - sortedPrices[i - 1]) / sortedPrices[i - 1];

    if (priceDiff < 0.02) { // Within 2%
      currentCluster.push(sortedPrices[i]);
    } else {
      if (currentCluster.length >= 3) {
        clusters.push(currentCluster.reduce((sum, p) => sum + p, 0) / currentCluster.length);
      }
      currentCluster = [sortedPrices[i]];
    }
  }

  if (currentCluster.length >= 3) {
    clusters.push(currentCluster.reduce((sum, p) => sum + p, 0) / currentCluster.length);
  }

  // Find nearest support (below current) and resistance (above current)
  const support = clusters.filter(p => p < currentPrice).sort((a, b) => b - a)[0] || currentPrice * 0.95;
  const resistance = clusters.filter(p => p > currentPrice).sort((a, b) => a - b)[0] || currentPrice * 1.05;

  return { support, resistance };
}

/**
 * Calculate optimal grid spacing based on volatility
 */
function calculateOptimalSpacing(atr: number, currentPrice: number, volatilityScore: number): number {
  // Base spacing on ATR (typically want grid spacing = 0.5 * ATR to 1.5 * ATR)
  const minSpacing = atr * 0.5;
  const maxSpacing = atr * 1.5;

  // Adjust based on volatility - tighter grids in low volatility, wider in high
  const spacing = volatilityScore < 0.02 ? minSpacing : maxSpacing;

  return Math.max(spacing, currentPrice * 0.001); // At least 0.1% spacing
}

/**
 * Main optimization function
 */
export function optimizeGridParameters(
  candles: PriceCandle[],
  currentPrice: number
): OptimizedGridParameters {
  if (candles.length < 30 || currentPrice === 0) {
    // Fallback to basic parameters
    return {
      priceRange: { lower: currentPrice * 0.95, upper: currentPrice * 1.05 },
      gridLevels: 50,
      profitPerGrid: 0.5,
      gridSpacing: currentPrice * 0.001,
      confidence: 0,
      volatilityScore: 0,
      marketRegime: 'ranging',
      estimatedProfit24h: 0,
      estimatedFills24h: 0,
      avgTradeTime: 2.4
    };
  }

  // 1. Calculate volatility metrics
  const atr = calculateATR(candles, 14);
  const stdDev = calculateStdDev(candles, 30);
  const volatilityScore = stdDev; // Normalized volatility score

  // 2. Detect market regime
  const { regime, score: regimeConfidence } = detectMarketRegime(candles);

  // 3. Find support/resistance
  const { support, resistance } = findSupportResistance(candles, currentPrice);

  // 4. Calculate optimal grid spacing
  const optimalSpacing = calculateOptimalSpacing(atr, currentPrice, volatilityScore);

  // 5. Determine price range using actual 90-day range with buffer
  // Get the actual high/low from historical data
  const historicalPrices = candles.map(c => c.price);
  const historicalHigh = Math.max(...historicalPrices);
  const historicalLow = Math.min(...historicalPrices);

  // Use the wider of: historical range OR support/resistance with ATR buffer
  const rangeFromHistory = historicalHigh - historicalLow;
  const bufferPct = 0.03; // 3% buffer above/below historical range

  const priceRangeLower = Math.floor(Math.min(
    support,
    historicalLow * (1 - bufferPct)
  ));

  const priceRangeUpper = Math.ceil(Math.max(
    resistance,
    historicalHigh * (1 + bufferPct)
  ));

  // 6. Calculate optimal number of grids
  const priceRange = priceRangeUpper - priceRangeLower;
  const optimalGridCount = Math.floor(priceRange / optimalSpacing);
  const gridLevels = Math.min(Math.max(optimalGridCount, 20), 100); // Between 20-100 grids

  // 7. Calculate actual grid spacing
  const gridSpacing = priceRange / gridLevels;

  // 8. Calculate profit per grid
  const profitPerGrid = (gridSpacing / currentPrice) * 100;

  // 9. Estimate 24h performance based on volatility
  // Higher volatility = more fills
  const dailyVolatilityMoves = volatilityScore * Math.sqrt(365); // Annualized to daily
  const estimatedDailyMoves = (dailyVolatilityMoves * currentPrice) / gridSpacing;
  const estimatedFills24h = Math.min(Math.round(estimatedDailyMoves * 0.7), gridLevels * 2);
  const estimatedProfit24h = Math.round(estimatedFills24h * gridSpacing * (profitPerGrid / 100));

  // 10. Calculate average trade time
  const avgTradeTime = volatilityScore > 0.03 ? 1.5 : volatilityScore > 0.02 ? 2.5 : 4.0;

  // 11. Calculate overall confidence score
  const volatilityConfidence = volatilityScore > 0.01 && volatilityScore < 0.05 ? 0.9 : 0.7;
  const confidence = (regimeConfidence * 0.6) + (volatilityConfidence * 0.4);

  return {
    priceRange: {
      lower: Math.round(priceRangeLower),
      upper: Math.round(priceRangeUpper)
    },
    gridLevels,
    profitPerGrid: parseFloat(profitPerGrid.toFixed(2)),
    gridSpacing: Math.round(gridSpacing),
    confidence: Math.round(confidence * 100),
    volatilityScore,
    marketRegime: regime,
    estimatedProfit24h,
    estimatedFills24h,
    avgTradeTime: parseFloat(avgTradeTime.toFixed(1))
  };
}
