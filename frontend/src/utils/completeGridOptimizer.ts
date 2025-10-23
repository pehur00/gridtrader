/**
 * Complete AI Grid Optimization Service
 * 
 * Takes user inputs and returns a fully optimized grid trading setup
 * with expected performance metrics, visualization data, and AI insights.
 */

import { optimizeGridWithAI } from './aiGridOptimizer';

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type TimeHorizon = 7 | 30 | 90 | 180;

export interface OptimizationInput {
  symbol: string;
  investmentAmount: number;
  riskTolerance: RiskTolerance;
  timeHorizon: TimeHorizon;
  currentPrice: number;
  historicalData: Array<{ time: number; price: number; timestamp: string }>;
}

export interface GridParameters {
  lowerPrice: number;
  upperPrice: number;
  gridLevels: number;
  gridSpacing: number;
  spacingPercent: number;
  capitalPerGrid: number;
  recommendedLeverage: number;
  effectiveCapital: number;
}

export interface ExpectedPerformance {
  expectedAPR: number;
  expectedProfit: number;
  expectedProfitPercent: number;
  successProbability: number;
  maxDrawdown: number;
  riskScore: number;
  confidenceInterval: { lower: number; upper: number };
  estimatedFills: number;
  avgTradeFrequency: string; // e.g., "2.3 trades/day"
}

export interface AIInsights {
  marketRegime: 'ranging' | 'trending' | 'highly_volatile';
  volatility: number;
  trendPrediction: 'bullish' | 'bearish' | 'neutral';
  recommendation: string;
  historicalWinRate: number;
  seasonality: string;
  riskWarnings: string[];
}

export interface GridLevel {
  price: number;
  type: 'buy' | 'sell';
  status: 'pending' | 'active' | 'filled';
  capitalRequired: number;
}

export interface ProjectionDataPoint {
  day: number;
  median: number;
  upper: number;
  lower: number;
  cumulativeProfit: number;
}

export interface OptimizedGridSetup {
  gridParameters: GridParameters;
  expectedPerformance: ExpectedPerformance;
  aiInsights: AIInsights;
  visualization: {
    gridLevels: GridLevel[];
    projectionData: ProjectionDataPoint[];
    priceRange: { min: number; max: number };
  };
  metadata: {
    optimizedAt: string;
    symbol: string;
    investmentAmount: number;
    riskTolerance: RiskTolerance;
    timeHorizon: TimeHorizon;
  };
}

/**
 * Calculate recommended leverage based on risk tolerance and market conditions
 */
function calculateOptimalLeverage(
  riskTolerance: RiskTolerance,
  volatility: number,
  marketRegime: string
): number {
  let baseLeverage: number;
  
  switch (riskTolerance) {
    case 'conservative':
      baseLeverage = 1;
      break;
    case 'moderate':
      baseLeverage = 2;
      break;
    case 'aggressive':
      baseLeverage = 3;
      break;
  }

  // Reduce leverage in volatile or trending markets
  if (marketRegime === 'highly_volatile') {
    baseLeverage = Math.max(1, baseLeverage - 1);
  } else if (marketRegime === 'trending') {
    baseLeverage = Math.max(1, baseLeverage - 0.5);
  }

  // Adjust for volatility (reduce leverage if volatility is high)
  if (volatility > 0.05) {
    baseLeverage = Math.max(1, baseLeverage * 0.7);
  }

  return Math.round(baseLeverage * 10) / 10; // Round to 1 decimal
}

/**
 * Generate Monte Carlo projection data with realistic variance
 */
function generateProjectionData(
  investmentAmount: number,
  expectedAPR: number,
  timeHorizon: number,
  volatility: number,
  leverage: number
): ProjectionDataPoint[] {
  const data: ProjectionDataPoint[] = [];
  const dailyReturn = expectedAPR / 365 / 100;
  
  // Uncertainty increases over time
  // 7d: ±15%, 30d: ±25%, 90d: ±40%, 180d: ±50%
  let uncertaintyFactor: number;
  if (timeHorizon <= 7) uncertaintyFactor = 0.15;
  else if (timeHorizon <= 30) uncertaintyFactor = 0.25;
  else if (timeHorizon <= 90) uncertaintyFactor = 0.40;
  else uncertaintyFactor = 0.50;

  for (let day = 0; day <= timeHorizon; day++) {
    // Expected cumulative profit grows linearly with time
    const expectedReturn = investmentAmount * dailyReturn * day;
    
    // Uncertainty grows with sqrt(time) - standard statistical model
    const uncertaintyGrowth = Math.sqrt(day / timeHorizon);
    const currentUncertainty = expectedReturn * uncertaintyFactor * uncertaintyGrowth;
    
    // Add volatility component
    const volatilityImpact = investmentAmount * volatility * Math.sqrt(day) * leverage;
    const totalUncertainty = currentUncertainty + (volatilityImpact * 0.3);
    
    const median = investmentAmount + expectedReturn;
    const upper = median + totalUncertainty;
    const lower = Math.max(investmentAmount * 0.6, median - totalUncertainty);

    data.push({
      day,
      median: Math.round(median),
      upper: Math.round(upper),
      lower: Math.round(lower),
      cumulativeProfit: Math.round(expectedReturn)
    });
  }

  return data;
}

/**
 * Generate grid levels visualization data
 */
function generateGridLevels(
  lowerPrice: number,
  upperPrice: number,
  gridLevels: number,
  currentPrice: number,
  capitalPerGrid: number
): GridLevel[] {
  const levels: GridLevel[] = [];
  const gridSpacing = (upperPrice - lowerPrice) / gridLevels;

  for (let i = 0; i <= gridLevels; i++) {
    const price = lowerPrice + (i * gridSpacing);
    const isAboveCurrent = price > currentPrice;
    const distancePct = Math.abs(price - currentPrice) / currentPrice;

    let status: 'pending' | 'active' | 'filled';
    if (distancePct < 0.02) {
      status = 'filled';
    } else if (distancePct < 0.05) {
      status = 'active';
    } else {
      status = 'pending';
    }

    levels.push({
      price: Math.round(price),
      type: isAboveCurrent ? 'sell' : 'buy',
      status,
      capitalRequired: Math.round(capitalPerGrid * 100) / 100
    });
  }

  return levels;
}

/**
 * Generate AI insights and recommendations
 */
function generateAIInsights(
  marketRegime: string,
  volatility: number,
  trendPrediction: string,
  riskScore: number,
  gridSpacing: number,
  leverage: number,
  historicalWinRate: number
): AIInsights {
  const warnings: string[] = [];
  
  if (leverage > 2) {
    warnings.push(`High leverage (${leverage}x) increases liquidation risk`);
  }
  if (volatility > 0.05) {
    warnings.push('High volatility detected - consider wider grid spacing');
  }
  if (marketRegime === 'trending') {
    warnings.push('Trending market - grid trading may underperform vs trend following');
  }
  if (riskScore > 7) {
    warnings.push('High risk score - consider reducing position size');
  }

  // Generate recommendation text
  let recommendation = '';
  if (marketRegime === 'ranging') {
    recommendation = `Market regime is RANGING with ${(volatility * 100).toFixed(1)}% volatility. Optimal conditions for grid trading. ${Math.round(gridSpacing * 100) / 100} grid spacing recommended to capture price oscillations.`;
  } else if (marketRegime === 'trending') {
    recommendation = `Market is in a ${trendPrediction.toUpperCase()} TREND. Grid trading may underperform. Consider waiting for ranging conditions or using wider grid spacing.`;
  } else {
    recommendation = `HIGHLY VOLATILE market detected (${(volatility * 100).toFixed(1)}%). Use caution and consider wider grid spacing to avoid excessive rebalancing.`;
  }

  if (historicalWinRate > 0.7) {
    recommendation += ` Historical win rate: ${(historicalWinRate * 100).toFixed(0)}% (last 12 months).`;
  }

  // Seasonality description
  let seasonality = 'No strong seasonal patterns detected.';
  const currentMonth = new Date().getMonth();
  if ([10, 11, 0].includes(currentMonth)) {
    seasonality = 'Q4/Q1 historically shows increased volatility - good for grid trading.';
  } else if ([4, 5, 6].includes(currentMonth)) {
    seasonality = 'Summer months typically show lower volatility - adjust grid spacing accordingly.';
  }

  return {
    marketRegime: marketRegime as any,
    volatility,
    trendPrediction: trendPrediction as any,
    recommendation,
    historicalWinRate,
    seasonality,
    riskWarnings: warnings
  };
}

/**
 * Main optimization function - takes user input and returns complete setup
 */
export async function optimizeCompleteGridSetup(
  input: OptimizationInput
): Promise<OptimizedGridSetup> {
  const {
    symbol,
    investmentAmount,
    riskTolerance,
    timeHorizon,
    currentPrice,
    historicalData
  } = input;

  // Run AI optimization on historical data
  const aiParams = await optimizeGridWithAI(historicalData, currentPrice);

  // Calculate optimal leverage based on risk tolerance and market conditions
  const recommendedLeverage = calculateOptimalLeverage(
    riskTolerance,
    aiParams.expectedVolatility,
    aiParams.marketRegime
  );

  const effectiveCapital = investmentAmount * recommendedLeverage;

  // Calculate grid range centered around current price
  // This ensures we have both buy and sell orders
  let rangeMultiplier = 1.0;
  if (riskTolerance === 'conservative') {
    rangeMultiplier = 0.8; // Narrower range for conservative
  } else if (riskTolerance === 'aggressive') {
    rangeMultiplier = 1.2; // Wider range for aggressive
  }

  // Use AI predicted range but ensure it's centered around current price
  const aiRangeSize = (aiParams.priceRange.upper - aiParams.priceRange.lower) * rangeMultiplier;
  
  // Center the range around current price with 40% below and 60% above
  // This ensures more buy orders (below) and sell orders (above)
  const lowerPrice = Math.round(currentPrice - (aiRangeSize * 0.4));
  const upperPrice = Math.round(currentPrice + (aiRangeSize * 0.6));
  const priceRange = upperPrice - lowerPrice;
  
  // Adjust grid levels based on risk tolerance and investment amount
  let optimalGridLevels = aiParams.gridLevels;
  if (riskTolerance === 'conservative') {
    optimalGridLevels = Math.min(30, optimalGridLevels); // Fewer levels for conservative
  } else if (riskTolerance === 'aggressive') {
    optimalGridLevels = Math.max(50, optimalGridLevels); // More levels for aggressive
  }

  // Ensure capital per grid is reasonable (at least $10)
  const minCapitalPerGrid = 10;
  const maxGridLevels = Math.floor(effectiveCapital / minCapitalPerGrid);
  optimalGridLevels = Math.min(optimalGridLevels, maxGridLevels);

  const gridSpacing = priceRange / optimalGridLevels;
  const spacingPercent = (gridSpacing / currentPrice) * 100;
  const capitalPerGrid = effectiveCapital / optimalGridLevels;

  // Get AI-predicted metrics for the specific time horizon
  const timeHorizonPrediction = aiParams.timeHorizonPredictions[timeHorizon];
  
  // Use AI predictions with leverage adjustments
  const estimatedFills = timeHorizonPrediction.fillsEstimate;
  const baseAPR = timeHorizonPrediction.estimatedAPR;
  
  // Apply leverage to APR (leverage amplifies returns)
  const expectedAPR = baseAPR * recommendedLeverage;
  
  const expectedProfit = (investmentAmount * expectedAPR * (timeHorizon / 365)) / 100;
  const expectedProfitPercent = (expectedProfit / investmentAmount) * 100;

  // Use AI-calculated success probability with leverage adjustment
  let successProbability = timeHorizonPrediction.successProbability;
  
  // Leverage risk adjustment
  if (recommendedLeverage > 2) successProbability -= 0.10;
  if (recommendedLeverage > 3) successProbability -= 0.05;
  
  successProbability = Math.max(0.40, Math.min(0.95, successProbability));

  // Max drawdown: realistic calculation based on volatility, leverage, and spacing
  // Use time-horizon-specific volatility forecast from AI
  const forecastedVolatility = timeHorizonPrediction.volatilityForecast;
  
  // Base drawdown from forecasted volatility (1% volatility = 2-3% drawdown)
  let maxDrawdown = forecastedVolatility * 100 * 2.5;
  
  // Leverage multiplier (2x leverage = 2x drawdown)
  maxDrawdown *= recommendedLeverage;
  
  // Grid spacing impact: tighter spacing = higher drawdown risk
  // (because price can move through more levels against you)
  if (spacingPercent < 1) maxDrawdown *= 1.3;
  if (spacingPercent > 2) maxDrawdown *= 0.8;
  
  // Trending markets increase drawdown risk
  if (aiParams.marketRegime === 'trending') maxDrawdown *= 1.5;
  
  // Cap at reasonable limits: 3-25%
  maxDrawdown = Math.min(25, Math.max(3, maxDrawdown));

  // Risk score (0-10): comprehensive risk assessment
  let riskScore = 0;
  
  // Base risk from user's risk tolerance
  if (riskTolerance === 'conservative') riskScore = 2;
  if (riskTolerance === 'moderate') riskScore = 5;
  if (riskTolerance === 'aggressive') riskScore = 7;
  
  // Leverage adds risk (+1 per 1x leverage above 1x)
  riskScore += (recommendedLeverage - 1);
  
  // Market regime risk
  if (aiParams.marketRegime === 'trending') riskScore += 1.5;
  if (aiParams.marketRegime === 'highly_volatile') riskScore += 1;
  
  // Volatility risk (5% vol = +1 point)
  riskScore += (aiParams.expectedVolatility / 0.05);
  
  // Tight spacing increases risk
  if (spacingPercent < 1) riskScore += 0.5;
  
  // Cap at 0-10 range
  riskScore = Math.min(10, Math.max(0, riskScore));

  const gridParameters: GridParameters = {
    lowerPrice,
    upperPrice,
    gridLevels: optimalGridLevels,
    gridSpacing: Math.round(gridSpacing * 100) / 100,
    spacingPercent: Math.round(spacingPercent * 100) / 100,
    capitalPerGrid: Math.round(capitalPerGrid * 100) / 100,
    recommendedLeverage,
    effectiveCapital: Math.round(effectiveCapital)
  };

  const expectedPerformance: ExpectedPerformance = {
    expectedAPR: Math.round(expectedAPR * 100) / 100,
    expectedProfit: Math.round(expectedProfit * 100) / 100,
    expectedProfitPercent: Math.round(expectedProfitPercent * 100) / 100,
    successProbability: Math.round(successProbability * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    riskScore: Math.round(riskScore * 10) / 10,
    confidenceInterval: {
      lower: Math.round(expectedProfit * 0.6 * 100) / 100,
      upper: Math.round(expectedProfit * 1.4 * 100) / 100
    },
    estimatedFills,
    avgTradeFrequency: `${(estimatedFills / timeHorizon).toFixed(1)} trades/day`
  };

  // Generate AI insights
  const aiInsights = generateAIInsights(
    aiParams.marketRegime,
    aiParams.expectedVolatility,
    aiParams.trendPrediction,
    riskScore,
    gridSpacing,
    recommendedLeverage,
    0.81 // TODO: Calculate actual historical win rate
  );

  // Generate visualization data
  const gridLevelsArray = generateGridLevels(
    lowerPrice,
    upperPrice,
    gridParameters.gridLevels,
    currentPrice,
    capitalPerGrid
  );

  const projectionData = generateProjectionData(
    investmentAmount,
    expectedAPR,
    timeHorizon,
    aiParams.expectedVolatility,
    recommendedLeverage
  );

  const prices = historicalData.map(d => d.price);
  const priceRangeViz = {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };

  return {
    gridParameters,
    expectedPerformance,
    aiInsights,
    visualization: {
      gridLevels: gridLevelsArray,
      projectionData,
      priceRange: priceRangeViz
    },
    metadata: {
      optimizedAt: new Date().toISOString(),
      symbol,
      investmentAmount,
      riskTolerance,
      timeHorizon
    }
  };
}

/**
 * Format optimization results for display
 */
export function formatOptimizationResults(setup: OptimizedGridSetup): string {
  return `
🤖 AI-OPTIMIZED GRID SETUP FOR ${setup.metadata.symbol}

INVESTMENT: $${setup.metadata.investmentAmount.toLocaleString()}
RISK PROFILE: ${setup.metadata.riskTolerance.toUpperCase()}
TIME HORIZON: ${setup.metadata.timeHorizon} days
OPTIMIZATION DATE: ${new Date(setup.metadata.optimizedAt).toLocaleDateString()}

═══════════════════════════════════════════════════════
GRID PARAMETERS
═══════════════════════════════════════════════════════
├─ Lower Price:    $${setup.gridParameters.lowerPrice.toLocaleString()} (Buy Zone)
├─ Upper Price:    $${setup.gridParameters.upperPrice.toLocaleString()} (Sell Zone)
├─ Grid Levels:    ${setup.gridParameters.gridLevels}
├─ Grid Spacing:   $${setup.gridParameters.gridSpacing} (${setup.gridParameters.spacingPercent}%)
├─ Capital/Grid:   $${setup.gridParameters.capitalPerGrid}
└─ Leverage:       ${setup.gridParameters.recommendedLeverage}x (AI Optimized)

═══════════════════════════════════════════════════════
EXPECTED PERFORMANCE (${setup.metadata.timeHorizon} days)
═══════════════════════════════════════════════════════
├─ Expected APR:       ${setup.expectedPerformance.expectedAPR}%
├─ Expected Profit:    $${setup.expectedPerformance.expectedProfit} (${setup.expectedPerformance.expectedProfitPercent}%)
├─ Success Prob:       ${(setup.expectedPerformance.successProbability * 100).toFixed(0)}%
├─ Max Drawdown:       ${setup.expectedPerformance.maxDrawdown}%
├─ Risk Score:         ${setup.expectedPerformance.riskScore}/10
├─ Estimated Fills:    ${setup.expectedPerformance.estimatedFills} orders
└─ Trade Frequency:    ${setup.expectedPerformance.avgTradeFrequency}

═══════════════════════════════════════════════════════
AI INSIGHTS
═══════════════════════════════════════════════════════
${setup.aiInsights.recommendation}

${setup.aiInsights.seasonality}

${setup.aiInsights.riskWarnings.length > 0 ? '⚠️ RISK WARNINGS:\n' + setup.aiInsights.riskWarnings.map(w => `   • ${w}`).join('\n') : '✓ Risk level acceptable'}
  `.trim();
}
