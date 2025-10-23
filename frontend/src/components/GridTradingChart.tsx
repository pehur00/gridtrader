import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Sample BTC/USDT price data (realistic price movements)
const generatePriceData = () => {
  const basePrice = 98000;
  const data = [];
  let price = basePrice;

  for (let i = 0; i < 50; i++) {
    // Simulate price volatility
    const change = (Math.random() - 0.5) * 2000;
    price = Math.max(95000, Math.min(102000, price + change));

    data.push({
      time: i,
      price: Math.round(price),
      timestamp: new Date(Date.now() - (50 - i) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  return data;
};

// AI-optimized grid levels for BTC/USDT
const gridLevels = [
  { price: 102000, status: 'pending' },
  { price: 100800, status: 'filled' },
  { price: 99600, status: 'filled' },
  { price: 98400, status: 'filled' },
  { price: 97200, status: 'filled' },
  { price: 96000, status: 'pending' },
];

interface GridTradingChartProps {
  showGridLines?: boolean;
}

const GridTradingChart: React.FC<GridTradingChartProps> = ({ showGridLines = true }) => {
  const priceData = React.useMemo(() => generatePriceData(), []);
  const currentPrice = priceData[priceData.length - 1].price;

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
            tickCount={5}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '10px' }}
            domain={[95000, 102000]}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Grid level lines */}
          {showGridLines && gridLevels.map((level, idx) => (
            <ReferenceLine
              key={idx}
              y={level.price}
              stroke={level.status === 'filled' ? '#10B981' : '#6B7280'}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              opacity={0.6}
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
              fontSize: 12,
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
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GridTradingChart;
