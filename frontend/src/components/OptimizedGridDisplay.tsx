import React, { useState } from 'react';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import RealGridTradingChart from './RealGridTradingChart';
import type { OptimizedGridSetup } from '../utils/completeGridOptimizer';

interface OptimizedGridDisplayProps {
  setup: OptimizedGridSetup;
  onCopySetup?: () => void;
  onDeployToBroker?: () => void;
  onViewBacktest?: () => void;
}

export const OptimizedGridDisplay: React.FC<OptimizedGridDisplayProps> = ({
  setup,
  onCopySetup,
  onDeployToBroker,
  onViewBacktest
}) => {
  const { user } = useAuth();
  const isPremium = user?.tier === 'premium';
  const [activeTab, setActiveTab] = useState<'overview' | 'grid' | 'projection'>('overview');

  const { gridParameters, expectedPerformance, aiInsights, visualization, metadata } = setup;

  const getRiskColor = (score: number) => {
    if (score < 3) return 'text-green-500';
    if (score < 7) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRegimeColor = (regime: string) => {
    if (regime === 'ranging') return 'text-green-500';
    if (regime === 'trending') return 'text-blue-500';
    return 'text-orange-500';
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">OPTIMIZED GRID SETUP</h3>
            <div className="text-blue-100 text-xs mt-1">
              {metadata.symbol} • {metadata.riskTolerance.toUpperCase()} • {metadata.timeHorizon}D
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-2xl">
              ${expectedPerformance.expectedProfit.toLocaleString()}
            </div>
            <div className="text-blue-100 text-xs">Expected Profit</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['overview', 'grid', 'projection'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 py-2 text-xs font-semibold transition-all
              ${activeTab === tab
                ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-850'
              }
            `}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800 rounded p-3">
                <div className="text-xs text-gray-400">EXPECTED APR</div>
                <div className="text-xl font-bold text-green-500 mt-1">
                  {expectedPerformance.expectedAPR}%
                </div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <div className="text-xs text-gray-400">SUCCESS PROBABILITY</div>
                <div className="text-xl font-bold text-blue-500 mt-1">
                  {(expectedPerformance.successProbability * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <div className="text-xs text-gray-400">MAX DRAWDOWN</div>
                <div className={`text-xl font-bold mt-1 ${getRiskColor(expectedPerformance.maxDrawdown / 5)}`}>
                  {expectedPerformance.maxDrawdown.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <div className="text-xs text-gray-400">RISK SCORE</div>
                <div className={`text-xl font-bold mt-1 ${getRiskColor(expectedPerformance.riskScore)}`}>
                  {expectedPerformance.riskScore.toFixed(1)}/10
                </div>
              </div>
            </div>

            {/* Grid Parameters */}
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">GRID PARAMETERS</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price Range:</span>
                  <span className="text-white font-mono">
                    ${gridParameters.lowerPrice.toLocaleString()} - ${gridParameters.upperPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Grid Levels:</span>
                  <span className="text-white font-mono">{gridParameters.gridLevels}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Grid Spacing:</span>
                  <span className="text-white font-mono">{gridParameters.spacingPercent.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Capital/Grid:</span>
                  <span className="text-white font-mono">${gridParameters.capitalPerGrid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Leverage:</span>
                  <span className="text-white font-mono">{gridParameters.recommendedLeverage}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Effective Capital:</span>
                  <span className="text-white font-mono">${gridParameters.effectiveCapital.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">AI INSIGHTS</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Market Regime:</span>
                  <span className={`font-semibold ${getRegimeColor(aiInsights.marketRegime)}`}>
                    {aiInsights.marketRegime.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Volatility:</span>
                  <span className="text-white">{(aiInsights.volatility * 100).toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Trend Prediction:</span>
                  <span className="text-white">{aiInsights.trendPrediction}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="text-white">{(aiInsights.historicalWinRate * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded">
                <div className="text-xs text-blue-300 font-semibold mb-1">RECOMMENDATION</div>
                <div className="text-xs text-gray-300">{aiInsights.recommendation}</div>
              </div>

              {aiInsights.riskWarnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {aiInsights.riskWarnings.map((warning: string, idx: number) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs">
                      <svg className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-yellow-400">{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'grid' && (
          <div className="space-y-3">
            {/* Live Chart with Grid Overlay */}
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-xs font-semibold text-gray-400 mb-3">
                LIVE CHART WITH GRID LEVELS
              </h4>
              <div className="h-96 bg-gray-900 rounded">
                <RealGridTradingChart
                  symbol={metadata.symbol}
                  showGridLines={true}
                  gridLevels={visualization.gridLevels}
                  predictedRange={{
                    lower: gridParameters.lowerPrice,
                    upper: gridParameters.upperPrice
                  }}
                  highlightGridZones={true}
                />
              </div>
            </div>

            {/* Grid Statistics - Enhanced 4-column layout */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-gray-800 rounded p-2">
                <div className="text-xs text-gray-400">BUY ORDERS</div>
                <div className="text-lg font-bold text-green-500 mt-1">
                  {visualization.gridLevels.filter(l => l.type === 'buy').length}
                </div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-xs text-gray-400">SELL ORDERS</div>
                <div className="text-lg font-bold text-red-500 mt-1">
                  {visualization.gridLevels.filter(l => l.type === 'sell').length}
                </div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-xs text-gray-400">SPACING</div>
                <div className="text-lg font-bold text-blue-500 mt-1">
                  {gridParameters.spacingPercent.toFixed(2)}%
                </div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-xs text-gray-400">RANGE</div>
                <div className="text-lg font-bold text-purple-500 mt-1">
                  ${(gridParameters.upperPrice - gridParameters.lowerPrice).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Compressed Scrollable Order Book */}
            <div className="bg-gray-800 rounded p-2 max-h-48 overflow-y-auto">
              <h4 className="text-xs font-semibold text-gray-400 mb-2 sticky top-0 bg-gray-800">
                ORDER BOOK ({visualization.gridLevels.length} levels)
              </h4>
              <div className="space-y-0.5">
                {visualization.gridLevels.slice().reverse().map((level, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-center text-xs p-1 rounded ${
                      level.type === 'buy' ? 'bg-green-900/20' : 'bg-red-900/20'
                    }`}
                  >
                    <span className={level.type === 'buy' ? 'text-green-400' : 'text-red-400'}>
                      {level.type.toUpperCase()}
                    </span>
                    <span className="text-white font-mono">${level.price.toFixed(2)}</span>
                    <span className="text-gray-400">${level.capitalRequired.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projection' && (
          <div className="space-y-3">
            {/* Projection Chart */}
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">
                {metadata.timeHorizon}-DAY PROJECTION
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={visualization.projectionData}>
                  <defs>
                    <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    stroke="#6B7280" 
                    style={{ fontSize: '10px' }}
                    tickFormatter={(value) => `D${value}`}
                  />
                  <YAxis 
                    stroke="#6B7280" 
                    style={{ fontSize: '10px' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="none"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="none"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                  />
                  <Line
                    type="monotone"
                    dataKey="median"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <ReferenceLine
                    y={metadata.investmentAmount}
                    stroke="#6B7280"
                    strokeDasharray="3 3"
                    label={{ value: 'Initial', position: 'right', fill: '#9CA3AF', fontSize: 10 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Projection Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800 rounded p-3">
                <div className="text-xs text-gray-400">BEST CASE</div>
                <div className="text-lg font-bold text-green-500 mt-1">
                  ${visualization.projectionData[visualization.projectionData.length - 1]?.upper.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <div className="text-xs text-gray-400">WORST CASE</div>
                <div className="text-lg font-bold text-red-500 mt-1">
                  ${visualization.projectionData[visualization.projectionData.length - 1]?.lower.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-gray-850 border-t border-gray-800 space-y-2">
        <button
          onClick={onCopySetup}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded transition-all"
        >
          📋 COPY SETUP
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onViewBacktest}
            disabled={!isPremium}
            className={`
              py-2 text-sm font-semibold rounded transition-all relative
              ${isPremium
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }
            `}
          >
            📊 BACKTEST
            {!isPremium && (
              <span className="absolute -top-1 -right-1 text-[10px] bg-yellow-500 text-black px-1 rounded">PRO</span>
            )}
          </button>
          
          <button
            onClick={onDeployToBroker}
            disabled={!isPremium}
            className={`
              py-2 text-sm font-semibold rounded transition-all relative
              ${isPremium
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }
            `}
          >
            🚀 DEPLOY
            {!isPremium && (
              <span className="absolute -top-1 -right-1 text-[10px] bg-yellow-500 text-black px-1 rounded">PRO</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
