import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import MonteCarloProjection from './MonteCarloProjection';

interface MonteCarloData {
  scenarios: Array<{
    path: Array<{ day: number; balance: number }>;
    finalBalance: number;
    profit: number;
    returnPct: number;
  }>;
  statistics: {
    expectedReturn: number;
    bestCase: number;
    worstCase: number;
    profitProbability: number;
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
  projectionDays: number;
}

interface MiniMonteCarloWidgetProps {
  monteCarloData: MonteCarloData;
  isLoggedIn: boolean;
}

const MiniMonteCarloWidget: React.FC<MiniMonteCarloWidgetProps> = ({ monteCarloData, isLoggedIn }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Show only median line for compact view
  const compactData = monteCarloData.fanChartData.map(d => ({
    day: d.day,
    balance: d.p50
  }));

  const { expectedReturn, profitProbability } = monteCarloData.statistics;

  return (
    <>
      {/* Mini Widget - 200px height */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 relative">
        <div className={isLoggedIn ? '' : 'filter blur-sm'}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">90-Day Projection</h3>
              <div className="flex gap-4 mt-1">
                <div className="text-xs">
                  <span className="text-gray-400">Expected:</span>{' '}
                  <span className={expectedReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {expectedReturn >= 0 ? '+' : ''}{expectedReturn.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-400">Success:</span>{' '}
                  <span className="text-blue-400">{profitProbability.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              disabled={!isLoggedIn}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Full Analysis
            </button>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compactData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="day"
                  stroke="#6B7280"
                  style={{ fontSize: '9px' }}
                  interval="preserveStartEnd"
                  tickFormatter={(day) => `${day}d`}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: '9px' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: '10px'
                  }}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Expected Balance']}
                  labelFormatter={(day) => `Day ${day}`}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
            <div className="text-center">
              <p className="text-white text-sm font-semibold mb-2">Login to View Projections</p>
              <a
                href="/login"
                className="text-xs text-yellow-400 hover:text-yellow-300 underline"
              >
                Login Now
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Modal */}
      {isExpanded && isLoggedIn && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Monte Carlo Projection - Full Analysis</h2>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <MonteCarloProjection monteCarloData={monteCarloData} isLoggedIn={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MiniMonteCarloWidget;
