import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Brush } from 'recharts';
import { useMarketData } from '../hooks/useMarketData';

interface PriceData {
  time: number;
  price: number;
  timestamp: string;
}

interface GridLevel {
  price: number;
  type: 'buy' | 'sell';
  status: 'filled' | 'active' | 'pending';
  capitalRequired?: number;
}

interface RealGridTradingChartProps {
  symbol?: string;
  showGridLines?: boolean;
  onDataLoaded?: (data: PriceData[], currentPrice: number) => void;
  predictedRange?: { lower: number; upper: number };
  optimalEntryZones?: number[];
  // New props for grid overlay
  gridLevels?: GridLevel[];
  highlightGridZones?: boolean;
  currentPriceMarker?: number;
  showCapitalAllocation?: boolean;
}

const RealGridTradingChart: React.FC<RealGridTradingChartProps> = ({ 
  symbol = 'BTCUSDT', 
  showGridLines = true, 
  onDataLoaded, 
  predictedRange,
  gridLevels,
  highlightGridZones = false,
  currentPriceMarker,
  showCapitalAllocation = false
}) => {
  const { currentPrice, historicalData, loading } = useMarketData(symbol);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [calculatedGridLevels, setCalculatedGridLevels] = useState<GridLevel[]>([]);

  // Use provided gridLevels or fall back to calculated ones
  const displayGridLevels = gridLevels || calculatedGridLevels;
  
  // Use provided currentPriceMarker or fall back to live currentPrice
  const displayCurrentPrice = currentPriceMarker || currentPrice;

  // Calculate grid levels based on predicted range or historical range
  const calculateGridLevels = useCallback((prices: number[], predRange?: { lower: number; upper: number }) => {
    if (prices.length === 0) return [];

    const currentPrice = prices[prices.length - 1];

    // Use predicted range if available, otherwise use historical range
    let upperBound: number;
    let lowerBound: number;
    
    if (predRange) {
      upperBound = predRange.upper;
      lowerBound = predRange.lower;
    } else {
      const highPrice = Math.max(...prices);
      const lowPrice = Math.min(...prices);
      const bufferPct = 0.15;
      upperBound = highPrice * (1 + bufferPct);
      lowerBound = lowPrice * (1 - bufferPct);
    }

    const gridCount = 40; // 40 grid levels for good granularity
    const gridSpacing = (upperBound - lowerBound) / gridCount;

    const levels: GridLevel[] = [];
    for (let i = 0; i <= gridCount; i++) {
      const price = lowerBound + (i * gridSpacing);
      const isAboveCurrent = price > currentPrice;
      const distanceFromCurrent = Math.abs(price - currentPrice);
      const distancePct = distanceFromCurrent / currentPrice;
      
      // Determine status based on proximity to current price
      let status: 'filled' | 'active' | 'pending';
      if (distancePct < 0.02) { // Within 2% = filled
        status = 'filled';
      } else if (distancePct < 0.05) { // Within 5% = active
        status = 'active';
      } else {
        status = 'pending';
      }
      
      levels.push({ 
        price: Math.round(price), 
        type: isAboveCurrent ? 'sell' : 'buy',
        status 
      });
    }

    return levels;
  }, []);

  // Process historical data from centralized service
  useEffect(() => {
    if (!historicalData || historicalData.length === 0) {
      return;
    }

    // Data is already in the correct format from backend (time, price, timestamp)
    setPriceData(historicalData);

    // Calculate grid levels using predicted range if available (only if not provided via props)
    if (!gridLevels) {
      const prices = historicalData.map(d => d.price);
      const levels = calculateGridLevels(prices, predictedRange);
      setCalculatedGridLevels(levels);
    }

    // Get latest price from historical data if currentPrice not yet set
    const latestPrice = currentPrice > 0 ? currentPrice : historicalData[historicalData.length - 1]?.price || 0;

    // Notify parent component with data for optimization
    if (onDataLoaded && latestPrice > 0) {
      onDataLoaded(historicalData, latestPrice);
    }
  }, [historicalData, currentPrice, calculateGridLevels, onDataLoaded, predictedRange]);

  // Real-time price updates are now handled by useMarketData hook

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 border border-gray-700 rounded-lg px-3 py-2">
          <p className="text-white text-sm font-semibold">${payload[0].value.toLocaleString()}</p>
          <p className="text-gray-400 text-xs">{payload[0].payload.timestamp}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading real market data...</p>
        </div>
      </div>
    );
  }

  if (priceData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  // Calculate dynamic Y-axis domain based on grid levels for better view
  const prices = priceData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const yAxisMin = Math.floor(minPrice - priceRange * 0.1);
  const yAxisMax = Math.ceil(maxPrice + priceRange * 0.1);

  // Separate buy and sell grid levels
  const buyLevels = displayGridLevels.filter(level => level.type === 'buy');
  const sellLevels = displayGridLevels.filter(level => level.type === 'sell');

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={priceData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          {/* NO CartesianGrid - removed to avoid confusion */}
          
          <XAxis
            dataKey="timestamp"
            stroke="#6B7280"
            style={{ fontSize: '10px' }}
            interval="preserveStartEnd"
            tickCount={6}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '10px' }}
            domain={[yAxisMin, yAxisMax]}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Optimized Grid Levels - when provided via props (from optimizer) */}
          {gridLevels && gridLevels.map((level, idx) => (
            <ReferenceLine
              key={`optimized-${idx}`}
              y={level.price}
              stroke={level.type === 'buy' ? '#10B981' : '#EF4444'}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              opacity={0.7}
              label={highlightGridZones && idx % 5 === 0 ? {
                value: `${level.type.toUpperCase()} $${level.price.toLocaleString()}`,
                position: 'right',
                fill: level.type === 'buy' ? '#10B981' : '#EF4444',
                fontSize: 9,
                opacity: 0.8
              } : undefined}
            />
          ))}

          {/* Auto-calculated Grid Levels - for demo mode */}
          {!gridLevels && showGridLines && buyLevels.map((level, idx) => (
            <ReferenceLine
              key={`buy-${idx}`}
              y={level.price}
              stroke={level.status === 'filled' ? '#10B981' : level.status === 'active' ? '#22C55E' : '#16A34A'}
              strokeDasharray={level.status === 'filled' ? '0' : '3 3'}
              strokeWidth={level.status === 'filled' ? 2 : 1}
              opacity={level.status === 'filled' ? 0.8 : level.status === 'active' ? 0.5 : 0.3}
            />
          ))}

          {/* SELL Grid Levels - RED lines above current price */}
          {showGridLines && sellLevels.map((level, idx) => (
            <ReferenceLine
              key={`sell-${idx}`}
              y={level.price}
              stroke={level.status === 'filled' ? '#EF4444' : level.status === 'active' ? '#F87171' : '#DC2626'}
              strokeDasharray={level.status === 'filled' ? '0' : '3 3'}
              strokeWidth={level.status === 'filled' ? 2 : 1}
              opacity={level.status === 'filled' ? 0.8 : level.status === 'active' ? 0.5 : 0.3}
            />
          ))}

          {/* Current price line - ORANGE - Enhanced visibility */}
          <ReferenceLine
            y={displayCurrentPrice}
            stroke="#F59E0B"
            strokeWidth={4}
            strokeDasharray="3 3"
            label={{
              value: `CURRENT PRICE: $${displayCurrentPrice.toLocaleString()}`,
              position: 'insideTopRight',
              fill: '#F59E0B',
              fontSize: 12,
              fontWeight: 'bold',
              offset: 10
            }}
          />
          
          {/* Current price highlight box */}
          <ReferenceLine
            y={displayCurrentPrice}
            stroke="#F59E0B"
            strokeWidth={8}
            strokeOpacity={0.2}
          />

          {/* Price line - BLUE */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3B82F6' }}
            isAnimationActive={false}
          />

          {/* Brush for zooming/panning */}
          <Brush 
            dataKey="timestamp" 
            height={20} 
            stroke="#6B7280"
            fill="#1F2937"
            travellerWidth={10}
            startIndex={Math.max(0, priceData.length - 100)}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RealGridTradingChart;
