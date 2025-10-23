import React, { useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CompactChart from '../components/CompactChart';
import MiniMonteCarloWidget from '../components/MiniMonteCarloWidget';
import CompactParameterCards from '../components/CompactParameterCards';
import ConfigurationPanel from '../components/ConfigurationPanel';
import ProjectionSummaryCard from '../components/ProjectionSummaryCard';
import SymbolSelector from '../components/SymbolSelector';
import { AIGridOptimizer } from '../components/AIGridOptimizer';
import { optimizeGridWithAI, generateAIAnalysis } from '../utils/aiGridOptimizer';
import { runMonteCarloSimulation } from '../utils/monteCarloSimulator';
import { useMarketData } from '../hooks/useMarketData';
import { use24hTicker } from '../hooks/use24hTicker';
import { useAuth } from '../contexts/AuthContext';
import { UserTier } from '@gridtrader/shared';
import type { OptimizedGridSetup } from '../utils/completeGridOptimizer';

interface PriceData {
  time: number;
  price: number;
  timestamp: string;
}

interface GridParams {
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
  estimatedProfit3M: number;
  estimatedFills3M: number;
  avgTradeTime: number;
  recommendedInvestment: number;
  estimatedProfit24h?: number;
  estimatedFills24h?: number;
}

interface MonteCarloData {
  scenarios: any[];
  statistics: any;
  fanChartData: any[];
  investmentAmount: number;
  projectionDays: number;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: authLogout } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const { currentPrice } = useMarketData(selectedSymbol);
  const { tickerData } = use24hTicker(selectedSymbol);
  const [gridParams, setGridParams] = useState<GridParams | null>(null);
  const [monteCarloData, setMonteCarloData] = useState<MonteCarloData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [budget, setBudget] = useState<number>(1000);
  const [leverage, setLeverage] = useState<number>(3);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [showAIOptimizer, setShowAIOptimizer] = useState<boolean>(false);
  const [optimizedSetup, setOptimizedSetup] = useState<OptimizedGridSetup | null>(null);
  const isLoggedIn = !!user;
  const normalizedTier = user?.tier ?? UserTier.FREE;
  const isPremium = normalizedTier === UserTier.PREMIUM || normalizedTier === UserTier.PRO;
  
  // Fix user email display
  const userEmail = user?.email || 'User';
  const userInitial = userEmail.charAt(0).toUpperCase() || '?';
  const tierLabel = normalizedTier.charAt(0).toUpperCase() + normalizedTier.slice(1);

  // Logout handler
  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  // Use ref to track if optimization has already run to prevent excessive re-runs
  const hasOptimizedRef = useRef(false);

  // Handle data loaded from the chart (memoized to prevent excessive re-renders)
  const handleChartDataLoaded = useCallback((data: PriceData[], latestPrice: number) => {
    // Only run optimization once per session unless symbol changes
    if (hasOptimizedRef.current) {
      return;
    }

    // Run AI optimization
    const optimizedParams = optimizeGridWithAI(data, latestPrice);
    setGridParams(optimizedParams);

    // Generate AI analysis text
    const analysis = generateAIAnalysis(optimizedParams);
    setAiAnalysis(analysis);

    // Run Monte Carlo forward projection
    if (optimizedParams) {
      const monteCarlo = runMonteCarloSimulation(
        data,
        {
          priceRange: optimizedParams.priceRange,
          gridLevels: optimizedParams.gridLevels,
          gridSpacing: optimizedParams.gridSpacing,
          profitPerGrid: optimizedParams.profitPerGrid
        },
        budget, // Custom budget
        leverage, // Custom leverage
        1000, // 1000 simulations
        90  // 90 days forward
      );
      setMonteCarloData(monteCarlo);
    }

    hasOptimizedRef.current = true;
  }, []);

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    setGridParams(null);
    setMonteCarloData(null);
    hasOptimizedRef.current = false; // Reset flag to allow re-optimization for new symbol
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Condensed Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                GridTrader AI
              </span>
              <SymbolSelector
                selectedSymbol={selectedSymbol}
                onSymbolChange={handleSymbolChange}
                isPremium={isPremium}
              />
            </div>
            <div className="flex items-center gap-3">
              {!isLoggedIn && (
                <>
                  <Link
                    to="/login"
                    state={{ from: location }}
                    className="text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-4 py-1.5 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all text-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
              {isLoggedIn && user && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-300 font-semibold uppercase">
                      {userInitial}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-semibold text-white">
                        {userEmail}
                      </span>
                      <span className="text-xs text-gray-400 uppercase tracking-wide">
                        {tierLabel}
                      </span>
                    </div>
                    {isPremium && (
                      <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">
                        👑 Premium
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors text-sm border border-gray-700/60 hover:border-yellow-500/60"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Condensed Main Content - Single Screen */}
      <div className="w-full py-6">
        {/* Header Stats Bar */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">
                  {selectedSymbol.replace('USDT', '/USDT')}
                </h1>
                <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                  AI-OPTIMIZED
                </span>
                {gridParams && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    gridParams.marketRegime === 'ranging' ? 'bg-green-500/20 text-green-400' :
                    gridParams.marketRegime === 'trending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {gridParams.marketRegime === 'ranging' ? 'RANGING (IDEAL)' :
                     gridParams.marketRegime === 'trending' ? 'TRENDING' :
                     'HIGH VOLATILITY'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">1-Year Historical • 90-Day Projection • 1000 Monte Carlo Scenarios</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {currentPrice > 0 ? `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'Loading...'}
              </div>
              <div className={`text-sm font-semibold ${tickerData && tickerData.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {tickerData ? `${tickerData.priceChangePercent >= 0 ? '+' : ''}${tickerData.priceChangePercent.toFixed(2)}% (24h)` : 'Loading...'}
              </div>
            </div>
          </div>
        </div>

        {/* AI Grid Optimizer Section */}
        {isLoggedIn && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">AI Grid Optimizer</h2>
                    <p className="text-xs text-gray-400">Let AI analyze the market and generate optimal grid setups</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIOptimizer(!showAIOptimizer)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all"
                >
                  {showAIOptimizer ? 'Hide Optimizer' : 'Open Optimizer'}
                </button>
              </div>
              
              {showAIOptimizer && (
                <div className="mt-4 pt-4 border-t border-blue-500/20">
                  <AIGridOptimizer
                    symbol={selectedSymbol}
                    onSetupComplete={(setup) => {
                      setOptimizedSetup(setup);
                      // Optionally update the budget/leverage based on AI recommendations
                      setBudget(setup.metadata.investmentAmount);
                      setLeverage(setup.gridParameters.recommendedLeverage);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Budget & Leverage Configuration */}
        {isLoggedIn && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <ConfigurationPanel
                budget={budget}
                leverage={leverage}
                currentPrice={currentPrice}
                onBudgetChange={setBudget}
                onLeverageChange={setLeverage}
                onCustomPriceChange={setCustomPrice}
                customPrice={customPrice}
              />
            </div>

            {/* 90-Day Projection Summary */}
            <div className="lg:col-span-2">
              <ProjectionSummaryCard
                expectedProfit={monteCarloData?.statistics?.expectedProfit || gridParams?.estimatedProfit3M || 0}
                investmentAmount={budget}
                leverage={leverage}
                profitProbability={monteCarloData?.statistics?.profitProbability || 65}
                riskScore={gridParams?.riskScore || 5}
                projectionDays={90}
                isLoading={!gridParams}
              />
            </div>
          </div>
        )}

        {/* Fee Calculator & Analysis - Only for Premium Users */}
        {isPremium && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">💰 Trading Fee Analysis</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Estimated Daily Trades</span>
                    <span className="text-green-400 font-semibold">24-48 trades</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Grid Spacing</span>
                    <span className="text-white font-semibold">${Math.round(gridParams?.gridSpacing || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Fees (24h)</span>
                    <span className="text-yellow-400 font-semibold">${Math.round((gridParams?.gridSpacing || 0) * 24 * 0.0006)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Break-even Trades</span>
                    <span className="text-green-400 font-semibold">{Math.round((gridParams?.profitPerGrid || 0.5) * 0.0006 * 100)}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">⚡ Leverage Optimization</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Recommended Leverage</span>
                    <span className={`font-semibold ${
                      gridParams?.marketRegime === 'ranging' ? 'text-green-400' :
                      gridParams?.marketRegime === 'trending' ? 'text-yellow-400' : 'text-orange-400'
                    }`}>
                      {gridParams?.marketRegime === 'ranging' ? '3-5x (Optimal)' :
                       gridParams?.marketRegime === 'trending' ? '2-3x (Moderate)' : '1-2x (Conservative)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Expected Sharpe Ratio</span>
                    <span className="text-white font-semibold">{(gridParams?.volatilityScore || 0.02) * 1000 ? '1.8-2.5' : '1.2-1.8'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Risk Level</span>
                    <span className={`font-semibold ${
                      leverage <= 3 ? 'text-green-400' :
                      leverage <= 5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {leverage <= 3 ? 'LOW ✅' :
                       leverage <= 5 ? 'MEDIUM ⚠️' : 'HIGH 🚨'}
                    </span>
                  </div>
                  <div className="mt-3 p-3 bg-gray-900/50 rounded border border-gray-600">
                    <p className="text-xs text-gray-400">
                      <strong>💡 Pro Tip:</strong> For {gridParams?.marketRegime === 'ranging' ? 'ranging markets' :
                        gridParams?.marketRegime === 'trending' ? 'trending markets' : 'highly volatile markets'},
                      use {gridParams?.marketRegime === 'ranging' ? 'higher leverage (3-5x)' :
                        gridParams?.marketRegime === 'trending' ? 'moderate leverage (2-3x)' : 'conservative leverage (1-2x)'}
                      for optimal risk-adjusted returns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          {/* Left Column: Chart - 5 columns */}
          <div className="lg:col-span-5">
            <CompactChart
              symbol={selectedSymbol}
              showGridLines={true}
              onDataLoaded={handleChartDataLoaded}
              predictedRange={gridParams?.predictedRange3M}
              optimalEntryZones={gridParams?.optimalEntryZones}
            />
          </div>

          {/* Middle Column: Parameters - 4 columns */}
          <div className="lg:col-span-4">
            {gridParams ? (
              <CompactParameterCards
                optimizedParams={gridParams}
                currentPrice={currentPrice}
                isLoggedIn={isLoggedIn}
                isPremium={isPremium}
                aiAnalysis={aiAnalysis}
              />
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                  <p className="text-gray-400 text-sm">Analyzing market data...</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Actions - 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            {/* Deploy CTA */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Ready to Deploy?</h3>
              <p className="text-xs text-gray-400 mb-3">
                {gridParams
                  ? `Start with $${gridParams.recommendedInvestment} • ${gridParams.gridLevels} grid levels`
                  : 'Calculating optimal parameters...'}
              </p>
              <Link
                to="/register"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 py-2.5 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all flex items-center justify-center gap-2 text-sm"
              >
                Get Started Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              {!isLoggedIn && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  No credit card required
                </p>
              )}
            </div>

            {/* Risk Indicator */}
            {gridParams && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Risk Assessment</h3>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        gridParams.riskScore <= 3 ? 'bg-green-400' :
                        gridParams.riskScore <= 6 ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}
                      style={{ width: `${(gridParams.riskScore / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {gridParams.riskScore}/10
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {gridParams.riskScore <= 3 ? 'Low Risk - Conservative' :
                   gridParams.riskScore <= 6 ? 'Moderate Risk - Balanced' :
                   'Higher Risk - Aggressive'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monte Carlo Projection - Full Width */}
        <div>
          {monteCarloData ? (
            <MiniMonteCarloWidget
              monteCarloData={monteCarloData}
              isLoggedIn={isLoggedIn}
            />
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm">Running Monte Carlo simulation...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 mt-8">
        <div className="w-full py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
            <div>© 2025 GridTrader AI. All rights reserved.</div>
            <div className="flex gap-4 mt-2 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
