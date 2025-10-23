import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PriceData {
  time: number;
  price: number;
  timestamp: string;
}

interface GridLevel {
  price: number;
  status: 'filled' | 'pending';
}

interface RealGridTradingChartProps {
  showGridLines?: boolean;
  onDataLoaded?: (data: PriceData[], currentPrice: number) => void;
}

const RealGridTradingChart: React.FC<RealGridTradingChartProps> = ({ showGridLines = true, onDataLoaded }) => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [gridLevels, setGridLevels] = useState<GridLevel[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate grid levels based on full 90-day historical range
  const calculateGridLevels = useCallback((prices: number[]) => {
    if (prices.length === 0) return [];

    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);
    const currentPrice = prices[prices.length - 1];

    // Use the full historical range with 3% buffer above/below
    const bufferPct = 0.03;
    const upperBound = highPrice * (1 + bufferPct);
    const lowerBound = lowPrice * (1 - bufferPct);

    const gridCount = 50;
    const gridSpacing = (upperBound - lowerBound) / gridCount;

    const levels: GridLevel[] = [];
    for (let i = 0; i <= gridCount; i++) {
      const price = lowerBound + (i * gridSpacing);
      // Mark as filled if price is within ±0.5% of current price
      const status = Math.abs(price - currentPrice) / currentPrice < 0.005 ? 'filled' : 'pending';
      levels.push({ price: Math.round(price), status });
    }

    return levels;
  }, []);

  // Fetch historical kline data from Binance (last 90 days, daily candles)
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);

        // Fetch 90 days of daily candles
        const endTime = Date.now();
        const startTime = endTime - (90 * 24 * 60 * 60 * 1000); // 90 days ago

        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=90`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch data from Binance');
        }

        const data = await response.json();

        // Transform Binance kline data to our format
        const transformedData: PriceData[] = data.map((candle: any[], index: number) => {
          const [timestamp, open, high, low, close] = candle;
          return {
            time: index,
            price: parseFloat(close),
            timestamp: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          };
        });

        setPriceData(transformedData);

        if (transformedData.length > 0) {
          const latestPrice = transformedData[transformedData.length - 1].price;
          setCurrentPrice(latestPrice);

          // Calculate grid levels
          const prices = transformedData.map(d => d.price);
          const levels = calculateGridLevels(prices);
          setGridLevels(levels);

          // Notify parent component with data for optimization
          if (onDataLoaded) {
            onDataLoaded(transformedData, latestPrice);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching historical data:', error);
        setLoading(false);
      }
    };

    fetchHistoricalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Set up WebSocket for real-time price updates (throttled to reduce re-renders)
  useEffect(() => {
    if (priceData.length === 0) return;

    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
    let lastUpdateTime = 0;
    let latestPrice = 0;

    ws.onmessage = (event) => {
      const trade = JSON.parse(event.data);
      latestPrice = parseFloat(trade.p);

      const now = Date.now();
      // Only update UI every 2 seconds to reduce chart re-renders
      if (now - lastUpdateTime > 2000) {
        setCurrentPrice(latestPrice);
        lastUpdateTime = now;
      }
    };

    // Update with the latest price every 2 seconds
    const intervalId = setInterval(() => {
      if (latestPrice > 0) {
        setCurrentPrice(latestPrice);
      }
    }, 2000);

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
      clearInterval(intervalId);
    };
  }, [priceData.length]);

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

  // Calculate dynamic Y-axis domain based on price data
  const prices = priceData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const yAxisMin = Math.floor(minPrice - priceRange * 0.05);
  const yAxisMax = Math.ceil(maxPrice + priceRange * 0.05);

  // Show only a subset of grid levels for clarity (every 5th level)
  const visibleGridLevels = gridLevels.filter((_, idx) => idx % 5 === 0);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={priceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
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

          {/* Grid level lines - show subset for clarity */}
          {showGridLines && visibleGridLevels.map((level, idx) => (
            <ReferenceLine
              key={idx}
              y={level.price}
              stroke={level.status === 'filled' ? '#10B981' : '#6B7280'}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              opacity={0.5}
            />
          ))}

          {/* Current price line */}
          <ReferenceLine
            y={currentPrice}
            stroke="#F59E0B"
            strokeWidth={2}
            label={{
              value: `$${currentPrice.toLocaleString()}`,
              position: 'right',
              fill: '#F59E0B',
              fontSize: 11,
              fontWeight: 'bold'
            }}
          />

          {/* Price line */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3B82F6' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RealGridTradingChart;
