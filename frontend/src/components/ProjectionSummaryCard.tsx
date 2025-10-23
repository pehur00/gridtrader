import React from 'react';

interface ProjectionSummaryCardProps {
  expectedProfit: number;
  investmentAmount: number;
  leverage: number;
  profitProbability: number;
  riskScore: number; // 0-10 scale
  projectionDays?: number;
  isLoading?: boolean;
}

const ProjectionSummaryCard: React.FC<ProjectionSummaryCardProps> = ({
  expectedProfit,
  investmentAmount,
  leverage,
  profitProbability,
  riskScore,
  projectionDays = 90,
  isLoading = false,
}) => {
  const roi = ((expectedProfit / investmentAmount) * 100);
  const unleveragedROI = roi / leverage;
  
  // Determine risk level and color
  const getRiskLevel = () => {
    if (riskScore <= 3) return { label: 'Low Risk', color: 'green' };
    if (riskScore <= 5) return { label: 'Moderate Risk', color: 'yellow' };
    if (riskScore <= 7) return { label: 'High Risk', color: 'orange' };
    return { label: 'Very High Risk', color: 'red' };
  };

  const riskLevel = getRiskLevel();

  const getRiskBarColor = () => {
    if (riskScore <= 3) return 'bg-green-500';
    if (riskScore <= 5) return 'bg-yellow-500';
    if (riskScore <= 7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProfitColor = () => {
    if (expectedProfit > 0) return 'text-green-400';
    if (expectedProfit < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getProbabilityColor = () => {
    if (profitProbability >= 70) return 'text-green-400';
    if (profitProbability >= 50) return 'text-yellow-400';
    return 'text-orange-400';
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          📈 {projectionDays}-Day Projection
        </h3>
        {leverage > 1 && (
          <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
            <span className="text-blue-400 text-xs font-semibold">{leverage}x Leverage</span>
          </div>
        )}
      </div>

      {/* Expected Profit */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-1">Expected Profit</div>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${getProfitColor()}`}>
            {expectedProfit >= 0 ? '+' : ''}${expectedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className={`text-2xl font-semibold ${getProfitColor()}`}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
          </div>
          {leverage > 1 && (
            <div className="text-sm text-gray-400">
              ({unleveragedROI >= 0 ? '+' : ''}{unleveragedROI.toFixed(1)}% unleveraged)
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Profit Probability */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Profit Probability</div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getProbabilityColor()}`}>
              {profitProbability.toFixed(0)}%
            </span>
            {profitProbability >= 70 ? (
              <span className="text-green-400">✓</span>
            ) : profitProbability >= 50 ? (
              <span className="text-yellow-400">⚡</span>
            ) : (
              <span className="text-orange-400">⚠️</span>
            )}
          </div>
        </div>

        {/* Investment Amount */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Investment</div>
          <div className="text-2xl font-bold text-white">
            ${investmentAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Risk Level Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Risk Level</span>
          <span className={`text-sm font-semibold ${
            riskLevel.color === 'green' ? 'text-green-400' :
            riskLevel.color === 'yellow' ? 'text-yellow-400' :
            riskLevel.color === 'orange' ? 'text-orange-400' :
            'text-red-400'
          }`}>
            {riskLevel.label}
          </span>
        </div>
        
        {/* Risk Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getRiskBarColor()} transition-all duration-500 rounded-full`}
              style={{ width: `${(riskScore / 10) * 100}%` }}
            />
          </div>
          <span className="text-sm font-bold text-white w-12 text-right">
            {riskScore.toFixed(1)}/10
          </span>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className={`rounded-lg p-4 border ${
        profitProbability >= 70
          ? 'bg-green-500/10 border-green-500/30'
          : profitProbability >= 50
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-orange-500/10 border-orange-500/30'
      }`}>
        <div className="flex items-start gap-3">
          <div className="text-2xl">
            {profitProbability >= 70 ? '🎯' : profitProbability >= 50 ? '📊' : '⚠️'}
          </div>
          <div>
            <div className={`text-sm font-semibold mb-1 ${
              profitProbability >= 70 ? 'text-green-300' :
              profitProbability >= 50 ? 'text-yellow-300' : 'text-orange-300'
            }`}>
              {profitProbability >= 70 ? 'High Confidence' :
               profitProbability >= 50 ? 'Moderate Confidence' : 'Lower Confidence'}
            </div>
            <p className="text-xs text-gray-400">
              {profitProbability >= 70 
                ? `Strong probability of profit based on ${projectionDays}-day Monte Carlo simulation`
                : profitProbability >= 50
                ? `Moderate probability of profit. Consider adjusting leverage or budget`
                : `Lower probability of profit. Review risk parameters carefully`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <span className="text-blue-400">ℹ️</span>
          <p>
            Projection based on historical volatility and {projectionDays}-day Monte Carlo simulation.
            Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectionSummaryCard;
