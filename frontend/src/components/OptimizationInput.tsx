import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface OptimizationInputProps {
  currentPrice: number;
  onOptimize: (input: OptimizationInputData) => void;
  isLoading?: boolean;
}

export interface OptimizationInputData {
  symbol: string;
  investmentAmount: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  timeHorizon: 7 | 30 | 90 | 180;
  currentPrice: number;
}

const AVAILABLE_SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', free: true },
  { symbol: 'ETHUSDT', name: 'Ethereum', free: false },
  { symbol: 'BNBUSDT', name: 'BNB', free: false },
  { symbol: 'SOLUSDT', name: 'Solana', free: false },
  { symbol: 'ADAUSDT', name: 'Cardano', free: false },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', free: false },
  { symbol: 'MATICUSDT', name: 'Polygon', free: false },
  { symbol: 'DOTUSDT', name: 'Polkadot', free: false },
];

export const OptimizationInput: React.FC<OptimizationInputProps> = ({
  currentPrice,
  onOptimize,
  isLoading = false
}) => {
  const { user } = useAuth();
  const isPremium = user?.tier === 'premium';

  const [symbol, setSymbol] = useState('BTCUSDT');
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [timeHorizon, setTimeHorizon] = useState<7 | 30 | 90 | 180>(90);

  const handleOptimize = () => {
    onOptimize({
      symbol,
      investmentAmount,
      riskTolerance,
      timeHorizon,
      currentPrice
    });
  };

  const handleSymbolChange = (newSymbol: string) => {
    const symbolData = AVAILABLE_SYMBOLS.find(s => s.symbol === newSymbol);
    if (symbolData && !symbolData.free && !isPremium) {
      // Don't allow non-premium users to select premium symbols
      return;
    }
    setSymbol(newSymbol);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">AI GRID OPTIMIZER</h3>
        <div className="text-xs text-gray-400">BETA</div>
      </div>

      {/* Symbol Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          TRADING PAIR {!isPremium && <span className="text-yellow-500">(BTC only - Premium for more)</span>}
        </label>
        <div className="relative">
          <select
            value={symbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            disabled={isLoading}
            className={`
              w-full bg-gray-800 text-white px-4 py-3 rounded-lg 
              border border-gray-700 focus:border-blue-500 focus:outline-none
              text-sm font-medium appearance-none cursor-pointer
              ${isLoading ? 'opacity-50 cursor-wait' : 'hover:bg-gray-750'}
            `}
          >
            {AVAILABLE_SYMBOLS.map((s) => {
              const isLocked = !s.free && !isPremium;
              
              return (
                <option
                  key={s.symbol}
                  value={s.symbol}
                  disabled={isLocked}
                  className="bg-gray-800"
                >
                  {s.name} ({s.symbol}) {isLocked ? '🔒 Premium' : ''}
                </option>
              );
            })}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Investment Amount */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          INVESTMENT AMOUNT
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="100"
            max="50000"
            step="100"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(Number(e.target.value))}
            disabled={isLoading}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex items-center justify-between">
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Math.max(100, Number(e.target.value)))}
              disabled={isLoading}
              className="w-24 bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
            <div className="text-xs text-gray-400">
              $100 - $50,000
            </div>
          </div>
        </div>
      </div>

      {/* Risk Tolerance */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          RISK TOLERANCE
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['conservative', 'moderate', 'aggressive'] as const).map((risk) => (
            <button
              key={risk}
              onClick={() => setRiskTolerance(risk)}
              disabled={isLoading}
              className={`
                p-2 rounded text-xs font-medium transition-all
                ${riskTolerance === risk
                  ? risk === 'conservative' 
                    ? 'bg-green-600 text-white'
                    : risk === 'moderate'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
                ${isLoading ? 'opacity-50 cursor-wait' : ''}
              `}
            >
              {risk.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {riskTolerance === 'conservative' && '1x leverage • Lower risk, lower returns'}
          {riskTolerance === 'moderate' && '2x leverage • Balanced risk/reward'}
          {riskTolerance === 'aggressive' && '3x leverage • Higher risk, higher returns'}
        </div>
      </div>

      {/* Time Horizon */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          TIME HORIZON
        </label>
        <div className="grid grid-cols-4 gap-2">
          {([7, 30, 90, 180] as const).map((days) => (
            <button
              key={days}
              onClick={() => setTimeHorizon(days)}
              disabled={isLoading}
              className={`
                p-2 rounded text-xs font-medium transition-all
                ${timeHorizon === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
                ${isLoading ? 'opacity-50 cursor-wait' : ''}
              `}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Optimize Button */}
      <button
        onClick={handleOptimize}
        disabled={isLoading}
        className={`
          w-full py-3 rounded font-semibold text-sm transition-all
          ${isLoading
            ? 'bg-gray-700 text-gray-400 cursor-wait'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
          }
        `}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>OPTIMIZING...</span>
          </div>
        ) : (
          'OPTIMIZE GRID SETUP'
        )}
      </button>

      {/* Info Text */}
      <div className="text-xs text-gray-500 text-center">
        AI will analyze {symbol} and recommend optimal grid parameters
      </div>
    </div>
  );
};
