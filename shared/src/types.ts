// User and Authentication Types
export interface User {
  id: string;
  email: string;
  tier: UserTier;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserTier {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium'
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

// Exchange Types
export interface ExchangeConnection {
  id: string;
  userId: string;
  exchangeName: string;
  isActive: boolean;
  createdAt: Date;
}

export interface PhemexCredentials {
  apiKey: string;
  secret: string;
}

// Grid Strategy Types
export interface GridStrategy {
  id: string;
  userId: string;
  tradingPair: string;
  parameters: GridParameters;
  backtestResults?: BacktestResults;
  status: GridStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GridParameters {
  upperPrice: number;
  lowerPrice: number;
  gridCount: number;
  totalInvestment: number;
  spacing: GridSpacing;
  riskLevel: RiskLevel;
}

export enum GridSpacing {
  UNIFORM = 'uniform',
  GEOMETRIC = 'geometric'
}

export enum RiskLevel {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive'
}

export enum GridStatus {
  DRAFT = 'draft',
  TESTED = 'tested',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

// Backtesting Types
export interface BacktestResults {
  estimatedProfit: number;
  estimatedProfitPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  winRate: number;
  averageTradeDuration: number;
  volatility: number;
  startDate: Date;
  endDate: Date;
}

// Active Deployment Types
export interface ActiveDeployment {
  id: string;
  gridStrategyId: string;
  status: DeploymentStatus;
  currentPnl: number;
  currentPnlPercent: number;
  totalInvested: number;
  currentValue: number;
  startTime: Date;
  endTime?: Date;
  openOrders: number;
  completedTrades: number;
}

export enum DeploymentStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error'
}

// Trading Data Types
export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell'
}

export enum OrderType {
  LIMIT = 'limit',
  MARKET = 'market'
}

export enum OrderStatus {
  NEW = 'new',
  PARTIALLY_FILLED = 'partially_filled',
  FILLED = 'filled',
  CANCELED = 'canceled',
  REJECTED = 'rejected'
}

// Analytics Types
export interface PerformanceMetrics {
  totalPnl: number;
  totalPnlPercent: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  totalTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  currentDrawdown: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalPnl: number;
  totalPnlPercent: number;
  activeGrids: number;
  completedGrids: number;
  totalTrades: number;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  tier: UserTier;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
}

// Form Types
export interface GridGeneratorForm {
  tradingPair: string;
  riskLevel: RiskLevel;
  investmentAmount: number;
  duration?: number; // in days
}

export interface ExchangeSettingsForm {
  apiKey: string;
  secret: string;
  exchangeName: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export enum NotificationType {
  GRID_PROFIT = 'grid_profit',
  GRID_LOSS = 'grid_loss',
  DEPLOYMENT_STARTED = 'deployment_started',
  DEPLOYMENT_STOPPED = 'deployment_stopped',
  PRICE_ALERT = 'price_alert',
  SYSTEM_MAINTENANCE = 'system_maintenance'
}