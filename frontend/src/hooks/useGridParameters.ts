import { useState, useEffect } from 'react';

interface GridParameters {
  priceRange: { lower: number; upper: number };
  gridLevels: number;
  profitPerGrid: number;
  gridSpacing: number;
  aiConfidence: number;
  totalProfit24h: number;
  filledOrders: number;
  avgTradeTime: number;
}

export const useGridParameters = (currentPrice: number) => {
  const [parameters, setParameters] = useState<GridParameters>({
    priceRange: { lower: 0, upper: 0 },
    gridLevels: 50,
    profitPerGrid: 0.5,
    gridSpacing: 0,
    aiConfidence: 94,
    totalProfit24h: 0,
    filledOrders: 0,
    avgTradeTime: 2.4
  });

  useEffect(() => {
    if (currentPrice === 0) return;

    // Calculate AI-optimized grid parameters based on current price
    // Using ±5% range around current price for optimal grid trading
    const upperBound = Math.round(currentPrice * 1.05);
    const lowerBound = Math.round(currentPrice * 0.95);
    const gridCount = 50;
    const spacing = Math.round((upperBound - lowerBound) / gridCount);

    // Calculate profit per grid (0.5% per level)
    const profitPerGrid = 0.5;

    // Estimate 24h profit based on grid spacing and typical BTC volatility
    // Assuming 10-15 grid fills per day with current volatility
    const estimatedFills = 12;
    const avgProfit = spacing * (profitPerGrid / 100) * estimatedFills;

    // Estimate filled orders (assuming 85% fill rate)
    const filledOrders = Math.round(gridCount * 0.85 * 2.5); // 2.5x turnover

    setParameters({
      priceRange: { lower: lowerBound, upper: upperBound },
      gridLevels: gridCount,
      profitPerGrid,
      gridSpacing: spacing,
      aiConfidence: 94,
      totalProfit24h: Math.round(avgProfit),
      filledOrders,
      avgTradeTime: 2.4
    });
  }, [currentPrice]);

  return parameters;
};
