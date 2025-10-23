import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';

interface MonteCarloData {
  scenarios: Array<{
    finalBalance: number;
    totalTrades: number;
    profitableTrades: number;
    maxDrawdown: number;
    sharpeRatio: number;
    path: Array<{ day: number; price: number; balance: number }>;
  }>;
  statistics: {
    percentile10: number;
    percentile50: number;
    percentile90: number;
    meanReturn: number;
    medianReturn: number;
    stdDeviation: number;
    probabilityOfProfit: number;
    expectedTrades: number;
    expectedWinRate: number;
  };
  investmentAmount: number;
  leverage: number;
  projectionDays: number;
}

interface MonteCarloProjectionProps {
  monteCarloData: MonteCarloData;
  isBlurred?: boolean;
}

const MonteCarloProjection: React.FC<MonteCarloProjectionProps> = ({ monteCarloData, isBlurred = false }) => {
  const { scenarios, statistics, investmentAmount, projectionDays } = monteCarloData;

  // Create fan chart data (percentile bands)
  const fanChartData = useMemo(() => {
    if (!scenarios || scenarios.length === 0) return [];

    const data: Array<{
      day: number;
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
    }> = [];

    // For each day, calculate percentiles across all scenarios
    for (let day = 0; day <= projectionDays; day++) {
      const balancesAtDay = scenarios
        .map(s => s.path.find(p => p.day === day)?.balance || investmentAmount)
        .sort((a, b) => a - b);

      data.push({
        day,
        p10: balancesAtDay[Math.floor(scenarios.length * 0.10)],
        p25: balancesAtDay[Math.floor(scenarios.length * 0.25)],
        p50: balancesAtDay[Math.floor(scenarios.length * 0.50)],
        p75: balancesAtDay[Math.floor(scenarios.length * 0.75)],
        p90: balancesAtDay[Math.floor(scenarios.length * 0.90)]
      });
    }

    return data;
  }, [scenarios, projectionDays, investmentAmount]);

  // Calculate outcome probabilities for the visualization
  const outcomeRanges = useMemo(() => {
    const finalBalances = scenarios.map(s => s.finalBalance);
    const returns = finalBalances.map(b => ((b - investmentAmount) / investmentAmount) * 100);

    return {
      profitLarge: returns.filter(r => r > 15).length / returns.length * 100,
      profitMedium: returns.filter(r => r > 5 && r <= 15).length / returns.length * 100,
      profitSmall: returns.filter(r => r > 0 && r <= 5).length / returns.length * 100,
      breakEven: returns.filter(r => r >= -2 && r <= 0).length / returns.length * 100,
      loss: returns.filter(r => r < -2).length / returns.length * 100
    };
  }, [scenarios, investmentAmount]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 border border-gray-700 rounded-lg px-4 py-3">
          <p className="text-gray-400 text-xs mb-2">Day {data.day}</p>
          <div className="space-y-1">
            <p className="text-green-400 text-xs font-semibold">Best: ${data.p90.toFixed(2)}</p>
            <p className="text-blue-400 text-xs font-semibold">Likely: ${data.p50.toFixed(2)}</p>
            <p className="text-yellow-400 text-xs font-semibold">Worst: ${data.p10.toFixed(2)}</p>
          </div>
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
            <h3 className="text-xl font-bold text-white mb-2">Login to View Full Analysis</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              See detailed probability analysis, scenario breakdowns, and risk metrics
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

      {/* Header with key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1 uppercase font-semibold">Expected Return</div>
          <div className={`text-2xl font-bold ${statistics.medianReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {statistics.medianReturn >= 0 ? '+' : ''}{statistics.medianReturn.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">3-month median</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1 uppercase font-semibold">Probability</div>
          <div className="text-2xl font-bold text-blue-400">
            {statistics.probabilityOfProfit.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Chance of profit</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1 uppercase font-semibold">Expected Trades</div>
          <div className="text-2xl font-bold text-white">
            {Math.round(statistics.expectedTrades)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Over 3 months</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1 uppercase font-semibold">Win Rate</div>
          <div className="text-2xl font-bold text-white">
            {statistics.expectedWinRate.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Expected</div>
        </div>
      </div>

      {/* Fan Chart */}
      <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase">3-Month Projection (1000 Scenarios)</h4>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={fanChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="day"
                stroke="#6B7280"
                style={{ fontSize: '10px' }}
                label={{ value: 'Days', position: 'insideBottom', offset: -5, style: { fontSize: '11px', fill: '#9CA3AF' } }}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '10px' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                label={{ value: 'Account Balance ($)', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#9CA3AF' } }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Initial investment line */}
              <ReferenceLine
                y={investmentAmount}
                stroke="#6B7280"
                strokeDasharray="3 3"
                label={{
                  value: `Initial: $${investmentAmount}`,
                  position: 'right',
                  fill: '#9CA3AF',
                  fontSize: 10
                }}
              />

              {/* 80% confidence interval (P10-P90) - Light area */}
              <Area
                type="monotone"
                dataKey="p90"
                stroke="none"
                fill="#8B5CF6"
                fillOpacity={0.15}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="p10"
                stroke="none"
                fill="#1F2937"
                fillOpacity={1}
                isAnimationActive={false}
              />

              {/* 50% confidence interval (P25-P75) - Darker area */}
              <Area
                type="monotone"
                dataKey="p75"
                stroke="none"
                fill="#8B5CF6"
                fillOpacity={0.3}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="p25"
                stroke="none"
                fill="#1F2937"
                fillOpacity={1}
                isAnimationActive={false}
              />

              {/* Boundary lines */}
              <Line
                type="monotone"
                dataKey="p90"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="p10"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
              />

              {/* Median line (P50) - Most likely outcome */}
              <Line
                type="monotone"
                dataKey="p50"
                stroke="#60A5FA"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-400"></div>
            <span className="text-gray-400">Most Likely (Median)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-purple-500 opacity-30"></div>
            <span className="text-gray-400">50% Confidence Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-purple-500 opacity-15"></div>
            <span className="text-gray-400">80% Confidence Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500" style={{ borderTop: '2px dashed' }}></div>
            <span className="text-gray-400">Best Case (90th %ile)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500" style={{ borderTop: '2px dashed' }}></div>
            <span className="text-gray-400">Worst Case (10th %ile)</span>
          </div>
        </div>
      </div>

      {/* Scenario Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Outcome Scenarios</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Best Case (90th %ile)</span>
              <span className="text-sm font-semibold text-green-400">
                +{statistics.percentile90.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Likely (Median)</span>
              <span className={`text-sm font-semibold ${statistics.percentile50 >= 0 ? 'text-blue-400' : 'text-yellow-400'}`}>
                {statistics.percentile50 >= 0 ? '+' : ''}{statistics.percentile50.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Worst Case (10th %ile)</span>
              <span className={`text-sm font-semibold ${statistics.percentile10 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {statistics.percentile10 >= 0 ? '+' : ''}{statistics.percentile10.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="text-sm text-gray-400">Average Return</span>
              <span className={`text-sm font-semibold ${statistics.meanReturn >= 0 ? 'text-white' : 'text-gray-400'}`}>
                {statistics.meanReturn >= 0 ? '+' : ''}{statistics.meanReturn.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Probability Distribution</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Large Profit (&gt;15%)</span>
                <span className="text-green-400 font-semibold">{outcomeRanges.profitLarge.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${outcomeRanges.profitLarge}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Medium Profit (5-15%)</span>
                <span className="text-blue-400 font-semibold">{outcomeRanges.profitMedium.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${outcomeRanges.profitMedium}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Small Profit (0-5%)</span>
                <span className="text-cyan-400 font-semibold">{outcomeRanges.profitSmall.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${outcomeRanges.profitSmall}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Loss (&lt;-2%)</span>
                <span className="text-red-400 font-semibold">{outcomeRanges.loss.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${outcomeRanges.loss}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-1">Forward Projection Disclaimer</p>
            <p className="text-xs text-gray-400">
              This Monte Carlo simulation projects potential outcomes based on historical volatility and market patterns. Results are probabilistic estimates, not guarantees. Actual performance may vary significantly. Past patterns do not predict future results. Leveraged trading carries substantial risk of loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonteCarloProjection;
