import React, { useState } from 'react';
import RealGridTradingChart from './RealGridTradingChart';

interface PriceData {
  time: number;
  price: number;
  timestamp: string;
}

interface CompactChartProps {
  symbol: string;
  showGridLines?: boolean;
  onDataLoaded?: (data: PriceData[], currentPrice: number) => void;
  predictedRange?: { lower: number; upper: number };
  optimalEntryZones?: number[];
}

const CompactChart: React.FC<CompactChartProps> = ({
  symbol,
  showGridLines = true,
  onDataLoaded,
  predictedRange,
  optimalEntryZones
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Compact Chart - 300px height */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Price Chart - {symbol.replace('USDT', '/USDT')}</h3>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Expand
          </button>
        </div>
        <div className="h-[300px]">
          <RealGridTradingChart
            symbol={symbol}
            showGridLines={showGridLines}
            onDataLoaded={onDataLoaded}
            predictedRange={predictedRange}
            optimalEntryZones={optimalEntryZones}
          />
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {symbol.replace('USDT', '/USDT')} Chart - Full View
              </h2>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 h-[600px]">
              <RealGridTradingChart
                symbol={symbol}
                showGridLines={showGridLines}
                onDataLoaded={onDataLoaded}
                predictedRange={predictedRange}
                optimalEntryZones={optimalEntryZones}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompactChart;
