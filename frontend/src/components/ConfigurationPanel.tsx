import React, { useEffect, useState } from 'react';

interface ConfigurationPanelProps {
  budget: number;
  leverage: number;
  currentPrice: number;
  onBudgetChange: (budget: number) => void;
  onLeverageChange: (leverage: number) => void;
  onCustomPriceChange?: (price: number | null) => void;
  customPrice?: number | null;
}

const leveragePresets = [
  { value: 1, label: '1x (No Leverage)', risk: 'low', color: 'green' },
  { value: 2, label: '2x (Conservative)', risk: 'low', color: 'green' },
  { value: 3, label: '3x (Moderate)', risk: 'medium', color: 'yellow' },
  { value: 5, label: '5x (Aggressive)', risk: 'high', color: 'orange' },
  { value: 10, label: '10x (Very Aggressive)', risk: 'very-high', color: 'red' },
];

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  budget,
  leverage,
  currentPrice,
  onBudgetChange,
  onLeverageChange,
  onCustomPriceChange,
  customPrice,
}) => {
  const [localBudget, setLocalBudget] = useState(budget.toString());
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [localCustomPrice, setLocalCustomPrice] = useState(currentPrice.toString());

  const effectiveCapital = budget * leverage;
  // Simplified liquidation calculation (assumes short position for demo)
  // In reality, this depends on position type and exchange margin requirements
  const liquidationPrice = currentPrice * (1 - (1 / leverage) * 0.9); // 90% of theoretical

  const selectedPreset = leveragePresets.find(p => p.value === leverage) || leveragePresets[0];

  const handleBudgetBlur = () => {
    const value = parseFloat(localBudget);
    if (!isNaN(value) && value > 0) {
      onBudgetChange(value);
    } else {
      setLocalBudget(budget.toString());
    }
  };

  const handleCustomPriceBlur = () => {
    if (!useCustomPrice) return;
    const value = parseFloat(localCustomPrice);
    if (!isNaN(value) && value > 0 && onCustomPriceChange) {
      onCustomPriceChange(value);
    } else {
      setLocalCustomPrice((customPrice || currentPrice).toString());
    }
  };

  const handleCustomPriceToggle = (enabled: boolean) => {
    setUseCustomPrice(enabled);
    if (onCustomPriceChange) {
      if (enabled) {
        onCustomPriceChange(parseFloat(localCustomPrice));
      } else {
        onCustomPriceChange(null);
      }
    }
  };

  useEffect(() => {
    setLocalBudget(budget.toString());
  }, [budget]);

  useEffect(() => {
    if (!useCustomPrice && currentPrice) {
      setLocalCustomPrice(currentPrice.toString());
    }
  }, [currentPrice, useCustomPrice]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'high': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'very-high': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  const getWarningMessage = () => {
    if (leverage >= 10) {
      return '⚠️ Extreme risk: 10x leverage can lead to rapid liquidation';
    } else if (leverage >= 5) {
      return '⚠️ High risk: Monitor positions closely to avoid liquidation';
    } else if (leverage >= 3) {
      return '⚡ Moderate risk: Balanced approach for experienced traders';
    }
    return '✓ Lower risk: Conservative approach recommended for beginners';
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          ⚙️ Grid Configuration
        </h3>
        <div className={`px-3 py-1 rounded-full border ${getRiskColor(selectedPreset.risk)} text-xs font-semibold`}>
          {selectedPreset.risk.toUpperCase().replace('-', ' ')} RISK
        </div>
      </div>

      {/* Budget Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Initial Budget
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">$</span>
          <input
            type="number"
            value={localBudget}
            onChange={(e) => setLocalBudget(e.target.value)}
            onBlur={handleBudgetBlur}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="100"
          />
        </div>
      </div>

      {/* Leverage Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Leverage
        </label>
        <select
          value={leverage}
          onChange={(e) => onLeverageChange(parseFloat(e.target.value))}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        >
          {leveragePresets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Price Override (Optional) */}
      {onCustomPriceChange && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Starting Price (Optional)
            </label>
            <button
              onClick={() => handleCustomPriceToggle(!useCustomPrice)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                useCustomPrice
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {useCustomPrice ? 'Custom' : 'Current'}
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input
              type="number"
              value={localCustomPrice}
              onChange={(e) => setLocalCustomPrice(e.target.value)}
              onBlur={handleCustomPriceBlur}
              disabled={!useCustomPrice}
              className={`w-full bg-gray-800 border rounded-lg pl-10 pr-4 py-3 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                useCustomPrice ? 'border-gray-600' : 'border-gray-700 opacity-60 cursor-not-allowed'
              }`}
              min="0"
              step="100"
            />
          </div>
          {useCustomPrice && (
            <p className="text-xs text-gray-400 mt-1">
              Using custom price for projections instead of current market price
            </p>
          )}
        </div>
      )}

      {/* Calculated Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Effective Capital</div>
          <div className="text-xl font-bold text-blue-400">
            ${effectiveCapital.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Liquidation Price</div>
          <div className="text-xl font-bold text-red-400">
            ${liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Warning Message */}
      <div className={`rounded-lg p-4 border ${
        leverage >= 5
          ? 'bg-red-500/10 border-red-500/30 text-red-300'
          : leverage >= 3
          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
          : 'bg-green-500/10 border-green-500/30 text-green-300'
      }`}>
        <p className="text-sm font-medium">{getWarningMessage()}</p>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <span className="text-blue-400">ℹ️</span>
          <p>
            Higher leverage amplifies both profits and losses. The bot will use {leverage}x your budget
            to create grid orders, increasing potential returns but also liquidation risk.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
