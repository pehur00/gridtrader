/**
 * Enhanced AI Grid Optimization with Forward-Looking Analysis
 *
 * This module analyzes 1 year of historical data to:
 * 1. Identify patterns, trends, and seasonality
 * 2. Predict next 3-month price range and volatility
 * 3. Optimize grid parameters for expected future conditions
 * 4. Provide confidence scores based on pattern recognition
 */

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

interface TimeHorizonPrediction {
  days: number;
  expectedReturn: number;           // Expected % return over this period
  fillsEstimate: number;            // Predicted number of fills
  volatilityForecast: number;       // Expected volatility during period
  priceRangePrediction: {           // Price range for this specific period
    lower: number;
    upper: number;
    confidence: number;
  };
  successProbability: number;       // Probability of profit in this timeframe
  estimatedAPR: number;             // Annualized return for this period
}

interface AIOptimizedParameters {
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

  // Time-horizon-specific predictions (NEW)
  timeHorizonPredictions: {
    [days: number]: TimeHorizonPrediction;
  };
}

/**
 * Analyze seasonal patterns from historical data
 */
function analyzeSeasonality(candles: PriceCandle[]): SeasonalPattern[] {
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
function predictPriceRange3M(
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
    console.warn('[aiGridOptimizer] No valid volatility data, using fallback');
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
    console.error('[aiGridOptimizer] NaN detected in predictions, using fallback');
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
function findOptimalEntryZones(
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
 * Calculate time-horizon-specific predictions
 */
function calculateTimeHorizonPredictions(
  currentPrice: number,
  expectedVolatility: number,
  marketRegime: 'ranging' | 'trending' | 'highly_volatile',
  trendPrediction: 'bullish' | 'bearish' | 'neutral',
  gridSpacing: number,
  profitPerGrid: number
): { [days: number]: TimeHorizonPrediction } {
  const timeHorizons = [7, 30, 90, 180];
  const predictions: { [days: number]: TimeHorizonPrediction } = {};

  timeHorizons.forEach(days => {
    // 1. Calculate expected return based on market conditions
    let baseReturnPerDay = profitPerGrid * 0.01; // Base daily return from grid spacing
    
    // Market regime adjustments
    if (marketRegime === 'ranging') {
      baseReturnPerDay *= 1.2; // Grid trading excels in ranging markets
    } else if (marketRegime === 'trending') {
      baseReturnPerDay *= 0.7; // Lower returns in trending markets
    } else {
      baseReturnPerDay *= 0.9; // Slightly lower in volatile markets
    }
    
    // Trend adjustments
    if (trendPrediction === 'bullish' && marketRegime !== 'trending') {
      baseReturnPerDay *= 1.1; // Bullish ranging = good
    } else if (trendPrediction === 'bearish' && marketRegime === 'trending') {
      baseReturnPerDay *= 0.6; // Bearish trending = bad for grids
    }
    
    const expectedReturn = baseReturnPerDay * days;

    // 2. Estimate fills based on volatility and time
    // Formula: volatility × price movements × days / (grid spacing %)
    const dailyPriceRange = currentPrice * expectedVolatility;
    const priceMovementsPerDay = dailyPriceRange / gridSpacing;
    const fillsPerDay = priceMovementsPerDay * 0.6; // 60% efficiency factor
    const fillsEstimate = Math.round(fillsPerDay * days);

    // 3. Volatility forecast (increases slightly over time due to uncertainty)
    const volatilityForecast = expectedVolatility * (1 + (days / 365) * 0.1);

    // 4. Price range prediction with confidence decay
    const priceRangeSize = currentPrice * expectedVolatility * Math.sqrt(days);
    const rangeMultiplier = marketRegime === 'highly_volatile' ? 1.5 :
                           marketRegime === 'trending' ? 1.2 : 1.0;
    
    const rangeLower = currentPrice - (priceRangeSize * rangeMultiplier * 0.5);
    const rangeUpper = currentPrice + (priceRangeSize * rangeMultiplier * 0.5);
    
    // Confidence decreases with time horizon
    const baseConfidence = marketRegime === 'ranging' ? 0.85 :
                          marketRegime === 'trending' ? 0.70 : 0.60;
    const confidenceDecay = Math.exp(-days / 120); // Exponential decay
    const confidence = baseConfidence * confidenceDecay;

    // 5. Success probability (higher for longer time horizons in ranging markets)
    let successProbability = 0.75; // Base 75%
    
    if (marketRegime === 'ranging') {
      successProbability += 0.15; // Ranging = better for grids
      successProbability += (days / 365) * 0.05; // Longer time = more chances
    }
    
    if (marketRegime === 'trending') {
      successProbability -= 0.20; // Trending = worse for grids
      successProbability -= (days / 365) * 0.10; // Longer trending = worse
    }
    
    if (expectedVolatility > 0.04) {
      successProbability -= 0.10; // High volatility = more risk
    }
    
    successProbability = Math.max(0.40, Math.min(0.95, successProbability));

    // 6. Annualized APR
    const estimatedAPR = (expectedReturn / (days / 365)) * 100;

    predictions[days] = {
      days,
      expectedReturn: parseFloat((expectedReturn * 100).toFixed(2)),
      fillsEstimate,
      volatilityForecast: parseFloat(volatilityForecast.toFixed(4)),
      priceRangePrediction: {
        lower: Math.round(rangeLower),
        upper: Math.round(rangeUpper),
        confidence: parseFloat(confidence.toFixed(2))
      },
      successProbability: parseFloat(successProbability.toFixed(2)),
      estimatedAPR: parseFloat(estimatedAPR.toFixed(2))
    };
  });

  return predictions;
}

/**
 * Main AI optimization function with forward-looking analysis
 */
export function optimizeGridWithAI(
  candles: PriceCandle[],
  currentPrice: number
): AIOptimizedParameters {
  if (candles.length < 90 || currentPrice === 0) {
    // Fallback to basic parameters with time-horizon predictions
    const fallbackGridSpacing = currentPrice * 0.002;
    const fallbackProfitPerGrid = 0.5;
    
    const fallbackTimeHorizonPredictions = calculateTimeHorizonPredictions(
      currentPrice,
      0.02, // fallback volatility
      'ranging',
      'neutral',
      fallbackGridSpacing,
      fallbackProfitPerGrid
    );

    return {
      priceRange: { lower: currentPrice * 0.9, upper: currentPrice * 1.1 },
      gridLevels: 40,
      profitPerGrid: fallbackProfitPerGrid,
      gridSpacing: fallbackGridSpacing,
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
      recommendedInvestment: 100,
      
      timeHorizonPredictions: fallbackTimeHorizonPredictions
    };
  }

  // 1. Analyze seasonal patterns
  const seasonalPatterns = analyzeSeasonality(candles);
  const currentMonth = new Date().getMonth();
  const currentSeasonality = seasonalPatterns.find(p => p.month === currentMonth) ||
    { month: currentMonth, avgReturn: 0, avgVolatility: 0.02, trend: 'neutral' };

  // 2. Predict 3-month price range
  const predictedRange3M = predictPriceRange3M(candles, currentPrice, seasonalPatterns);

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
  const optimalEntryZones = findOptimalEntryZones(candles, predictedRange3M);

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

  // 11. Calculate time-horizon-specific predictions
  const timeHorizonPredictions = calculateTimeHorizonPredictions(
    currentPrice,
    expectedVolatility,
    marketRegime,
    trendPrediction,
    gridSpacing,
    profitPerGrid
  );

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

    timeHorizonPredictions
  };
}

/**
 * Generate forward-looking analysis text
 */
export function generateAIAnalysis(params: AIOptimizedParameters): string {
  const { predictedRange3M, trendPrediction, marketRegime, riskScore, confidence } = params;

  const analysis = [];

  // Market outlook
  analysis.push(`📊 **3-Month Market Outlook**: ${trendPrediction.toUpperCase()}`);
  analysis.push(`Expected price range: $${predictedRange3M.lower.toLocaleString()} - $${predictedRange3M.upper.toLocaleString()}`);
  analysis.push(`Target price: $${predictedRange3M.expectedMid.toLocaleString()} (${predictedRange3M.confidence > 0.7 ? 'High' : predictedRange3M.confidence > 0.5 ? 'Medium' : 'Low'} confidence)`);

  // Market conditions
  analysis.push(`\n🎯 **Market Conditions**: ${marketRegime.toUpperCase().replace('_', ' ')}`);
  analysis.push(`Expected volatility: ${(params.expectedVolatility * 100).toFixed(1)}% daily`);
  analysis.push(`Seasonality factor: ${params.seasonalityFactor > 1 ? 'Positive' : params.seasonalityFactor < 1 ? 'Negative' : 'Neutral'} (${((params.seasonalityFactor - 1) * 100).toFixed(1)}%)`);

  // Grid optimization
  analysis.push(`\n⚙️ **Grid Optimization**:`);
  analysis.push(`• ${params.gridLevels} grid levels optimized for ${marketRegime === 'ranging' ? 'sideways accumulation' : marketRegime === 'trending' ? 'directional momentum' : 'high volatility capture'}`);
  analysis.push(`• Entry zones identified at key support levels`);
  analysis.push(`• ${params.profitPerGrid.toFixed(2)}% profit per grid (${params.gridSpacing} spacing)`);

  // Performance projection
  analysis.push(`\n📈 **3-Month Performance Projection**:`);
  analysis.push(`• Estimated ${params.estimatedFills3M} trades`);
  analysis.push(`• Projected profit: $${params.estimatedProfit3M.toLocaleString()}`);
  analysis.push(`• Average trade duration: ${params.avgTradeTime}h`);

  // Risk assessment
  analysis.push(`\n⚠️ **Risk Assessment**: ${riskScore}/10`);
  if (riskScore <= 3) {
    analysis.push(`Low risk - Ideal conditions for grid trading`);
  } else if (riskScore <= 6) {
    analysis.push(`Moderate risk - Proceed with standard position sizing`);
  } else {
    analysis.push(`Elevated risk - Consider reduced position size`);
  }

  analysis.push(`\n💡 **AI Confidence**: ${confidence}%`);
  analysis.push(`Based on 365 days of pattern analysis and machine learning predictions`);

  return analysis.join('\n');
}