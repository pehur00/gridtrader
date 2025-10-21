// Currency formatting utilities
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(amount);
};

export const formatCrypto = (amount: number, symbol = ''): string => {
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  };

  const formatted = new Intl.NumberFormat('en-US', options).format(amount);
  return symbol ? `${formatted} ${symbol}` : formatted;
};

// Percentage formatting
export const formatPercentage = (value: number, decimals = 2): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

// Price formatting based on magnitude
export const formatPrice = (price: number): string => {
  if (price >= 1) {
    return price.toFixed(2);
  } else if (price >= 0.01) {
    return price.toFixed(4);
  } else if (price >= 0.0001) {
    return price.toFixed(6);
  } else {
    return price.toFixed(8);
  }
};

// Date formatting utilities
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
};

// Time ago formatting
export const formatTimeAgo = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;

  return formatDate(d);
};

// Trading pair utilities
export const parseTradingPair = (pair: string): { base: string; quote: string } => {
  const [base, quote] = pair.split('/');
  return { base, quote };
};

export const formatTradingPair = (base: string, quote: string): string => {
  return `${base}/${quote}`;
};

// Grid calculation utilities
export const calculateGridLevels = (
  lowerPrice: number,
  upperPrice: number,
  gridCount: number,
  spacing: 'uniform' | 'geometric'
): number[] => {
  if (spacing === 'uniform') {
    const step = (upperPrice - lowerPrice) / (gridCount - 1);
    return Array.from({ length: gridCount }, (_, i) => lowerPrice + i * step);
  } else {
    const ratio = Math.pow(upperPrice / lowerPrice, 1 / (gridCount - 1));
    return Array.from({ length: gridCount }, (_, i) => lowerPrice * Math.pow(ratio, i));
  }
};

export const calculateGridInvestment = (
  totalInvestment: number,
  gridCount: number
): number => {
  return totalInvestment / gridCount;
};

// Risk assessment utilities
export const calculateRiskScore = (
  volatility: number,
  maxDrawdown: number,
  winRate: number
): number => {
  // Lower score is better (less risky)
  const volatilityScore = Math.min(volatility * 100, 100);
  const drawdownScore = Math.min(Math.abs(maxDrawdown) * 100, 100);
  const winRateScore = Math.max(0, 100 - winRate * 100);

  return (volatilityScore + drawdownScore + winRateScore) / 3;
};

export const getRiskLevel = (riskScore: number): 'conservative' | 'moderate' | 'aggressive' => {
  if (riskScore < 30) return 'conservative';
  if (riskScore < 70) return 'moderate';
  return 'aggressive';
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidTradingPair = (pair: string): boolean => {
  const pairRegex = /^[A-Z]+\/[A-Z]+$/;
  return pairRegex.test(pair);
};

export const isValidApiKey = (apiKey: string): boolean => {
  return apiKey.length >= 10;
};

// Color utilities for UI
export const getProfitColor = (value: number): string => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};

export const getProfitBgColor = (value: number): string => {
  if (value > 0) return 'bg-green-100 text-green-800';
  if (value < 0) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'filled':
      return 'text-green-600';
    case 'paused':
    case 'partially_filled':
      return 'text-yellow-600';
    case 'inactive':
    case 'canceled':
      return 'text-gray-600';
    case 'error':
    case 'rejected':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

// Number utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const roundToDecimal = (value: number, decimals: number): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const significantDigits = (value: number, maxDigits: number = 8): number => {
  if (value === 0) return 0;

  const digits = Math.floor(Math.log10(Math.abs(value))) + 1;
  const factor = Math.max(0, maxDigits - digits);

  return roundToDecimal(value, factor);
};

// Array utilities
export const sortByDate = <T extends { createdAt: Date | string }>(
  items: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

export const groupBy = <T, K extends keyof any>(
  items: T[],
  key: (item: T) => K
): Record<K, T[]> => {
  return items.reduce((groups, item) => {
    const group = key(item);
    groups[group] = [...(groups[group] || []), item];
    return groups;
  }, {} as Record<K, T[]>);
};