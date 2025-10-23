/**
 * Grid Trading Backtest Simulator - Futures Edition
 *
 * Simulates leveraged futures grid trading strategy with:
 * - Realistic position sizing based on capital allocation
 * - Trading fees (maker/taker)
 * - Slippage
 * - Proper drawdown calculation
 * - Both buy and sell positions
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
  position: 'LONG' | 'SHORT' | null;
  entryPrice?: number;
  positionSize?: number;
}

interface Trade {
  timestamp: string;
  price: number;
  type: 'BUY' | 'SELL';
  side: 'LONG' | 'SHORT';
  profit: number;
  fees: number;
  netProfit: number;
  balance: number;
}

interface BacktestResults {
  trades: Trade[];
  totalTrades: number;
  profitableTrades: number;
  totalProfit: number;
  totalFees: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  gridLevels: number;
  priceRange: { lower: number; upper: number };
  investmentAmount: number;
  leverage: number;
}

// Binance Futures fee structure
const MAKER_FEE = 0.0002; // 0.02%
const TAKER_FEE = 0.0004; // 0.04%
const SLIPPAGE = 0.0005; // 0.05% average slippage

/**
 * Run backtest simulation on historical data with futures trading
 */
export function runBacktest(
  candles: PriceCandle[],
  gridParameters: {
    priceRange: { lower: number; upper: number };
    gridLevels: number;
    gridSpacing: number;
    profitPerGrid: number;
  },
  investmentAmount: number = 10000,
  leverage: number = 3
): BacktestResults {
  if (candles.length < 2) {
    return createEmptyResults(gridParameters, investmentAmount, leverage);
  }

  const { priceRange, gridLevels, gridSpacing } = gridParameters;

  // Calculate position size per grid level
  // Divide capital across all grid levels
  const capitalPerLevel = (investmentAmount * leverage) / gridLevels;

  // Initialize grid levels - half for longs (below price), half for shorts (above price)
  const midPrice = (priceRange.lower + priceRange.upper) / 2;
  const gridLevelPrices: GridLevel[] = [];

  for (let i = 0; i <= gridLevels; i++) {
    const price = priceRange.lower + (i * gridSpacing);
    gridLevelPrices.push({
      price,
      position: null,
      entryPrice: undefined,
      positionSize: undefined
    });
  }

  const trades: Trade[] = [];
  let accountBalance = investmentAmount;
  let peakBalance = investmentAmount;
  let maxDrawdown = 0;
  let profitableTrades = 0;
  let totalFees = 0;
  const returns: number[] = [];

  // Simulate trading day by day
  for (let dayIndex = 0; dayIndex < candles.length; dayIndex++) {
    const candle = candles[dayIndex];
    const currentPrice = candle.price;
    const high = candle.high || currentPrice * 1.005;
    const low = candle.low || currentPrice * 0.995;

    // Check each grid level
    for (let i = 0; i < gridLevelPrices.length; i++) {
      const gridLevel = gridLevelPrices[i];
      const gridPrice = gridLevel.price;

      // LONG POSITION LOGIC (buy low, sell high)
      // Enter long when price touches grid level from above
      if (low <= gridPrice && gridLevel.position === null && gridPrice < currentPrice) {
        const entryPrice = gridPrice * (1 + SLIPPAGE); // Account for slippage
        const positionSize = capitalPerLevel / entryPrice;
        const entryFee = capitalPerLevel * TAKER_FEE;

        gridLevel.position = 'LONG';
        gridLevel.entryPrice = entryPrice;
        gridLevel.positionSize = positionSize;

        accountBalance -= entryFee;
        totalFees += entryFee;

        trades.push({
          timestamp: candle.timestamp,
          price: entryPrice,
          type: 'BUY',
          side: 'LONG',
          profit: 0,
          fees: entryFee,
          netProfit: -entryFee,
          balance: accountBalance
        });
      }

      // Exit long when price reaches next grid level above
      if (i < gridLevelPrices.length - 1 && gridLevel.position === 'LONG' && gridLevel.entryPrice) {
        const nextGridPrice = gridLevelPrices[i + 1].price;

        if (high >= nextGridPrice) {
          const exitPrice = nextGridPrice * (1 - SLIPPAGE); // Account for slippage
          const positionValue = gridLevel.positionSize! * exitPrice;
          const grossProfit = positionValue - capitalPerLevel;
          const exitFee = positionValue * MAKER_FEE;
          const netProfit = grossProfit - exitFee;

          accountBalance += netProfit;
          totalFees += exitFee;

          if (netProfit > 0) profitableTrades++;

          const returnPct = (netProfit / capitalPerLevel) * 100;
          returns.push(returnPct);

          trades.push({
            timestamp: candle.timestamp,
            price: exitPrice,
            type: 'SELL',
            side: 'LONG',
            profit: grossProfit,
            fees: exitFee,
            netProfit: netProfit,
            balance: accountBalance
          });

          // Reset position
          gridLevel.position = null;
          gridLevel.entryPrice = undefined;
          gridLevel.positionSize = undefined;
        }
      }

      // SHORT POSITION LOGIC (sell high, buy low)
      // Enter short when price touches grid level from below
      if (high >= gridPrice && gridLevel.position === null && gridPrice > currentPrice) {
        const entryPrice = gridPrice * (1 - SLIPPAGE); // Account for slippage
        const positionSize = capitalPerLevel / entryPrice;
        const entryFee = capitalPerLevel * TAKER_FEE;

        gridLevel.position = 'SHORT';
        gridLevel.entryPrice = entryPrice;
        gridLevel.positionSize = positionSize;

        accountBalance -= entryFee;
        totalFees += entryFee;

        trades.push({
          timestamp: candle.timestamp,
          price: entryPrice,
          type: 'SELL',
          side: 'SHORT',
          profit: 0,
          fees: entryFee,
          netProfit: -entryFee,
          balance: accountBalance
        });
      }

      // Exit short when price reaches next grid level below
      if (i > 0 && gridLevel.position === 'SHORT' && gridLevel.entryPrice) {
        const prevGridPrice = gridLevelPrices[i - 1].price;

        if (low <= prevGridPrice) {
          const exitPrice = prevGridPrice * (1 + SLIPPAGE); // Account for slippage
          const positionValue = gridLevel.positionSize! * exitPrice;
          const grossProfit = capitalPerLevel - positionValue;
          const exitFee = positionValue * MAKER_FEE;
          const netProfit = grossProfit - exitFee;

          accountBalance += netProfit;
          totalFees += exitFee;

          if (netProfit > 0) profitableTrades++;

          const returnPct = (netProfit / capitalPerLevel) * 100;
          returns.push(returnPct);

          trades.push({
            timestamp: candle.timestamp,
            price: exitPrice,
            type: 'BUY',
            side: 'SHORT',
            profit: grossProfit,
            fees: exitFee,
            netProfit: netProfit,
            balance: accountBalance
          });

          // Reset position
          gridLevel.position = null;
          gridLevel.entryPrice = undefined;
          gridLevel.positionSize = undefined;
        }
      }
    }

    // Track drawdown based on account balance
    if (accountBalance > peakBalance) {
      peakBalance = accountBalance;
    }

    const currentDrawdown = ((peakBalance - accountBalance) / peakBalance) * 100;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
  }

  // Calculate performance metrics
  const totalProfit = accountBalance - investmentAmount;
  const totalReturn = (totalProfit / investmentAmount) * 100;

  const completedTrades = trades.filter(t =>
    (t.type === 'SELL' && t.side === 'LONG') ||
    (t.type === 'BUY' && t.side === 'SHORT')
  );

  const winRate = completedTrades.length > 0
    ? (profitableTrades / completedTrades.length) * 100
    : 0;

  // Calculate Sharpe Ratio (simplified, annualized)
  const avgReturn = returns.length > 0
    ? returns.reduce((sum, r) => sum + r, 0) / returns.length
    : 0;
  const stdDev = returns.length > 0
    ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
    : 1;
  const sharpeRatio = stdDev !== 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  return {
    trades,
    totalTrades: completedTrades.length,
    profitableTrades,
    totalProfit,
    totalFees,
    totalReturn,
    winRate: Math.min(winRate, 100),
    maxDrawdown: Math.max(maxDrawdown, 0),
    sharpeRatio,
    gridLevels: gridParameters.gridLevels,
    priceRange: gridParameters.priceRange,
    investmentAmount,
    leverage
  };
}

function createEmptyResults(
  gridParameters: {
    priceRange: { lower: number; upper: number };
    gridLevels: number;
  },
  investmentAmount: number,
  leverage: number
): BacktestResults {
  return {
    trades: [],
    totalTrades: 0,
    profitableTrades: 0,
    totalProfit: 0,
    totalFees: 0,
    totalReturn: 0,
    winRate: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    gridLevels: gridParameters.gridLevels,
    priceRange: gridParameters.priceRange,
    investmentAmount,
    leverage
  };
}
