import React from 'react';

interface GridLevel {
  price: number;
  status: 'pending' | 'filled' | 'active';
  type: 'buy' | 'sell';
}

interface CompactGridLevelsProps {
  gridLevels: GridLevel[];
  currentPrice: number;
  liquidationPrice: number;
  isMobile?: boolean;
}

const CompactGridLevels: React.FC<CompactGridLevelsProps> = ({
  gridLevels,
  currentPrice,
  liquidationPrice,
  isMobile = false,
}) => {
  // Sort grid levels by price (highest to lowest)
  const sortedLevels = [...gridLevels].sort((a, b) => b.price - a.price);

  // Show fewer levels on mobile
  const displayLevels = isMobile ? sortedLevels.slice(0, 8) : sortedLevels;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800/50 px-2 py-1 border-b border-gray-700 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400">
          {isMobile ? 'GRID' : 'GRID LEVELS'}
        </span>
        <span className="text-[9px] text-gray-500">
          {displayLevels.length}/{gridLevels.length}
        </span>
      </div>

      {/* Grid Levels List */}
      <div className="overflow-y-auto" style={{ maxHeight: isMobile ? '150px' : '300px' }}>
        {displayLevels.map((level, index) => {
          const isAboveCurrent = level.price > currentPrice;
          const isNearCurrent = Math.abs(level.price - currentPrice) / currentPrice < 0.01;
          const isBelowLiquidation = level.price < liquidationPrice;

          return (
            <div
              key={index}
              className={`flex items-center justify-between px-2 py-1 border-b border-gray-800/50 text-[10px] ${
                isNearCurrent ? 'bg-yellow-500/10' :
                isBelowLiquidation ? 'bg-red-500/5' :
                level.status === 'filled' ? 'bg-green-500/5' : ''
              }`}
            >
              {/* Price */}
              <span className={`font-mono ${
                isBelowLiquidation ? 'text-red-400' :
                level.type === 'sell' ? 'text-red-300' : 'text-green-300'
              }`}>
                ${level.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>

              {/* Middle - Status Indicator */}
              <div className="flex items-center gap-1">
                {isBelowLiquidation && (
                  <span className="text-red-500 text-[8px]">⚠️</span>
                )}
                {isNearCurrent && (
                  <span className="text-yellow-400 text-[8px]">→</span>
                )}
                <div className={`w-1 h-1 rounded-full ${
                  level.status === 'filled' ? 'bg-green-500' :
                  level.status === 'active' ? 'bg-blue-500 animate-pulse' :
                  'bg-gray-600'
                }`} />
              </div>

              {/* Type & Status */}
              <span className={`text-[9px] font-semibold ${
                level.type === 'buy' ? 'text-green-400' : 'text-red-400'
              }`}>
                {isMobile ? (level.type === 'buy' ? 'B' : 'S') : level.type.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer - Current Price Indicator */}
      <div className="bg-yellow-500/10 border-t border-yellow-500/30 px-2 py-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-400">Current</span>
          <span className="text-yellow-400 font-semibold font-mono">
            ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Liquidation Warning if visible */}
      {displayLevels.some(l => l.price < liquidationPrice) && (
        <div className="bg-red-500/10 border-t border-red-500/30 px-2 py-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-red-400 text-[9px]">⚠️ Liq. Zone</span>
            <span className="text-red-400 font-semibold font-mono text-[9px]">
              ${liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactGridLevels;
