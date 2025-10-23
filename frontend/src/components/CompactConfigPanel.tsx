import React from 'react';

interface CompactConfigPanelProps {
  budget: number;
  leverage: number;
  currentPrice: number;
  onBudgetChange: (budget: number) => void;
  onLeverageChange: (leverage: number) => void;
}

const CompactConfigPanel: React.FC<CompactConfigPanelProps> = ({
  budget,
  leverage,
  currentPrice,
  onBudgetChange,
  onLeverageChange,
}) => {
  const effectiveCapital = budget * leverage;
  const liquidationPrice = currentPrice * (1 - (1 / leverage) * 0.9);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs">
      {/* Compact Input Row */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-gray-400 text-[10px] mb-0.5 block">Budget</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => onBudgetChange(Math.max(100, parseFloat(e.target.value) || 0))}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
            min="100"
            step="100"
          />
        </div>
        <div>
          <label className="text-gray-400 text-[10px] mb-0.5 block">Leverage</label>
          <select
            value={leverage}
            onChange={(e) => onLeverageChange(parseFloat(e.target.value))}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 gap-1 text-[10px]">
        <div className="bg-gray-800/50 rounded px-1.5 py-1">
          <div className="text-gray-500">Capital</div>
          <div className="text-blue-400 font-semibold">${(effectiveCapital / 1000).toFixed(1)}K</div>
        </div>
        <div className="bg-gray-800/50 rounded px-1.5 py-1">
          <div className="text-gray-500">Liq.</div>
          <div className="text-red-400 font-semibold">${(liquidationPrice / 1000).toFixed(1)}K</div>
        </div>
      </div>

      {/* Risk Indicator */}
      <div className="mt-2 flex items-center gap-1">
        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              leverage <= 2 ? 'bg-green-500' :
              leverage <= 3 ? 'bg-yellow-500' :
              leverage <= 5 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min((leverage / 10) * 100, 100)}%` }}
          />
        </div>
        <span className={`text-[10px] font-semibold ${
          leverage <= 2 ? 'text-green-400' :
          leverage <= 3 ? 'text-yellow-400' :
          leverage <= 5 ? 'text-orange-400' : 'text-red-400'
        }`}>
          {leverage <= 2 ? 'LOW' : leverage <= 3 ? 'MED' : leverage <= 5 ? 'HIGH' : 'MAX'}
        </span>
      </div>
    </div>
  );
};

export default CompactConfigPanel;
