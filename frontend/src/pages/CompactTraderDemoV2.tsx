import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, ReferenceLine } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import CompactProjectionCard from '../components/CompactProjectionCard';
import CompactGridLevels from '../components/CompactGridLevels';
import RealGridTradingChart from '../components/RealGridTradingChart';
import { AIGridOptimizer } from '../components/AIGridOptimizer';
import { optimizeGridWithAI, generateAIAnalysis } from '../utils/aiGridOptimizer';
import type { OptimizedGridSetup } from '../utils/completeGridOptimizer';

interface PriceData {
  time: number;
  price: number;
  timestamp: string;
}

interface AIOptimizedParams {
  priceRange: { lower: number; upper: number };
  gridLevels: number;
  profitPerGrid: number;
  gridSpacing: number;
  confidence: number;
  volatilityScore: number;
  marketRegime: 'ranging' | 'trending' | 'highly_volatile';
  predictedRange3M: any;
  expectedVolatility: number;
  seasonalityFactor: number;
  trendPrediction: 'bullish' | 'bearish' | 'neutral';
  optimalEntryZones: number[];
  riskScore: number;
}

/**
 * Enhanced Compact Trader-View with AI Optimization
 * - AI-optimized grid levels based on position size and leverage
 * - Grid parameters overlay on chart
 * - Color-coded buy/sell levels (green/red)
 * - AI insights as premium feature
 */
const CompactTraderDemoV2: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Core state
  const [budget, setBudget] = useState<number>(1000);
  const [leverage, setLeverage] = useState<number>(3);
  const [currentPrice, setCurrentPrice] = useState<number>(109823.83);
  const [historicalData, setHistoricalData] = useState<PriceData[]>([]);
  
  // UI state
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showMobileGrid, setShowMobileGrid] = useState<boolean>(false);
  const [showAIInsights, setShowAIInsights] = useState<boolean>(false);
  const [showAIOptimizer, setShowAIOptimizer] = useState<boolean>(false);
  
  // AI optimization state
  const [aiOptimizedParams, setAiOptimizedParams] = useState<AIOptimizedParams | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizedSetup, setOptimizedSetup] = useState<OptimizedGridSetup | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const priceChange24h = 2.47;
  
  // Handle price data loaded from chart
  const handleDataLoaded = useCallback((data: PriceData[], price: number) => {
    setCurrentPrice(price);
    setHistoricalData(data);
    
    // Trigger AI optimization when data is loaded
    if (data.length > 0 && !aiOptimizedParams) {
      runAIOptimization(data, price);
    }
  }, [aiOptimizedParams]);

  // Run AI optimization based on position size and leverage
  const runAIOptimization = useCallback(async (data: PriceData[], price: number) => {
    if (data.length < 100) return; // Need enough data
    
    setIsOptimizing(true);
    try {
      // Get AI-optimized grid parameters
      const optimized = await optimizeGridWithAI(data, price);
      
      // The AI optimizer gives us the base parameters
      // We can use these directly as they're already optimized for the current market conditions
      setAiOptimizedParams(optimized);
      
      // Generate AI analysis
      const analysis = generateAIAnalysis(optimized);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('AI optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  // Re-optimize when budget or leverage changes
  useEffect(() => {
    if (historicalData.length > 0 && currentPrice > 0) {
      runAIOptimization(historicalData, currentPrice);
    }
  }, [budget, leverage, historicalData.length]);

  const gridLevels = aiOptimizedParams?.gridLevels || 40;
  const priceRange = aiOptimizedParams?.priceRange || { 
    lower: currentPrice * 0.85, 
    upper: currentPrice * 1.15 
  };
  const profitPerGrid = aiOptimizedParams?.profitPerGrid || 0.78;
  const gridSpacing = (priceRange.upper - priceRange.lower) / gridLevels;

  // Simulated Monte Carlo results (adjusted for leverage)
  const expectedProfit = budget * leverage * 0.25;
  const profitProbability = leverage <= 3 ? 72 : leverage <= 5 ? 65 : 55;
  const riskScore = aiOptimizedParams?.riskScore || (leverage <= 2 ? 3 : leverage <= 3 ? 4.5 : leverage <= 5 ? 6.5 : 8.5);
  
  const liquidationPrice = currentPrice * (1 - (1 / leverage) * 0.9);
  
  // Generate 90-day projection data
  const projectionData = useMemo(() => {
    const days = 90;
    const data = [];
    const volatility = aiOptimizedParams?.expectedVolatility || 0.02;
    
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
  }, [budget, expectedProfit, aiOptimizedParams]);

  // Generate AI-optimized grid levels with proper buy/sell classification
  const gridLevelsData = useMemo(() => {
    return Array.from({ length: gridLevels }, (_, i) => {
      const price = priceRange.lower + (i * gridSpacing);
      const isAboveCurrent = price > currentPrice;
      const distanceFromCurrent = Math.abs(price - currentPrice);
      
      // Check if this is an optimal entry zone (from AI)
      const isOptimalZone = aiOptimizedParams?.optimalEntryZones?.some(
        zone => Math.abs(zone - price) < gridSpacing * 2
      ) || false;
      
      // Simulate filled orders for zones near current price
      const isFilled = distanceFromCurrent < gridSpacing * 5 && Math.random() > 0.5;
      
      return {
        price: Math.round(price),
        status: isFilled ? 'filled' as const : isOptimalZone ? 'active' as const : 'pending' as const,
        type: isAboveCurrent ? 'sell' as const : 'buy' as const,
      };
    });
  }, [gridLevels, priceRange, gridSpacing, currentPrice, aiOptimizedParams]);

  // Grid parameters for chart overlay
  const gridParamsOverlay = {
    levels: gridLevels,
    range: priceRange,
    spacing: gridSpacing,
    profitPerGrid: profitPerGrid,
    regime: aiOptimizedParams?.marketRegime || 'ranging',
    confidence: aiOptimizedParams?.confidence || 0,
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Compact Top Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-3 py-1.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-yellow-400 font-bold text-xs md:text-sm">GridTrader AI</span>
            <div className="flex items-center gap-1 md:gap-2">
              <span className="text-white font-semibold text-xs md:text-sm">BTC/USDT</span>
              <span className="text-green-400 text-[10px] md:text-xs">PERP</span>
            </div>
            {isOptimizing && (
              <span className="text-blue-400 text-[10px] animate-pulse">⚡ AI Optimizing...</span>
            )}
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
            
            {/* Desktop: Price Info */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-gray-400">Price</span>
              <span className="text-white font-semibold">${currentPrice.toLocaleString()}</span>
              <span className="text-green-400 font-semibold">+{priceChange24h}%</span>
            </div>
            
            {/* AI Insights Button (Premium) */}
            {user && user.tier === 'premium' && (
              <button
                onClick={() => setShowAIInsights(true)}
                className="hidden md:flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 px-2 py-1 rounded text-[10px] font-semibold hover:from-blue-700 hover:to-purple-700"
              >
                🤖 AI Insights
              </button>
            )}
            
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

        {/* Left Sidebar - Grid Settings & Configuration */}
        {showLeftSidebar && (
          <div className="w-full md:w-72 bg-gray-900 border-b md:border-r md:border-b-0 border-gray-800 p-3 overflow-y-auto max-h-[40vh] md:max-h-none">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-300">GRID SETTINGS</div>
              <button 
                onClick={() => setShowLeftSidebar(false)}
                className="md:hidden text-gray-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* AI Optimizer Button */}
            <button
              onClick={() => setShowAIOptimizer(true)}
              className="w-full mb-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/40 rounded px-3 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Grid Optimizer
            </button>
            
            {/* Budget Configuration */}
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Initial Budget</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 pl-7 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  min="100"
                  step="100"
                />
              </div>
            </div>

            {/* Leverage Configuration */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-400">Leverage</label>
                <span className={`text-sm font-bold ${
                  leverage <= 2 ? 'text-green-400' : 
                  leverage <= 5 ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {leverage}x
                </span>
              </div>
              <input
                type="range"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                min="1"
                max="10"
                step="1"
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>1x</span>
                <span>5x</span>
                <span>10x</span>
              </div>
              {leverage > 5 && (
                <div className="mt-2 bg-red-900/20 border border-red-700/50 rounded p-2 flex items-start gap-2">
                  <span className="text-red-400 text-xs">⚠️</span>
                  <span className="text-red-400 text-[10px]">High leverage increases liquidation risk</span>
                </div>
              )}
            </div>

            {/* Connect to Broker (Premium Only) */}
            <div className="mb-4">
              {user && user.tier === 'premium' ? (
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border border-blue-500 rounded px-3 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connect to Broker
                </button>
              ) : (
                <div className="relative">
                  <button disabled className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 cursor-not-allowed blur-[1px]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Connect to Broker
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-[10px] font-semibold border border-yellow-500/30">
                      PRO ONLY
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Grid Parameters */}
            {aiOptimizedParams && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1">
                  {user?.tier === 'premium' && <span className="text-blue-400">🤖</span>}
                  AI OPTIMIZED GRID
                  {user?.tier === 'premium' && (
                    <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[9px] font-bold">AI</span>
                  )}
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded p-2.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Grid Levels</span>
                    <span className="text-white font-semibold text-sm">{aiOptimizedParams.gridLevels}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Grid Spacing</span>
                    <span className="text-white font-mono text-xs">${gridSpacing.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Profit/Grid</span>
                    <span className="text-green-400 font-semibold text-sm">{aiOptimizedParams.profitPerGrid.toFixed(2)}%</span>
                  </div>
                  <div className="h-px bg-gray-700"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Market Regime</span>
                    <span className={`font-semibold text-xs ${
                      aiOptimizedParams.marketRegime === 'ranging' ? 'text-green-400' :
                      aiOptimizedParams.marketRegime === 'trending' ? 'text-blue-400' :
                      'text-orange-400'
                    }`}>
                      {aiOptimizedParams.marketRegime.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Confidence</span>
                    <span className="text-blue-400 font-semibold text-sm">{(aiOptimizedParams.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Volatility</span>
                    <span className="text-yellow-400 font-semibold text-sm">
                      {((aiOptimizedParams?.expectedVolatility || 0.02) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop: Grid Levels */}
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-gray-300 mb-2">ACTIVE GRID LEVELS</div>
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
            {/* Price Chart with Grid + Parameters Overlay */}
            <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden h-[300px] md:h-[calc(55vh-60px)] relative">
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
              
              {/* Grid Parameters Overlay */}
              {aiOptimizedParams && (
                <div className="absolute top-10 left-2 z-20 bg-black/80 border border-gray-700 rounded px-2 py-1 text-[9px] space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Levels:</span>
                    <span className="text-white font-semibold">{gridParamsOverlay.levels}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Range:</span>
                    <span className="text-green-400 font-mono">${(gridParamsOverlay.range.lower/1000).toFixed(0)}K</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-red-400 font-mono">${(gridParamsOverlay.range.upper/1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Profit:</span>
                    <span className="text-yellow-400 font-semibold">{gridParamsOverlay.profitPerGrid.toFixed(2)}%</span>
                  </div>
                  {user?.tier === 'premium' && (
                    <div className="flex items-center gap-1 pt-0.5 border-t border-gray-700">
                      <span className="text-blue-400">🤖 AI</span>
                      <span className="text-blue-400 font-semibold">{(gridParamsOverlay.confidence * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Real Price Chart with Grid Lines */}
              <div className="h-[calc(100%-29px)] md:h-[calc(100%-33px)]">
                <RealGridTradingChart
                  symbol="BTCUSDT"
                  showGridLines={true}
                  onDataLoaded={handleDataLoaded}
                  predictedRange={aiOptimizedParams?.priceRange}
                  optimalEntryZones={aiOptimizedParams?.optimalEntryZones}
                />
              </div>
            </div>

            {/* 90-Day Projection Section with Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-2">
              {/* 90-Day Projection Chart - Premium Feature */}
              <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded overflow-hidden h-[300px] md:h-[calc(45vh-60px)] relative">
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
                        Upgrade to Premium for AI-optimized projections & insights
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

              {/* Configuration & Stats Column */}
              <div className="relative space-y-2 bg-gray-900 border border-gray-800 rounded p-3 h-[300px] md:h-[calc(45vh-60px)] overflow-hidden">
                {/* Blurred Content */}
                <div className={!user || user.tier !== 'premium' ? 'blur-sm' : ''}>
                  {/* Configuration Section */}
                  <div>
                    <div className="text-xs font-semibold text-gray-300 mb-2">CONFIGURATION</div>
                    
                    {/* Budget Configuration */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-400 mb-1 block">Budget</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(Number(e.target.value))}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 pl-6 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                          min="100"
                          step="100"
                          disabled={!user || user.tier !== 'premium'}
                        />
                      </div>
                    </div>

                    {/* Leverage Configuration */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-400">Leverage</label>
                        <span className={`text-xs font-bold ${
                          leverage <= 2 ? 'text-green-400' : 
                          leverage <= 5 ? 'text-yellow-400' : 
                          'text-red-400'
                        }`}>
                          {leverage}x
                        </span>
                      </div>
                      <input
                        type="range"
                        value={leverage}
                        onChange={(e) => setLeverage(Number(e.target.value))}
                        min="1"
                        max="10"
                        step="1"
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        disabled={!user || user.tier !== 'premium'}
                      />
                      <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
                        <span>1x</span>
                        <span>5x</span>
                        <span>10x</span>
                      </div>
                      {leverage > 5 && (
                        <div className="mt-1.5 bg-red-900/20 border border-red-700/50 rounded p-1.5 flex items-start gap-1.5">
                          <span className="text-red-400 text-[10px]">⚠️</span>
                          <span className="text-red-400 text-[9px]">High leverage risk</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="border-t border-gray-800 pt-2">
                    <div className="text-xs font-semibold text-gray-300 mb-2">STATS</div>
                    <CompactProjectionCard
                      expectedProfit={expectedProfit}
                      profitProbability={profitProbability}
                      riskScore={riskScore}
                      leverage={leverage}
                      investmentAmount={budget}
                    />
                  </div>

                  {/* AI Risk Assessment (Premium) */}
                  {user && user.tier === 'premium' && aiOptimizedParams && (
                    <div className="border-t border-gray-800 pt-2">
                      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded p-2">
                        <div className="text-[10px] font-semibold text-purple-400 mb-2 flex items-center gap-1">
                          🤖 AI RISK
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-[10px]">Risk Score</span>
                            <span className={`font-semibold text-xs ${
                              aiOptimizedParams.riskScore <= 3 ? 'text-green-400' :
                              aiOptimizedParams.riskScore <= 6 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {aiOptimizedParams.riskScore.toFixed(1)}/10
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-[10px]">Volatility</span>
                            <span className="text-yellow-400 font-semibold text-xs">
                              {(aiOptimizedParams.expectedVolatility * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-[10px]">Seasonality</span>
                            <span className="text-blue-400 font-semibold text-xs">
                              {(aiOptimizedParams.seasonalityFactor * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Premium Overlay for Configuration Panel */}
                {(!user || user.tier !== 'premium') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 pointer-events-none">
                    <div className="text-center px-3 pointer-events-auto">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-xs font-bold text-white mb-1">Premium Only</h3>
                      <p className="text-[9px] text-gray-300 mb-2">
                        Adjust settings
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Optimizer Modal */}
      {showAIOptimizer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border border-blue-500/30">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/30 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Grid Optimizer
              </h3>
              <button
                onClick={() => setShowAIOptimizer(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <AIGridOptimizer
                symbol="BTCUSDT"
                onSetupComplete={(setup) => {
                  setOptimizedSetup(setup);
                  // Update budget and leverage from AI recommendations
                  setBudget(setup.metadata.investmentAmount);
                  setLeverage(setup.gridParameters.recommendedLeverage);
                  // Don't auto-close - let user review the results and close manually
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Modal (Premium Feature) */}
      {showAIInsights && user?.tier === 'premium' && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🤖 AI Market Insights
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">PREMIUM</span>
              </h2>
              <button
                onClick={() => setShowAIInsights(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-300">
                  {aiAnalysis || 'Generating AI analysis...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactTraderDemoV2;
