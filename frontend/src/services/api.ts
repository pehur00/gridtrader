import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth API endpoints
export const authAPI = {
  // Register new user
  register: async (email: string, password: string) => {
    const response = await api.post<ApiResponse>('/auth/register', {
      email,
      password,
    });
    return response.data;
  },

  // Login user
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // Google OAuth
  googleAuth: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    const response = await api.post<ApiResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get<ApiResponse>('/auth/me');
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// Exchange API endpoints
export const exchangeAPI = {
  // Connect exchange
  connect: async (exchangeName: string, credentials: any) => {
    const response = await api.post<ApiResponse>('/exchange/connect', {
      exchangeName,
      ...credentials,
    });
    return response.data;
  },

  // Get exchange status
  getStatus: async () => {
    const response = await api.get<ApiResponse>('/exchange/status');
    return response.data;
  },

  // Disconnect exchange
  disconnect: async (exchangeId: string) => {
    const response = await api.delete<ApiResponse>(`/exchange/${exchangeId}`);
    return response.data;
  },

  // Get balance
  getBalance: async (exchangeId: string) => {
    const response = await api.get<ApiResponse>(`/exchange/${exchangeId}/balance`);
    return response.data;
  },
};

// Grid API endpoints
export const gridAPI = {
  // Generate grid
  generate: async (data: any) => {
    const response = await api.post<ApiResponse>('/grid/generate', data);
    return response.data;
  },

  // Get user grids
  getGrids: async (page = 1, limit = 10) => {
    const response = await api.get<ApiResponse>(`/grid?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get grid by ID
  getGrid: async (id: string) => {
    const response = await api.get<ApiResponse>(`/grid/${id}`);
    return response.data;
  },

  // Update grid
  updateGrid: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/grid/${id}`, data);
    return response.data;
  },

  // Delete grid
  deleteGrid: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/grid/${id}`);
    return response.data;
  },
};

// Backtest API endpoints
export const backtestAPI = {
  // Run backtest
  run: async (gridId: string) => {
    const response = await api.post<ApiResponse>('/backtest/run', { gridId });
    return response.data;
  },

  // Get backtest results
  getResults: async (backtestId: string) => {
    const response = await api.get<ApiResponse>(`/backtest/${backtestId}`);
    return response.data;
  },
};

// Deployment API endpoints
export const deploymentAPI = {
  // Start deployment
  start: async (gridId: string) => {
    const response = await api.post<ApiResponse>('/deploy/start', { gridId });
    return response.data;
  },

  // Get deployment status
  getStatus: async (deploymentId: string) => {
    const response = await api.get<ApiResponse>(`/deploy/${deploymentId}`);
    return response.data;
  },

  // Stop deployment
  stop: async (deploymentId: string) => {
    const response = await api.post<ApiResponse>(`/deploy/stop`, { deploymentId });
    return response.data;
  },

  // Get performance
  getPerformance: async (deploymentId: string) => {
    const response = await api.get<ApiResponse>(`/deploy/${deploymentId}/performance`);
    return response.data;
  },
};

// Analytics API endpoints
export const analyticsAPI = {
  // Get performance metrics
  getPerformance: async (timeframe = '7d') => {
    const response = await api.get<ApiResponse>(`/analytics/performance?timeframe=${timeframe}`);
    return response.data;
  },

  // Get history
  getHistory: async (page = 1, limit = 50) => {
    const response = await api.get<ApiResponse>(`/analytics/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get metrics
  getMetrics: async () => {
    const response = await api.get<ApiResponse>('/analytics/metrics');
    return response.data;
  },
};

export default api;