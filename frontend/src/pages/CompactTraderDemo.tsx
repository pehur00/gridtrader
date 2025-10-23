import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, ReferenceLine } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import CompactConfigPanel from '../components/CompactConfigPanel';
import CompactProjectionCard from '../components/CompactProjectionCard';
import CompactGridLevels from '../components/CompactGridLevels';
import RealGridTradingChart from '../components/RealGridTradingChart';
import { optimizeGridWithAI, generateAIAnalysis } from '../utils/aiGridOptimizer';

interface PriceData {
  time: number;
  price: number;
  timestamp: string;
}

/**
 * Compact Trader-View Style Main Page
 * Responsive layout with dual charts and collapsible sidebars
 */
const CompactTraderDemo: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<number>(1000);
  const [leverage, setLeverage] = useState<number>(3);
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(true);
  const [showMobileGrid, setShowMobileGrid] = useState<boolean>(false);
  const [showAIInsights, setShowAIInsights] = useState<boolean>(false);
  const [currentPrice, setCurrentPrice] = useState<number>(109823.83);
  const [historicalData, setHistoricalData] = useState<PriceData[]>([]);
  const [aiOptimizedParams, setAiOptimizedParams] = useState<any>(null);
  const [predictedRange, setPredictedRange] = useState<{ lower: number; upper: number } | undefined>();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Debug user object
  React.useEffect(() => {
    if (user) {
      console.log('User object:', user);
      console.log('User email:', user.email);
      console.log('User type:', typeof user);
      console.log('Email type:', typeof user.email);
    }
  }, [user]);

  const priceChange24h = 2.47;
  
  // Handle price data loaded from chart
  const handleDataLoaded = (data: any[], price: number) => {
    setCurrentPrice(price);
  };
  
  // Simulated grid parameters
  const gridLevels = 40;
  const priceRange = { lower: 100000, upper: 134000 };
  const profitPerGrid = 0.78;
  const gridSpacing = (priceRange.upper - priceRange.lower) / gridLevels;

  // Simulated Monte Carlo results
  const expectedProfit = budget * leverage * 0.25;
  const profitProbability = leverage <= 3 ? 72 : leverage <= 5 ? 65 : 55;
  const riskScore = leverage <= 2 ? 3 : leverage <= 3 ? 4.5 : leverage <= 5 ? 6.5 : 8.5;
  
  const effectiveCapital = budget * leverage;
  const liquidationPrice = currentPrice * (1 - (1 / leverage) * 0.9);
  
  // Generate simple 90-day projection data
  const projectionData = useMemo(() => {
    const days = 90;
    const data = [];
    const volatility = 0.02; // 2% daily volatility
    
    for (let day = 0; day <= days; day++) {
      const progress = day / days;
      const median = budget + (expectedProfit * progress);
      const upper = median * (1 + volatility * Math.sqrt(day) * 2);
      const lower = median * (1 - volatility * Math.sqrt(day) * 1.5);
      
      data.push({
        day,
        median: Math.round(median),
        upper: Math.round(upper),
        lower: Math.round(lower),
      });
    }
    
    return data;
  }, [budget, expectedProfit]);

  // Generate grid levels
  const gridLevelsData = Array.from({ length: gridLevels }, (_, i) => {
    const price = priceRange.lower + (i * gridSpacing);
    const isAboveCurrent = price > currentPrice;
    const distanceFromCurrent = Math.abs(price - currentPrice);
    
    // Simulate some filled orders
    const isFilled = distanceFromCurrent < gridSpacing * 5 && Math.random() > 0.5;
    
    return {
      price: Math.round(price),
      status: isFilled ? 'filled' as const : 'pending' as const,
      type: isAboveCurrent ? 'sell' as const : 'buy' as const,
    };
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Compact Top Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-3 py-1.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-yellow-400 font-bold text-xs md:text-sm">GridTrader</span>
            <div className="flex items-center gap-1 md:gap-2">
              <span className="text-white font-semibold text-xs md:text-sm">BTC/USDT</span>
              <span className="text-green-400 text-[10px] md:text-xs">PERP</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs">
            {/* Mobile: Sidebar Toggles */}
            <button 
              onClick={() => setShowMobileGrid(!showMobileGrid)}
              className="md:hidden bg-gray-800 px-2 py-1 rounded text-[10px] border border-gray-700"
            >
              📋
            </button>
            <button 
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="md:hidden bg-gray-800 px-2 py-1 rounded text-[10px] border border-gray-700"
            >
              ⚙️
            </button>
            <button 
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="md:hidden bg-gray-800 px-2 py-1 rounded text-[10px] border border-gray-700"
            >
              📊
            </button>
            
            {/* Desktop: Price Info */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-gray-400">Price</span>
              <span className="text-white font-semibold">${currentPrice.toLocaleString()}</span>
              <span className="text-green-400 font-semibold">+{priceChange24h}%</span>
            </div>
            
            {/* Login/User Menu */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[10px] md:text-xs hidden md:inline">
                  {String(user?.email || 'User')}
                </span>
                {user.tier === 'premium' && (
                  <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded text-[8px] font-semibold">
                    PRO
                  </span>
                )}
                <button 
                  onClick={handleLogout}
                  className="bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-[10px] md:text-xs border border-gray-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 px-2 md:px-3 py-1 rounded text-[10px] md:text-xs border border-blue-500"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Flex */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Mobile Grid Popup Overlay */}
        {showMobileGrid && (
          <div className="md:hidden fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">Grid Levels</span>
                <button 
                  onClick={() => setShowMobileGrid(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <CompactGridLevels
                gridLevels={gridLevelsData}
                currentPrice={currentPrice}
                liquidationPrice={liquidationPrice}
                isMobile={true}
              />
            </div>
          </div>
        )}

        {/* Left Sidebar - Collapsible on Mobile */}
        {showLeftSidebar && (
          <div className="w-full md:w-52 bg-gray-900 border-b md:border-r md:border-b-0 border-gray-800 p-2 space-y-2 overflow-y-auto max-h-[40vh] md:max-h-none">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold text-gray-400">CONFIGURATION</div>
              <button 
                onClick={() => setShowLeftSidebar(false)}
                className="md:hidden text-gray-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            
            <CompactConfigPanel
              budget={budget}
              leverage={leverage}
              currentPrice={currentPrice}
              onBudgetChange={setBudget}
              onLeverageChange={setLeverage}
            />

            <div className="text-[10px] font-semibold text-gray-400 mt-4 mb-2">GRID PARAMETERS</div>
            <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Range</span>
                <span className="text-white font-mono text-[11px]">${(priceRange.lower/1000).toFixed(0)}K - ${(priceRange.upper/1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Levels</span>
                <span className="text-white font-semibold">{gridLevels}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Spacing</span>
                <span className="text-white font-mono text-[11px]">${gridSpacing.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Profit/Grid</span>
                <span className="text-green-400 font-semibold">{profitPerGrid}%</span>
              </div>
            </div>

            <div className="text-[10px] font-semibold text-gray-400 mt-4 mb-2">MARKET INFO</div>
            <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Regime</span>
                <span className="text-green-400 font-semibold text-[11px]">RANGING</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Volatility</span>
                <span className="text-yellow-400 font-semibold text-[11px]">3.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trend</span>
                <span className="text-blue-400 font-semibold text-[11px]">NEUTRAL</span>
              </div>
            </div>

            {/* Desktop: Grid Levels */}
            <div className="hidden md:block mt-4">
              <div className="text-[10px] font-semibold text-gray-400 mb-2">GRID LEVELS</div>
              <CompactGridLevels
                gridLevels={gridLevelsData}
                currentPrice={currentPrice}
                liquidationPrice={liquidationPrice}
                isMobile={false}
              />
            </div>
          </div>
        )}

        {/* Center - Dual Chart Area */}
        <div className="flex-1 bg-black p-1 md:p-2 overflow-y-auto">
          <div className="space-y-1 md:space-y-2">
            {/* Price Chart with Grid */}
            <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden h-[300px] md:h-[calc(50vh-60px)]">
              <div className="bg-gray-900 border-b border-gray-800 px-2 md:px-3 py-1 md:py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs">
                  <span className="text-gray-400">PRICE CHART</span>
                  <span className="text-white font-semibold">${currentPrice.toLocaleString()}</span>
                  <span className={`text-[10px] ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange24h >= 0 ? '+' : ''}{priceChange24h}%
                  </span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs">
                  <button className="px-1.5 md:px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300">1D</button>
                  <button className="px-1.5 md:px-2 py-0.5 bg-blue-600 rounded text-white">Grid</button>
                </div>
              </div>
              
              {/* Real Price Chart with Grid Lines */}
              <div className="h-[calc(100%-29px)] md:h-[calc(100%-33px)]">
                <RealGridTradingChart
                  symbol="BTCUSDT"
                  showGridLines={true}
                  onDataLoaded={handleDataLoaded}
                  predictedRange={predictedRange}
                />
              </div>
            </div>

            {/* 90-Day Projection Chart - Premium Feature (Always visible, blurred for non-premium) */}
            <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden h-[300px] md:h-[calc(50vh-60px)] relative">
              <div className="bg-gray-900 border-b border-gray-800 px-2 md:px-3 py-1 md:py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] md:text-xs">
                  <span className="text-gray-400">90-DAY PROJECTION</span>
                  <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-semibold">
                    PREMIUM
                  </span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs">
                  <span className="text-green-400 font-semibold">+${(expectedProfit/1000).toFixed(1)}K</span>
                  <span className="text-gray-500 text-[10px]">({profitProbability}%)</span>
                </div>
              </div>
              
              {/* Projection Chart with Recharts */}
              <div className={`h-[calc(100%-29px)] md:h-[calc(100%-33px)] bg-gradient-to-b from-gray-900 to-black ${!user || user.tier !== 'premium' ? 'blur-sm' : ''}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="day" 
                      stroke="#6b7280" 
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                      label={{ value: 'Days', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151', 
                        borderRadius: '0.5rem',
                        fontSize: '11px'
                      }}
                      labelStyle={{ color: '#9ca3af' }}
                      formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
                      labelFormatter={(day) => `Day ${day}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="upper" 
                      stroke="none" 
                      fill="url(#projectionGradient)" 
                      fillOpacity={0.4}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lower" 
                      stroke="none" 
                      fill="#000000" 
                      fillOpacity={0.6}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="median" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      dot={false}
                    />
                    <ReferenceLine 
                      y={budget} 
                      stroke="#fbbf24" 
                      strokeDasharray="3 3" 
                      label={{ 
                        value: 'Initial', 
                        position: 'right', 
                        fill: '#fbbf24', 
                        fontSize: 9 
                      }} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Premium Overlay for Non-Premium Users */}
              {(!user || user.tier !== 'premium') && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
                  <div className="text-center px-4 pointer-events-auto">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-2">Premium Feature</h3>
                    <p className="text-[10px] md:text-sm text-gray-300 mb-3 md:mb-4 max-w-xs">
                      Upgrade to Premium to unlock 90-day profit projections with Monte Carlo simulations
                    </p>
                    {user ? (
                      <Link
                        to="/register"
                        className="inline-flex items-center gap-1 md:gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-3 md:px-4 py-1.5 md:py-2 rounded text-[10px] md:text-sm font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all"
                      >
                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Upgrade to Premium
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-1 md:gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-3 md:px-4 py-1.5 md:py-2 rounded text-[10px] md:text-sm font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all"
                      >
                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Login to Unlock
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

```

        {/* Right Sidebar - Collapsible on Mobile */}
        {showRightSidebar && (
          <div className="w-full md:w-64 bg-gray-900 border-t md:border-l md:border-t-0 border-gray-800 p-2 space-y-2 overflow-y-auto max-h-[40vh] md:max-h-none">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold text-gray-400">STATS</div>
              <button 
                onClick={() => setShowRightSidebar(false)}
                className="md:hidden text-gray-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            
            <CompactProjectionCard
              expectedProfit={expectedProfit}
              investmentAmount={budget}
              leverage={leverage}
              profitProbability={profitProbability}
              riskScore={riskScore}
              projectionDays={90}
            />

            <div className="text-[10px] font-semibold text-gray-400 mt-4 mb-2">POSITION</div>
            <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Budget</span>
                <span className="text-white font-semibold text-[11px]">${budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Leverage</span>
                <span className="text-blue-400 font-semibold">{leverage}x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Capital</span>
                <span className="text-white font-semibold text-[11px]">${effectiveCapital.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-800 my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Entry</span>
                <span className="text-white font-mono text-[10px]">${(currentPrice/1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Liq.</span>
                <span className="text-red-400 font-mono text-[10px]">${(liquidationPrice/1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Dist.</span>
                <span className={`font-semibold text-[11px] ${
                  ((currentPrice - liquidationPrice) / currentPrice) > 0.1 ? 'text-green-400' : 
                  ((currentPrice - liquidationPrice) / currentPrice) > 0.05 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  -{(((currentPrice - liquidationPrice) / currentPrice) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-[10px] font-semibold text-gray-400 mt-4 mb-2">PERFORMANCE</div>
            <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Fills/90d</span>
                <span className="text-white font-semibold text-[11px]">~2,535</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trade Time</span>
                <span className="text-white font-semibold text-[11px]">36h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Win Rate</span>
                <span className="text-green-400 font-semibold text-[11px]">~65%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sharpe</span>
                <span className="text-blue-400 font-semibold text-[11px]">2.1</span>
              </div>
            </div>

            <div className="text-[10px] font-semibold text-gray-400 mt-4 mb-2">ACTIONS</div>
            <div className="space-y-1">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-semibold">
                Deploy Grid Bot
              </button>
              <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-1.5 rounded text-xs border border-gray-700">
                Compare Scenarios
              </button>
            </div>

            {/* Risk Warning */}
            {leverage >= 5 && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded p-2">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-xs">⚠️</span>
                  <div className="text-[10px] text-red-300">
                    <div className="font-semibold mb-0.5">High Risk</div>
                    <div className="text-red-400/80">
                      {leverage}x leverage = high liquidation risk
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactTraderDemo;
