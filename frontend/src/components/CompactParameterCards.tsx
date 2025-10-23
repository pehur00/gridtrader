import React, { useState } from 'react';

interface OptimizedParams {
  priceRange: { lower: number; upper: number };
  gridLevels: number;
  profitPerGrid: number;
  gridSpacing: number;
  confidence: number;
  volatilityScore: number;
  marketRegime: 'ranging' | 'trending' | 'highly_volatile';
  estimatedProfit3M?: number;
  estimatedFills3M?: number;
  estimatedProfit24h?: number;
  estimatedFills24h?: number;
  avgTradeTime: number;
  riskScore: number;
  recommendedInvestment: number;
}

interface CompactParameterCardsProps {
  optimizedParams: OptimizedParams;
  currentPrice: number;
  isLoggedIn: boolean;
  isPremium: boolean;
  aiAnalysis?: string;
}

const CompactParameterCards: React.FC<CompactParameterCardsProps> = ({
  optimizedParams,
  currentPrice,
  isLoggedIn,
  isPremium,
  aiAnalysis
}) => {
  const [showAIModal, setShowAIModal] = useState(false);

  const {
    priceRange,
    gridLevels,
    profitPerGrid,
    confidence,
    marketRegime,
    estimatedProfit3M,
    estimatedFills3M,
    recommendedInvestment,
    riskScore
  } = optimizedParams || {};

  // Safety checks to prevent NaN
  const safeProfit = estimatedProfit3M || 0;
  const safeFills = estimatedFills3M || 0;
  const safeInvestment = recommendedInvestment || 0;
  const safeGridLevels = gridLevels || 0;
  const safeProfitPerGrid = profitPerGrid || 0;
  const safeConfidence = confidence || 0;
  const safeRiskScore = riskScore || 0;
  const safeCurrentPrice = currentPrice || 0;

  const regimeColor = {
    ranging: 'text-green-400',
    trending: 'text-yellow-400',
    highly_volatile: 'text-red-400'
  }[marketRegime];

  const regimeLabel = {
    ranging: 'Ranging (Ideal)',
    trending: 'Trending',
    highly_volatile: 'High Volatility'
  }[marketRegime];

  return (
    <>
      <div className="space-y-3">
        {/* Grid Parameters */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-white mb-3">Grid Parameters</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-400">Price Range</div>
              <div className="text-sm font-medium text-white">
                {priceRange ? `$${(priceRange.lower / 1000).toFixed(0)}K - $${(priceRange.upper / 1000).toFixed(0)}K` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Current Price</div>
              <div className="text-sm font-medium text-blue-400">
                ${safeCurrentPrice.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Grid Levels</div>
              <div className="text-sm font-medium text-white">{safeGridLevels}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Profit/Grid</div>
              <div className="text-sm font-medium text-green-400">{safeProfitPerGrid.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        {/* Market Analysis */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-white mb-3">Market Analysis</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-400">Regime</div>
              <div className={`text-sm font-medium ${regimeColor}`}>{regimeLabel}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Confidence</div>
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${safeConfidence >= 80 ? 'bg-green-400' : safeConfidence >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${safeConfidence}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-white">{safeConfidence}%</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Est. Fills/3M</div>
              <div className="text-sm font-medium text-white">{safeFills}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Est. Profit/3M</div>
              <div className="text-sm font-medium text-green-400">
                ${safeProfit.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Investment & Risk */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-white mb-3">Investment & Risk</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-400">Recommended</div>
              <div className="text-sm font-medium text-white">
                ${safeInvestment.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Risk Level</div>
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${safeRiskScore <= 3 ? 'bg-green-400' : safeRiskScore <= 6 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${(safeRiskScore / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-white">{safeRiskScore}/10</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights (Premium) */}
        {aiAnalysis && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 relative">
            <div className={isPremium ? '' : 'filter blur-sm'}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-purple-400">AI Strategic Insights</h3>
                {isPremium && (
                  <button
                    onClick={() => setShowAIModal(true)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    View Full
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-300 line-clamp-2">{aiAnalysis}</p>
            </div>
            {!isPremium && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
                <div className="text-center">
                  <p className="text-white text-xs font-semibold mb-1">Premium Feature</p>
                  <a href="/login" className="text-xs text-yellow-400 hover:text-yellow-300 underline">
                    Upgrade Now
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Insights Modal */}
      {showAIModal && isPremium && aiAnalysis && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-purple-400">AI Strategic Insights</h2>
              <button
                onClick={() => setShowAIModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{aiAnalysis}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompactParameterCards;
