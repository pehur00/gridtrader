/**
 * Monte Carlo Forward Projection for Grid Trading
 *
 * Generates realistic future price scenarios based on:
 * - Historical volatility
 * - Trend analysis
 * - Seasonality patterns
 * - Random walk with drift
 *
 * Simulates grid trading on each scenario to show probability distribution
 */

interface PriceCandle {
  time: number;
  price: number;
  timestamp: string;
}

interface GridParameters {
  priceRange: { lower: number; upper: number };
  gridLevels: number;
  gridSpacing: number;
  profitPerGrid: number;
}

interface SimulationResult {
  finalBalance: number;
  totalTrades: number;
  profitableTrades: number;
  maxDrawdown: number;
  sharpeRatio: number;
  path: Array<{ day: number; price: number; balance: number }>;
}

interface MonteCarloResults {
  scenarios: SimulationResult[];
  statistics: {
    percentile10: number;  // Worst case (10th percentile)
    percentile50: number;  // Expected case (median)
    percentile90: number;  // Best case (90th percentile)
    meanReturn: number;
    medianReturn: number;
    stdDeviation: number;
    probabilityOfProfit: number;
    profitProbability: number; // Alias for backward compatibility
    expectedTrades: number;
    expectedWinRate: number;
    expectedReturn: number;
    bestCase: number;
    worstCase: number;
    expectedProfit: number;
    expectedDrawdown: number;
  };
  fanChartData: Array<{
    day: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  }>;
  investmentAmount: number;
  leverage: number;
  projectionDays: number;
}

// Trading fees
const MAKER_FEE = 0.0002;
const TAKER_FEE = 0.0004;
const SLIPPAGE = 0.0005;

/**
 * Generate a single random price path using Geometric Brownian Motion
 */
function generatePricePath(
  startPrice: number,
  days: number,
  drift: number,        // Daily expected return
  volatility: number,   // Daily volatility
  seasonalityFactor: number = 1.0
): Array<{ day: number; price: number }> {
  const path = [{ day: 0, price: startPrice }];
  let currentPrice = startPrice;

  for (let day = 1; day <= days; day++) {
    // Box-Muller transform for proper normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const normalRandom = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Apply seasonality (stronger effect over time)
    const seasonalAdjustment = 1 + ((seasonalityFactor - 1) * (day / days));

    // Calculate price change with proper GBM
    // Use larger volatility multiplier for more realistic variance
    const dailyReturn = drift * seasonalAdjustment + volatility * normalRandom * 2.0;
    currentPrice = currentPrice * Math.exp(dailyReturn); // Exponential for GBM

    // Weaker mean reversion to allow trends
    const meanReversionStrength = 0.005;
    const deviation = (currentPrice - startPrice) / startPrice;
    currentPrice = currentPrice * (1 - meanReversionStrength * deviation);

    // Allow wider price range (30% loss to 200% gain)
    path.push({ day, price: Math.max(currentPrice, startPrice * 0.7) });
  }

  return path;
}

/**
 * Simulate grid trading on a single price path
 */
function simulateGridOnPath(
  pricePath: Array<{ day: number; price: number }>,
  gridParams: GridParameters,
  investmentAmount: number,
  leverage: number
): SimulationResult {
  const { priceRange, gridLevels, gridSpacing } = gridParams;
  const capitalPerLevel = (investmentAmount * leverage) / gridLevels;

  // Initialize grid levels
  interface GridLevel {
    price: number;
    position: 'LONG' | 'SHORT' | null;
    entryPrice?: number;
    positionSize?: number;
  }

  const gridLevelPrices: GridLevel[] = [];
  for (let i = 0; i <= gridLevels; i++) {
    const price = priceRange.lower + (i * gridSpacing);
    gridLevelPrices.push({ price, position: null });
  }

  let accountBalance = investmentAmount;
  let peakBalance = investmentAmount;
  let maxDrawdown = 0;
  let totalTrades = 0;
  let profitableTrades = 0;
  const returns: number[] = [];
  const balancePath: Array<{ day: number; price: number; balance: number }> = [];

  // Simulate each day
  for (const point of pricePath) {
    const currentPrice = point.price;
    const dayHigh = currentPrice * 1.01; // Assume 1% intraday range
    const dayLow = currentPrice * 0.99;

    // Check each grid level for trades
    for (let i = 0; i < gridLevelPrices.length; i++) {
      const gridLevel = gridLevelPrices[i];
      const gridPrice = gridLevel.price;

      // LONG: Buy low, sell high
      if (dayLow <= gridPrice && gridLevel.position === null && gridPrice < currentPrice) {
        const entryPrice = gridPrice * (1 + SLIPPAGE);
        const positionSize = capitalPerLevel / entryPrice;
        const entryFee = capitalPerLevel * TAKER_FEE;

        gridLevel.position = 'LONG';
        gridLevel.entryPrice = entryPrice;
        gridLevel.positionSize = positionSize;
        accountBalance -= entryFee;
      }

      // Exit LONG
      if (i < gridLevelPrices.length - 1 && gridLevel.position === 'LONG' && gridLevel.entryPrice) {
        const nextGridPrice = gridLevelPrices[i + 1].price;
        if (dayHigh >= nextGridPrice) {
          const exitPrice = nextGridPrice * (1 - SLIPPAGE);
          const positionValue = gridLevel.positionSize! * exitPrice;
          const grossProfit = positionValue - capitalPerLevel;
          const exitFee = positionValue * MAKER_FEE;
          const netProfit = grossProfit - exitFee;

          accountBalance += netProfit;
          totalTrades++;
          if (netProfit > 0) profitableTrades++;
          returns.push((netProfit / capitalPerLevel) * 100);

          gridLevel.position = null;
          gridLevel.entryPrice = undefined;
          gridLevel.positionSize = undefined;
        }
      }

      // SHORT: Sell high, buy low
      if (dayHigh >= gridPrice && gridLevel.position === null && gridPrice > currentPrice) {
        const entryPrice = gridPrice * (1 - SLIPPAGE);
        const positionSize = capitalPerLevel / entryPrice;
        const entryFee = capitalPerLevel * TAKER_FEE;

        gridLevel.position = 'SHORT';
        gridLevel.entryPrice = entryPrice;
        gridLevel.positionSize = positionSize;
        accountBalance -= entryFee;
      }

      // Exit SHORT
      if (i > 0 && gridLevel.position === 'SHORT' && gridLevel.entryPrice) {
        const prevGridPrice = gridLevelPrices[i - 1].price;
        if (dayLow <= prevGridPrice) {
          const exitPrice = prevGridPrice * (1 + SLIPPAGE);
          const positionValue = gridLevel.positionSize! * exitPrice;
          const grossProfit = capitalPerLevel - positionValue;
          const exitFee = positionValue * MAKER_FEE;
          const netProfit = grossProfit - exitFee;

          accountBalance += netProfit;
          totalTrades++;
          if (netProfit > 0) profitableTrades++;
          returns.push((netProfit / capitalPerLevel) * 100);

          gridLevel.position = null;
          gridLevel.entryPrice = undefined;
          gridLevel.positionSize = undefined;
        }
      }
    }

    // Track drawdown
    if (accountBalance > peakBalance) peakBalance = accountBalance;
    const currentDrawdown = ((peakBalance - accountBalance) / peakBalance) * 100;
    if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;

    balancePath.push({ day: point.day, price: point.price, balance: accountBalance });
  }

  // Calculate Sharpe Ratio
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const stdDev = returns.length > 0
    ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
    : 1;
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(90) : 0; // 90 trading days

  return {
    finalBalance: accountBalance,
    totalTrades,
    profitableTrades,
    maxDrawdown,
    sharpeRatio,
    path: balancePath
  };
}

/**
 * Run Monte Carlo simulation with multiple scenarios
 */
export function runMonteCarloSimulation(
  historicalCandles: PriceCandle[],
  gridParams: GridParameters,
  investmentAmount: number,
  leverage: number = 3,
  numSimulations: number = 1000,
  projectionDays: number = 90
): MonteCarloResults {
  // Calculate historical statistics
  const recentCandles = historicalCandles.slice(-90); // Last 90 days
  const returns = [];
  for (let i = 1; i < recentCandles.length; i++) {
    returns.push((recentCandles[i].price - recentCandles[i - 1].price) / recentCandles[i - 1].price);
  }

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);

  // Detect trend
  const firstPrice = recentCandles[0].price;
  const lastPrice = recentCandles[recentCandles.length - 1].price;
  const overallReturn = (lastPrice - firstPrice) / firstPrice;
  const trendStrength = overallReturn / 90; // Daily trend

  const currentPrice = lastPrice;

  // Run simulations
  const scenarios: SimulationResult[] = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    // Add significant randomness to drift and volatility for each simulation
    // This creates diverse outcomes including losses
    const driftVariation = (Math.random() - 0.5) * volatility * 3; // Much wider drift variation
    const volVariation = 0.5 + Math.random() * 1.5; // 0.5x to 2x volatility
    const drift = trendStrength + driftVariation;
    const simVolatility = volatility * volVariation;
    const seasonality = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x seasonality

    // Generate price path
    const pricePath = generatePricePath(currentPrice, projectionDays, drift, simVolatility, seasonality);

    // Simulate grid trading on this path
    const result = simulateGridOnPath(pricePath, gridParams, investmentAmount, leverage);
    scenarios.push(result);
  }

  // Calculate statistics
  const returns_pct = scenarios.map(s => ((s.finalBalance - investmentAmount) / investmentAmount) * 100);
  returns_pct.sort((a, b) => a - b);

  const percentile10 = returns_pct[Math.floor(numSimulations * 0.10)];
  const percentile50 = returns_pct[Math.floor(numSimulations * 0.50)];
  const percentile90 = returns_pct[Math.floor(numSimulations * 0.90)];

  const meanReturn = returns_pct.reduce((a, b) => a + b, 0) / returns_pct.length;
  const stdDeviation = Math.sqrt(
    returns_pct.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns_pct.length
  );

  const probabilityOfProfit = (returns_pct.filter(r => r > 0).length / numSimulations) * 100;
  const expectedTrades = scenarios.reduce((sum, s) => sum + s.totalTrades, 0) / numSimulations;
  const expectedWinRate = scenarios.reduce((sum, s) =>
    sum + (s.totalTrades > 0 ? (s.profitableTrades / s.totalTrades) * 100 : 0), 0
  ) / numSimulations;

  // Generate fan chart data (percentile bands over time)
  const fanChartData: Array<{
    day: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  }> = [];

  for (let day = 0; day <= projectionDays; day++) {
    const balancesAtDay = scenarios
      .map(s => s.path.find(p => p.day === day)?.balance || investmentAmount)
      .sort((a, b) => a - b);

    fanChartData.push({
      day,
      p10: balancesAtDay[Math.floor(scenarios.length * 0.10)],
      p25: balancesAtDay[Math.floor(scenarios.length * 0.25)],
      p50: balancesAtDay[Math.floor(scenarios.length * 0.50)],
      p75: balancesAtDay[Math.floor(scenarios.length * 0.75)],
      p90: balancesAtDay[Math.floor(scenarios.length * 0.90)]
    });
  }

  return {
    scenarios: scenarios.slice(0, 100), // Return 100 sample paths for visualization
    statistics: {
      percentile10,
      percentile50,
      percentile90,
      meanReturn,
      medianReturn: percentile50,
      stdDeviation,
      probabilityOfProfit,
      profitProbability: probabilityOfProfit, // Alias for backward compatibility
      expectedTrades,
      expectedWinRate,
      expectedReturn: meanReturn,
      bestCase: percentile90,
      worstCase: percentile10,
      expectedProfit: (meanReturn / 100) * investmentAmount,
      expectedDrawdown: scenarios.reduce((sum, s) => sum + s.maxDrawdown, 0) / numSimulations
    },
    fanChartData,
    investmentAmount,
    leverage,
    projectionDays
  };
}
