import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

export interface GridParameters {
  priceRange: { lower: number; upper: number };
  gridLevels: number;
  profitPerGrid: number;
  gridSpacing: number;
  confidence: number;
  volatilityScore: number;
  marketRegime: 'ranging' | 'trending' | 'highly_volatile';

  // Enhanced AI features
  predictedRange3M: {
    lower: number;
    upper: number;
    expectedMid: number;
    confidence: number;
  };
  expectedVolatility: number;
  seasonalityFactor: number;
  trendPrediction: 'bullish' | 'bearish' | 'neutral';
  optimalEntryZones: number[];
  riskScore: number;

  // Forward-looking metrics
  estimatedProfit3M: number;
  estimatedFills3M: number;
  avgTradeTime: number;
  recommendedInvestment: number;
}

export interface GridStrategy {
  id: string;
  symbol: string;
  parameters: GridParameters;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useGridOptimizer() {
  const { user, getAuthToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeGrid = useCallback(async (
    symbol: string,
    leverage: number = 1,
    investment: number = 1000
  ): Promise<GridParameters | null> => {
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

      const response = await fetch(`${BACKEND_URL}/api/grid/optimize/${symbol}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leverage, investment })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to optimize grid parameters');
      }

      return data.data.parameters;
    } catch (err: any) {
      console.error('[useGridOptimizer] Error optimizing grid:', err);
      setError(err.message || 'Failed to optimize grid parameters');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, getAuthToken]);

  const previewOptimization = useCallback(async (symbol: string): Promise<GridParameters | null> => {
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

      const response = await fetch(`${BACKEND_URL}/api/grid/optimize/${symbol}/preview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to preview optimization');
      }

      return data.data.parameters;
    } catch (err: any) {
      console.error('[useGridOptimizer] Error previewing optimization:', err);
      setError(err.message || 'Failed to preview optimization');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, getAuthToken]);

  const getUserStrategies = useCallback(async (): Promise<GridStrategy[]> => {
    if (!user) {
      setError('Authentication required');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${BACKEND_URL}/api/grid/strategies`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch strategies');
      }

      return data.data;
    } catch (err: any) {
      console.error('[useGridOptimizer] Error fetching strategies:', err);
      setError(err.message || 'Failed to fetch strategies');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, getAuthToken]);

  return {
    loading,
    error,
    optimizeGrid,
    previewOptimization,
    getUserStrategies
  };
}