/**
 * Grid Trading Backtest Simulator
 *
 * Simulates grid trading strategy on historical data to show:
 * - All buy/sell positions executed
 * - Profit/loss from each trade
 * - Cumulative P&L over time
 * - Performance metrics
 */

interface PriceCandle {
  time: number;
  price: number;
  timestamp: string;
  high?: number;
  low?: number;
}

interface GridLevel {
  price: number;
  hasPosition: boolean;
  buyPrice?: number;
}

interface Trade {
  timestamp: string;
  price: number;
  type: 'BUY' | 'SELL';
  profit: number;
  cumulativePnL: number;
}

interface BacktestResults {
  trades: Trade[];
  totalTrades: number;
  profitableTrades: number;
  totalProfit: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  gridLevels: number;
  priceRange: { lower: number; upper: number };
  investmentAmount: number;
}

/**
 * Run backtest simulation on historical data
 */
export function runBacktest(
  candles: PriceCandle[],
  gridParameters: {
    priceRange: { lower: number; upper: number };
    gridLevels: number;
    gridSpacing: number;
    profitPerGrid: number;
  },
  investmentAmount: number = 10000
): BacktestResults {
  if (candles.length < 2) {
    return createEmptyResults(gridParameters, investmentAmount);
  }

  const { priceRange, gridLevels, gridSpacing } = gridParameters;

  // Initialize grid levels
  const gridLevelPrices: GridLevel[] = [];
  for (let i = 0; i <= gridLevels; i++) {
    const price = priceRange.lower + (i * gridSpacing);
    gridLevelPrices.push({ price, hasPosition: false });
  }

  const trades: Trade[] = [];
  let cumulativePnL = 0;
  let maxPnL = 0;
  let maxDrawdown = 0;
  let profitableTrades = 0;
  const returns: number[] = [];

  // Simulate trading day by day
  for (let dayIndex = 0; dayIndex < candles.length; dayIndex++) {
    const candle = candles[dayIndex];
    const currentPrice = candle.price;
    const high = candle.high || currentPrice;
    const low = candle.low || currentPrice;

    // Check each grid level
    for (let i = 0; i < gridLevelPrices.length; i++) {
      const gridLevel = gridLevelPrices[i];

      // Buy at grid level if price touches it and we don't have a position
      if (low <= gridLevel.price && !gridLevel.hasPosition) {
        gridLevel.hasPosition = true;
        gridLevel.buyPrice = gridLevel.price;

        trades.push({
          timestamp: candle.timestamp,
          price: gridLevel.price,
          type: 'BUY',
          profit: 0,
          cumulativePnL
        });
      }

      // Sell at next grid level if price touches it and we have a position
      if (i > 0 && gridLevelPrices[i - 1].hasPosition) {
        const lowerLevel = gridLevelPrices[i - 1];

        if (high >= gridLevel.price && lowerLevel.buyPrice) {
          // Execute sell
          const profit = gridLevel.price - lowerLevel.buyPrice;
          const profitPct = (profit / lowerLevel.buyPrice) * 100;

          cumulativePnL += profit;

          if (profit > 0) profitableTrades++;
          if (cumulativePnL > maxPnL) maxPnL = cumulativePnL;

          const drawdown = maxPnL - cumulativePnL;
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;

          returns.push(profitPct);

          trades.push({
            timestamp: candle.timestamp,
            price: gridLevel.price,
            type: 'SELL',
            profit,
            cumulativePnL
          });

          // Reset position
          lowerLevel.hasPosition = false;
          lowerLevel.buyPrice = undefined;
        }
      }
    }
  }

  // Calculate performance metrics
  const totalReturn = (cumulativePnL / investmentAmount) * 100;
  const winRate = trades.length > 0
    ? (profitableTrades / (trades.filter(t => t.type === 'SELL').length)) * 100
    : 0;

  // Calculate Sharpe Ratio (simplified)
  const avgReturn = returns.length > 0
    ? returns.reduce((sum, r) => sum + r, 0) / returns.length
    : 0;
  const stdDev = returns.length > 0
    ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
    : 1;
  const sharpeRatio = stdDev !== 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

  return {
    trades,
    totalTrades: trades.filter(t => t.type === 'SELL').length,
    profitableTrades,
    totalProfit: cumulativePnL,
    totalReturn,
    winRate: Math.min(winRate, 100),
    maxDrawdown: (maxDrawdown / investmentAmount) * 100,
    sharpeRatio,
    gridLevels: gridParameters.gridLevels,
    priceRange: gridParameters.priceRange,
    investmentAmount
  };
}

function createEmptyResults(
  gridParameters: {
    priceRange: { lower: number; upper: number };
    gridLevels: number;
  },
  investmentAmount: number
): BacktestResults {
  return {
    trades: [],
    totalTrades: 0,
    profitableTrades: 0,
    totalProfit: 0,
    totalReturn: 0,
    winRate: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    gridLevels: gridParameters.gridLevels,
    priceRange: gridParameters.priceRange,
    investmentAmount
  };
}
