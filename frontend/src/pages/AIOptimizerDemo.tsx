import React from 'react';
import { AIGridOptimizer } from '../components/AIGridOptimizer';
import type { OptimizedGridSetup } from '../utils/completeGridOptimizer';

export const AIOptimizerDemo: React.FC = () => {
  const handleSetupComplete = (setup: OptimizedGridSetup) => {
    console.log('Optimization complete:', setup);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            AI Grid Optimizer
          </h1>
          <p className="text-gray-400">
            Let AI analyze the market and generate the optimal grid trading setup
          </p>
        </div>

        <AIGridOptimizer
          symbol="BTCUSDT"
          onSetupComplete={handleSetupComplete}
        />
      </div>
    </div>
  );
};
