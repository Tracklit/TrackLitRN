import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';
import { ApiResponse } from '../types/api';

// Mock AsyncStorage for TypeScript compatibility
const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // In real React Native, this would use @react-native-async-storage/async-storage
      return global.localStorage?.getItem(key) || null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // In real React Native, this would use @react-native-async-storage/async-storage
      global.localStorage?.setItem(key, value);
    } catch {
      // Ignore errors
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      // In real React Native, this would use @react-native-async-storage/async-storage
      global.localStorage?.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const userData = await apiService.getCurrentUser() as ApiResponse<User>;
      setUser(userData as User);
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(email, password) as ApiResponse<User>;
      
      if ((response as any).sessionId) {
        await AsyncStorage.setItem('sessionId', (response as any).sessionId);
      }
      
      setUser((response as any).user as User);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
      await AsyncStorage.removeItem('sessionId');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.register(email, password, name) as ApiResponse<User>;
      
      if ((response as any).sessionId) {
        await AsyncStorage.setItem('sessionId', (response as any).sessionId);
      }
      
      setUser((response as any).user as User);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};