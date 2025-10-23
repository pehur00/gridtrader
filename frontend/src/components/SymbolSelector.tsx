import React from 'react';

interface SymbolSelectorProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  isPremium: boolean;
}

const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT', free: true },
  { value: 'ETHUSDT', label: 'ETH/USDT', free: false },
  { value: 'SOLUSDT', label: 'SOL/USDT', free: false },
  { value: 'BNBUSDT', label: 'BNB/USDT', free: false },
  { value: 'ADAUSDT', label: 'ADA/USDT', free: false },
  { value: 'DOGEUSDT', label: 'DOGE/USDT', free: false }
];

const SymbolSelector: React.FC<SymbolSelectorProps> = ({ selectedSymbol, onSymbolChange, isPremium }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const symbol = SYMBOLS.find(s => s.value === e.target.value);
    if (symbol && (symbol.free || isPremium)) {
      onSymbolChange(e.target.value);
    }
  };

  return (
    <div className="relative">
      <select
        value={selectedSymbol}
        onChange={handleChange}
        className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer appearance-none"
      >
        {SYMBOLS.map(symbol => (
          <option
            key={symbol.value}
            value={symbol.value}
            disabled={!symbol.free && !isPremium}
            className={!symbol.free && !isPremium ? 'text-gray-500' : ''}
          >
            {symbol.label} {!symbol.free && '👑'}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default SymbolSelector;
