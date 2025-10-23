import React from 'react';
import { AIGridOptimizer } from '../components/AIGridOptimizer';
import { useAuth } from '../contexts/AuthContext';

const OptimizerLandingPage: React.FC = () => {
  const { user } = useAuth();
  const isPremium = user?.tier === 'premium';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Compact Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  AI Grid Trading Optimizer
                </h1>
                <p className="text-sm text-blue-100">
                  Maximize profits with intelligent automation
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden lg:flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">15-60%</div>
                <div className="text-xs text-blue-100">APR</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50-90%</div>
                <div className="text-xs text-blue-100">Success</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">&lt;10%</div>
                <div className="text-xs text-blue-100">Drawdown</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Optimizer + Premium Benefits Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Main Optimizer - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden h-full">
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 border-b border-gray-700">
                <h2 className="text-white font-bold text-xl">Configure Your Strategy</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Enter your parameters below and get an AI-optimized grid trading setup
                </p>
              </div>
              
              <div className="p-6">
                <AIGridOptimizer />
              </div>
            </div>
          </div>

          {/* Premium Benefits Sidebar - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl border border-purple-500/50 p-6 h-full">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="text-xl font-bold text-white">
                  {isPremium ? 'Premium Active' : 'Upgrade to Pro'}
                </h3>
              </div>

              {isPremium ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-semibold text-sm">Unlimited Optimizations</p>
                      <p className="text-purple-200 text-xs">No daily limits</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-semibold text-sm">Advanced AI Models</p>
                      <p className="text-purple-200 text-xs">Higher accuracy predictions</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-semibold text-sm">Backtesting Engine</p>
                      <p className="text-purple-200 text-xs">Test strategies on historical data</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-semibold text-sm">Broker Integration</p>
                      <p className="text-purple-200 text-xs">One-click deployment</p>
                    </div>
                  </div>

                  <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-3 mt-4">
                    <p className="text-green-300 text-sm font-semibold text-center">
                      ✨ You're getting the best experience!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-semibold text-sm">Unlimited Optimizations</p>
                      <p className="text-purple-200 text-xs">vs. 3/hour free tier</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-semibold text-sm">Advanced AI Models</p>
                      <p className="text-purple-200 text-xs">Higher accuracy predictions</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-semibold text-sm">Backtesting Engine</p>
                      <p className="text-purple-200 text-xs">Test on historical data</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-semibold text-sm">Broker Integration</p>
                      <p className="text-purple-200 text-xs">One-click deployment</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-semibold text-sm">Priority Support</p>
                      <p className="text-purple-200 text-xs">24/7 expert assistance</p>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 mt-4">
                    Upgrade to Pro - $49/month
                  </button>

                  <p className="text-purple-300 text-xs text-center mt-2">
                    30-day money-back guarantee
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Section - Now Below Optimizer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-blue-500 text-3xl mb-3">🤖</div>
            <h3 className="text-white font-bold text-lg mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-400 text-sm">
              Advanced algorithms analyze market regime, volatility, and historical patterns to optimize grid parameters.
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-green-500 text-3xl mb-3">📊</div>
            <h3 className="text-white font-bold text-lg mb-2">Live Market Data</h3>
            <p className="text-gray-400 text-sm">
              Real-time price charts with grid overlays show exactly where your orders will be placed.
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-purple-500 text-3xl mb-3">⚡</div>
            <h3 className="text-white font-bold text-lg mb-2">Risk-Adjusted Strategies</h3>
            <p className="text-gray-400 text-sm">
              Choose your risk tolerance and let AI calculate optimal leverage, spacing, and capital allocation.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700 mb-12">
          <h2 className="text-white font-bold text-2xl mb-6 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
              <h4 className="text-white font-semibold mb-2">Select Symbol</h4>
              <p className="text-gray-400 text-sm">Choose BTC, ETH, or other supported cryptocurrencies</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
              <h4 className="text-white font-semibold mb-2">Set Parameters</h4>
              <p className="text-gray-400 text-sm">Investment amount, risk tolerance, and time horizon</p>
            </div>
            
            <div className="text-center">
              <div className="bg-pink-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
              <h4 className="text-white font-semibold mb-2">AI Optimization</h4>
              <p className="text-gray-400 text-sm">Our AI calculates optimal grid levels and strategy</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">4</div>
              <h4 className="text-white font-semibold mb-2">Deploy & Trade</h4>
              <p className="text-gray-400 text-sm">Review results and deploy to your broker (coming soon)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>⚠️ Grid trading carries risk. Past performance does not guarantee future results.</p>
          <p className="mt-2">Always do your own research and only invest what you can afford to lose.</p>
        </div>
      </div>
    </div>
  );
};

export default OptimizerLandingPage;
