import React, { useState } from 'react';
import ConfigurationPanel from '../components/ConfigurationPanel';
import ProjectionSummaryCard from '../components/ProjectionSummaryCard';

/**
 * Demo page to showcase the new ConfigurationPanel and ProjectionSummaryCard components
 * This page is useful for testing and demonstrating the leverage and projection features
 */
const ComponentDemo: React.FC = () => {
  const [budget, setBudget] = useState<number>(1000);
  const [leverage, setLeverage] = useState<number>(3);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  // Simulated current BTC price
  const currentPrice = 109823.83;

  // Simulated Monte Carlo results
  const expectedProfit = budget * leverage * 0.25; // 25% return on leveraged capital
  const profitProbability = leverage <= 3 ? 72 : leverage <= 5 ? 65 : 55;
  const riskScore = leverage <= 2 ? 3 : leverage <= 3 ? 4.5 : leverage <= 5 ? 6.5 : 8.5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          GridTrader Components Demo
        </h1>
        <p className="text-gray-400">
          Interactive demonstration of Configuration Panel and 90-Day Projection Card
        </p>
      </div>

      {/* Components Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Projection Summary Card */}
        <div className="lg:col-span-2">
          <ProjectionSummaryCard
            expectedProfit={expectedProfit}
            investmentAmount={budget}
            leverage={leverage}
            profitProbability={profitProbability}
            riskScore={riskScore}
            projectionDays={90}
            isLoading={false}
          />
        </div>
      </div>

      {/* Live Stats Display */}
      <div className="max-w-7xl mx-auto mt-8 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">📊 Live Configuration Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-400 mb-1">Initial Budget</div>
            <div className="text-2xl font-bold text-white">${budget.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Leverage</div>
            <div className="text-2xl font-bold text-blue-400">{leverage}x</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Effective Capital</div>
            <div className="text-2xl font-bold text-green-400">
              ${(budget * leverage).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Liquidation Price</div>
            <div className="text-2xl font-bold text-red-400">
              ${Math.round(currentPrice * (1 - (1 / leverage) * 0.9)).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-400 mb-1">Expected 90d Profit</div>
            <div className="text-2xl font-bold text-green-400">
              +${Math.round(expectedProfit).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">ROI (Leveraged)</div>
            <div className="text-2xl font-bold text-yellow-400">
              +{((expectedProfit / budget) * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Profit Probability</div>
            <div className="text-2xl font-bold text-purple-400">{profitProbability}%</div>
          </div>
        </div>
      </div>

      {/* Risk Warning */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className={`rounded-lg p-6 border ${
          leverage >= 5
            ? 'bg-red-500/10 border-red-500/30'
            : leverage >= 3
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-green-500/10 border-green-500/30'
        }`}>
          <div className="flex items-start gap-4">
            <div className="text-4xl">
              {leverage >= 5 ? '⚠️' : leverage >= 3 ? '⚡' : '✅'}
            </div>
            <div>
              <h3 className={`text-xl font-bold mb-2 ${
                leverage >= 5 ? 'text-red-300' :
                leverage >= 3 ? 'text-yellow-300' : 'text-green-300'
              }`}>
                {leverage >= 5 ? 'High Risk Configuration' :
                 leverage >= 3 ? 'Moderate Risk Configuration' :
                 'Conservative Configuration'}
              </h3>
              <p className="text-gray-300">
                {leverage >= 5
                  ? `With ${leverage}x leverage, your position can be liquidated if the price drops ${((1 - (1 / leverage) * 0.9) * 100).toFixed(1)}%. Consider reducing leverage or setting tight stop-losses.`
                  : leverage >= 3
                  ? `With ${leverage}x leverage, you're taking on moderate risk for potentially higher returns. Monitor your positions regularly.`
                  : `With ${leverage}x leverage, you're taking a conservative approach with lower liquidation risk. This is ideal for beginners.`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Component Features List */}
      <div className="max-w-7xl mx-auto mt-8 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">✨ Component Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Configuration Panel</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Real-time budget input with validation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Leverage selector (1x-10x) with risk labels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Automatic effective capital calculation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Liquidation price estimation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Optional custom starting price override</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Dynamic risk warnings based on leverage</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-400 mb-3">Projection Summary Card</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>90-day expected profit display</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>ROI calculation (leveraged & unleveraged)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Profit probability percentage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Visual risk level indicator (0-10 scale)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Confidence-based color coding</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Loading state with skeleton UI</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentDemo;
