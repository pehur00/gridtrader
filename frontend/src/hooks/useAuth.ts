import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  googleAuth: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Verify token is still valid
          const response = await authAPI.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);

      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken } = response.data as AuthResponse;

        setUser(userData);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(email, password);

      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken } = response.data as AuthResponse;

        setUser(userData);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setIsLoading(false);
    }
  };

  const googleAuth = (): void => {
    authAPI.googleAuth();
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    googleAuth,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};