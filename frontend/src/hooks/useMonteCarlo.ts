import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

export interface MonteCarloResults {
  scenarios: Array<{
    finalBalance: number;
    totalTrades: number;
    profitableTrades: number;
    maxDrawdown: number;
    sharpeRatio: number;
    path: Array<{ day: number; price: number; balance: number }>;
  }>;
  statistics: {
    expectedReturn: number;
    bestCase: number;
    worstCase: number;
    profitProbability: number;
    expectedProfit: number;
    expectedDrawdown: number;
  };
  fanChartData: Array<{
    day: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  }>;
  investmentAmount: number;
  projectionDays: number;
}

export function useMonteCarlo() {
  const { user, getAuthToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runMonteCarlo = useCallback(async (
    symbol: string,
    gridParams: any,
    investmentAmount: number = 1000,
    leverage: number = 3,
    numSimulations: number = 1000,
    projectionDays: number = 90
  ): Promise<MonteCarloResults | null> => {
    if (!user) {
      setError('Authentication required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${BACKEND_URL}/api/montecarlo/simulate/${symbol}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gridParams,
          investmentAmount,
          leverage,
          numSimulations,
          projectionDays
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to run Monte Carlo simulation');
      }

      return data.data.results;
    } catch (err: any) {
      console.error('[useMonteCarlo] Error running simulation:', err);
      setError(err.message || 'Failed to run Monte Carlo simulation');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, getAuthToken]);

  const runQuickSimulation = useCallback(async (
    symbol: string,
    investmentAmount: number = 1000
  ): Promise<MonteCarloResults | null> => {
    if (!user) {
      setError('Authentication required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${BACKEND_URL}/api/montecarlo/simulate/quick/${symbol}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          investmentAmount
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to run quick simulation');
      }

      return data.data.results;
    } catch (err: any) {
      console.error('[useMonteCarlo] Error running quick simulation:', err);
      setError(err.message || 'Failed to run quick simulation');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, getAuthToken]);

  return {
    loading,
    error,
    runMonteCarlo,
    runQuickSimulation
  };
}