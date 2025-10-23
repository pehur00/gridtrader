import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart, Scatter } from 'recharts';

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

interface BacktestData {
  trades: Trade[];
  totalTrades: number;
  profitableTrades: number;
  totalProfit: number;
  totalFees: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  investmentAmount: number;
  leverage: number;
}

interface BacktestResultsProps {
  backtestData: BacktestData;
  isBlurred?: boolean;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ backtestData, isBlurred = false }) => {
  // Create stable chart data - balance over time
  const chartData = useMemo(() => {
    if (!backtestData.trades || backtestData.trades.length === 0) {
      return [];
    }

    // Create a data point for each trade showing the running balance
    const data = backtestData.trades.map((trade) => ({
      timestamp: trade.timestamp,
      balance: trade.balance,
      pnl: trade.balance - backtestData.investmentAmount
    }));

    return data;
  }, [backtestData.trades, backtestData.investmentAmount]);

  // Calculate Y-axis domain for better scaling
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];

    const balances = chartData.map(d => d.balance);
    const minBalance = Math.min(...balances, backtestData.investmentAmount);
    const maxBalance = Math.max(...balances, backtestData.investmentAmount);
    const range = maxBalance - minBalance;

    // Add 10% padding on top and bottom for better visualization
    const padding = Math.max(range * 0.1, 5); // At least $5 padding

    return [
      Math.floor(minBalance - padding),
      Math.ceil(maxBalance + padding)
    ];
  }, [chartData, backtestData.investmentAmount]);

  // Get completed positions (exits only - both LONG and SHORT)
  const positions = useMemo(() => {
    const completedTrades = backtestData.trades.filter(trade =>
      (trade.side === 'LONG' && trade.type === 'SELL') ||
      (trade.side === 'SHORT' && trade.type === 'BUY')
    );

    return completedTrades.map((trade, index) => ({
      index: index + 1,
      timestamp: trade.timestamp,
      price: trade.price,
      side: trade.side,
      type: trade.type,
      profit: trade.profit,
      netProfit: trade.netProfit,
      fees: trade.fees,
      balance: trade.balance
    }));
  }, [backtestData.trades]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 border border-gray-700 rounded-lg px-4 py-3">
          <p className="text-gray-400 text-xs mb-1">{data.timestamp}</p>
          <p className="text-yellow-400 text-sm font-semibold">
            Balance: ${data.balance.toFixed(2)}
          </p>
          <p className={`text-sm font-semibold ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            P&L: {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative ${isBlurred ? 'select-none' : ''}`}>
      {/* Blur overlay for non-logged-in users */}
      {isBlurred && (
        <div className="absolute inset-0 backdrop-blur-md bg-gray-900/60 z-10 flex items-center justify-center rounded-2xl">
          <div className="text-center px-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Login to View Full Backtest</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              See detailed trade-by-trade analysis, position history, and performance metrics
            </p>
            <Link
              to="/login"
              state={{ from: { pathname: '/' } }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login to Unlock
            </Link>
          </div>
        </div>
      )}

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1 uppercase font-semibold">Total Return</div>
          <div className={`text-2xl font-bold ${backtestData.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {backtestData.totalReturn >= 0 ? '+' : ''}{backtestData.totalReturn.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ${backtestData.totalProfit.toFixed(2)} profit
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1 uppercase font-semibold">Win Rate</div>
          <div className="text-2xl font-bold text-white">
            {backtestData.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {backtestData.profitableTrades} / {backtestData.totalTrades} trades
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1 uppercase font-semibold">Max Drawdown</div>
          <div className="text-2xl font-bold text-yellow-400">
            -{backtestData.maxDrawdown.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Risk metric
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1 uppercase font-semibold">Sharpe Ratio</div>
          <div className="text-2xl font-bold text-white">
            {backtestData.sharpeRatio.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Risk-adjusted return
          </div>
        </div>
      </div>

      {/* Account Balance Growth Chart */}
      <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase">Account Balance Growth Over Time</h4>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="timestamp"
                stroke="#6B7280"
                style={{ fontSize: '10px' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '10px' }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                label={{ value: 'Account Balance ($)', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#9CA3AF' } }}
                domain={yAxisDomain}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Initial investment line */}
              <ReferenceLine
                y={backtestData.investmentAmount}
                stroke="#6B7280"
                strokeDasharray="3 3"
                label={{
                  value: `Initial: $${backtestData.investmentAmount.toLocaleString()}`,
                  position: 'right',
                  fill: '#9CA3AF',
                  fontSize: 10
                }}
              />

              {/* Area showing balance growth/loss */}
              <Area
                type="monotone"
                dataKey="balance"
                fill="#10B981"
                fillOpacity={0.2}
                stroke="none"
                isAnimationActive={false}
                baseValue={backtestData.investmentAmount}
              />

              {/* Balance line */}
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-gray-400">Account Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gray-500 border-dashed"></div>
            <span className="text-gray-400">Initial Investment</span>
          </div>
        </div>
      </div>

      {/* Position History Table */}
      <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase">
          Position History ({positions.length} Completed Trades)
        </h4>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left text-xs text-gray-400 font-semibold py-3 px-3">#</th>
                <th className="text-left text-xs text-gray-400 font-semibold py-3 px-3">Side</th>
                <th className="text-left text-xs text-gray-400 font-semibold py-3 px-3">Exit Price</th>
                <th className="text-left text-xs text-gray-400 font-semibold py-3 px-3">Date</th>
                <th className="text-right text-xs text-gray-400 font-semibold py-3 px-3">Gross P&L</th>
                <th className="text-right text-xs text-gray-400 font-semibold py-3 px-3">Fees</th>
                <th className="text-right text-xs text-gray-400 font-semibold py-3 px-3">Net P&L</th>
                <th className="text-right text-xs text-gray-400 font-semibold py-3 px-3">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {positions.map((position) => (
                <tr key={position.index} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-3 text-gray-400">#{position.index}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                      position.side === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {position.side === 'LONG' ? '↗' : '↘'} {position.side}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-white font-medium">${position.price.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-400 text-xs">
                    {position.timestamp}
                  </td>
                  <td className={`py-3 px-3 text-right font-semibold ${position.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {position.profit >= 0 ? '+' : ''}${position.profit.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-400">
                    -${position.fees.toFixed(2)}
                  </td>
                  <td className={`py-3 px-3 text-right font-semibold ${position.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {position.netProfit >= 0 ? '+' : ''}${position.netProfit.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-white">
                    ${position.balance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Trade Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Trades Executed</span>
              <span className="text-sm font-semibold text-white">{backtestData.totalTrades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Profitable Trades</span>
              <span className="text-sm font-semibold text-green-400">{backtestData.profitableTrades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Losing Trades</span>
              <span className="text-sm font-semibold text-red-400">
                {backtestData.totalTrades - backtestData.profitableTrades}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="text-sm text-gray-400">Average Profit per Trade</span>
              <span className="text-sm font-semibold text-white">
                ${backtestData.totalTrades > 0 ? (backtestData.totalProfit / backtestData.totalTrades).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Investment Details</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Initial Investment</span>
              <span className="text-sm font-semibold text-white">
                ${backtestData.investmentAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Leverage</span>
              <span className="text-sm font-semibold text-yellow-400">
                {backtestData.leverage}x
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Fees Paid</span>
              <span className="text-sm font-semibold text-red-400">
                -${backtestData.totalFees.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Profit</span>
              <span className={`text-sm font-semibold ${backtestData.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {backtestData.totalProfit >= 0 ? '+' : ''}${backtestData.totalProfit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Final Balance</span>
              <span className="text-sm font-semibold text-white">
                ${(backtestData.investmentAmount + backtestData.totalProfit).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="text-sm text-gray-400">ROI</span>
              <span className={`text-sm font-semibold ${backtestData.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {backtestData.totalReturn >= 0 ? '+' : ''}{backtestData.totalReturn.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Backtest disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-yellow-400 mb-1">Backtest Disclaimer</p>
            <p className="text-xs text-gray-400">
              Past performance does not guarantee future results. This backtest simulates leveraged futures grid trading on historical data. Includes realistic trading fees (0.02% maker, 0.04% taker) and slippage (0.05%). Leveraged trading carries significant risk of loss. Actual results may vary significantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestResults;
