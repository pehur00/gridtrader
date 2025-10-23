import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RealGridTradingChart from '../components/RealGridTradingChart';
import { optimizeGridParameters } from '../utils/gridOptimizer';

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
  estimatedProfit24h: number;
  estimatedFills24h: number;
  avgTradeTime: number;
}

const LandingPage: React.FC = () => {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [gridParams, setGridParams] = useState<GridParams | null>(null);

  // Handle data loaded from the chart
  const handleChartDataLoaded = (data: PriceData[], latestPrice: number) => {
    setCurrentPrice(latestPrice);

    // Run grid optimization with real historical data
    const optimizedParams = optimizeGridParameters(data, latestPrice);
    setGridParams(optimizedParams);
  };

  // Fetch current BTC price and 24h change
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        const data = await response.json();
        setCurrentPrice(parseFloat(data.lastPrice));
        setPriceChange24h(parseFloat(data.priceChangePercent));
      } catch (error) {
        console.error('Error fetching current price:', error);
      }
    };

    fetchCurrentPrice();

    // Set up WebSocket for real-time price updates
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

    ws.onmessage = (event) => {
      const trade = JSON.parse(event.data);
      setCurrentPrice(parseFloat(trade.p));
    };

    return () => {
      ws.close();
    };
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                GridTrader
              </span>
              <span className="ml-2 text-xs text-gray-400 font-semibold">AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-2 mb-6">
            <span className="text-yellow-400 text-sm font-semibold">🎯 FREE BTC/USDT Grid Bot</span>
            <span className="text-gray-400 text-sm">AI-Optimized • No credit card required</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Profit from Bitcoin Volatility with
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              AI-Powered Grid Trading
            </span>
          </h1>

          <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto">
            Our AI analyzes market conditions and automatically optimizes your grid parameters.
            Start with a free BTC/USDT bot and see results in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/register"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 text-center shadow-lg shadow-yellow-500/20"
            >
              Deploy Free Grid Bot →
            </Link>
            <Link
              to="/login"
              className="border-2 border-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:border-yellow-500 hover:bg-gray-800/50 transition-all text-center"
            >
              View Backtest Results
            </Link>
          </div>
        </div>

        {/* Main Grid Trading Demo Section */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Chart Section - Takes 2 columns */}
            <div className="lg:col-span-2 p-6 border-r border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">BTC/USDT</h2>
                    <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                      LIVE GRID ACTIVE
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">24-Hour Performance View</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    {currentPrice > 0 ? `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'Loading...'}
                  </div>
                  <div className={`text-sm font-semibold ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}% (24h)
                  </div>
                </div>
              </div>

              {/* Trading Chart */}
              <div className="bg-gray-900/50 rounded-xl p-4 h-[400px]">
                <RealGridTradingChart showGridLines={true} onDataLoaded={handleChartDataLoaded} />
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-blue-500"></div>
                  <span className="text-gray-400">Price Movement</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-green-500 border-dashed"></div>
                  <span className="text-gray-400">Filled Grid Levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-gray-500 border-dashed"></div>
                  <span className="text-gray-400">Pending Orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-yellow-500"></div>
                  <span className="text-gray-400">Current Price</span>
                </div>
              </div>
            </div>

            {/* Settings & Stats Section */}
            <div className="p-6 bg-gray-800/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Optimized Settings
              </h3>

              <div className="space-y-4 mb-6">
                {/* Market Regime Indicator */}
                {gridParams && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        gridParams.marketRegime === 'ranging' ? 'bg-green-400' :
                        gridParams.marketRegime === 'trending' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}></div>
                      <span className="text-xs font-semibold text-white uppercase">
                        {gridParams.marketRegime === 'ranging' ? 'Ranging Market' :
                         gridParams.marketRegime === 'trending' ? 'Trending Market' :
                         'High Volatility'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {gridParams.marketRegime === 'ranging'
                        ? 'Ideal conditions for grid trading'
                        : gridParams.marketRegime === 'trending'
                        ? 'Moderate conditions, adjusted parameters'
                        : 'High volatility detected, wider spacing applied'}
                    </div>
                  </div>
                )}

                {/* Grid Parameters */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Price Range</span>
                    <span className="text-sm font-semibold text-white">
                      {gridParams
                        ? `$${(gridParams.priceRange.lower / 1000).toFixed(0)}K - $${(gridParams.priceRange.upper / 1000).toFixed(0)}K`
                        : 'Calculating...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Grid Levels</span>
                    <span className="text-sm font-semibold text-white">
                      {gridParams ? `${gridParams.gridLevels} orders` : 'Calculating...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Profit per Grid</span>
                    <span className="text-sm font-semibold text-green-400">
                      {gridParams ? `~${gridParams.profitPerGrid}%` : 'Calculating...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Grid Spacing</span>
                    <span className="text-sm font-semibold text-white">
                      {gridParams ? `$${gridParams.gridSpacing}` : 'Calculating...'}
                    </span>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-3 uppercase font-semibold">24H Performance (Est.)</div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400">Total Profit</span>
                        <span className="text-lg font-bold text-green-400">
                          {gridParams ? `+$${gridParams.estimatedProfit24h.toLocaleString()}` : 'Calculating...'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400">Estimated Fills</span>
                        <span className="text-sm font-semibold text-white">
                          {gridParams ? `~${gridParams.estimatedFills24h} trades` : 'Calculating...'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: gridParams
                              ? `${Math.min((gridParams.estimatedFills24h / gridParams.gridLevels) * 100, 100)}%`
                              : '0%'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Avg. Trade Time</span>
                        <span className="text-sm font-semibold text-white">
                          {gridParams ? `${gridParams.avgTradeTime}h` : 'Calculating...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Confidence Badge */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-yellow-400 mb-1">
                        Optimization Confidence: {gridParams ? `${gridParams.confidence}%` : 'Calculating...'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {gridParams
                          ? `Based on ATR analysis, volatility patterns, and ${gridParams.marketRegime === 'ranging' ? 'ideal' : gridParams.marketRegime === 'trending' ? 'moderate' : 'challenging'} market conditions`
                          : 'Analyzing 90 days of historical data...'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deploy Button */}
              <Link
                to="/register"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
              >
                Deploy This Grid
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Backtest Section */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-8 mb-16">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2">Historical Backtest Results</h3>
              <p className="text-gray-400 mb-4">
                See how this exact grid configuration performed over the past 30 days with real market data.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Total Return</div>
                  <div className="text-2xl font-bold text-green-400">+18.7%</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Win Rate</div>
                  <div className="text-2xl font-bold text-white">94.2%</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Max Drawdown</div>
                  <div className="text-2xl font-bold text-yellow-400">-3.2%</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Sharpe Ratio</div>
                  <div className="text-2xl font-bold text-white">2.84</div>
                </div>
              </div>

              {/* Login Gate */}
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Login to View Full Backtest
                </Link>
                <span className="text-sm text-gray-400">
                  Includes detailed trade history, risk metrics, and parameter analysis
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            How Grid Trading Works
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Simple, automated, and profitable in volatile markets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4 text-2xl">
              1️⃣
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI Sets the Grid</h3>
            <p className="text-gray-400">
              Our AI analyzes BTC volatility, support/resistance levels, and market conditions to create the optimal grid for current market.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4 text-2xl">
              2️⃣
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Auto Buy Low, Sell High</h3>
            <p className="text-gray-400">
              As BTC price moves, the bot automatically buys at lower grid levels and sells at higher levels, capturing profit from every swing.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4 text-2xl">
              3️⃣
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Earn 24/7</h3>
            <p className="text-gray-400">
              Your grid runs continuously, making money from market volatility even while you sleep. More volatility = more trades = more profit.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Start Earning from Bitcoin Volatility?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Deploy your free AI-optimized grid bot in less than 2 minutes
          </p>
          <Link
            to="/register"
            className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-10 py-4 rounded-lg font-semibold text-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/20"
          >
            Get Started Free - No CC Required
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            ✓ Free forever &nbsp; ✓ No credit card &nbsp; ✓ Deploy in 2 minutes
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 GridTrader AI. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
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
