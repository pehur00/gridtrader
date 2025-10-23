import React from 'react';

interface CompactProjectionCardProps {
  expectedProfit: number;
  investmentAmount: number;
  leverage: number;
  profitProbability: number;
  riskScore: number;
  projectionDays?: number;
}

const CompactProjectionCard: React.FC<CompactProjectionCardProps> = ({
  expectedProfit,
  investmentAmount,
  leverage,
  profitProbability,
  riskScore,
  projectionDays = 90,
}) => {
  const roi = ((expectedProfit / investmentAmount) * 100);
  const unleveragedROI = roi / leverage;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-2">
      {/* Title Row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-[10px] font-semibold">{projectionDays}D PROJECTION</span>
        {leverage > 1 && (
          <span className="text-blue-400 text-[10px] font-semibold">{leverage}x</span>
        )}
      </div>

      {/* Main Profit Display */}
      <div className="mb-2">
        <div className={`text-2xl font-bold ${expectedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {expectedProfit >= 0 ? '+' : ''}${(expectedProfit / 1000).toFixed(1)}K
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className={`text-sm font-semibold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
          </span>
          {leverage > 1 && (
            <span className="text-[10px] text-gray-500">
              ({unleveragedROI >= 0 ? '+' : ''}{unleveragedROI.toFixed(1)}% base)
            </span>
          )}
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div className="grid grid-cols-3 gap-1 text-[10px] mb-2">
        <div className="bg-gray-800/50 rounded px-1.5 py-1">
          <div className="text-gray-500">Prob</div>
          <div className={`font-semibold ${
            profitProbability >= 70 ? 'text-green-400' :
            profitProbability >= 50 ? 'text-yellow-400' : 'text-orange-400'
          }`}>
            {profitProbability.toFixed(0)}%
          </div>
        </div>
        <div className="bg-gray-800/50 rounded px-1.5 py-1">
          <div className="text-gray-500">Risk</div>
          <div className={`font-semibold ${
            riskScore <= 3 ? 'text-green-400' :
            riskScore <= 5 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {riskScore.toFixed(1)}/10
          </div>
        </div>
        <div className="bg-gray-800/50 rounded px-1.5 py-1">
          <div className="text-gray-500">Invest</div>
          <div className="text-white font-semibold">${(investmentAmount / 1000).toFixed(1)}K</div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="flex items-center gap-1">
        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              profitProbability >= 70 ? 'bg-green-500' :
              profitProbability >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
            }`}
            style={{ width: `${profitProbability}%` }}
          />
        </div>
        <span className={`text-[10px] font-semibold ${
          profitProbability >= 70 ? 'text-green-400' :
          profitProbability >= 50 ? 'text-yellow-400' : 'text-orange-400'
        }`}>
          {profitProbability >= 70 ? 'HIGH' : profitProbability >= 50 ? 'MED' : 'LOW'}
        </span>
      </div>
    </div>
  );
};

export default CompactProjectionCard;
