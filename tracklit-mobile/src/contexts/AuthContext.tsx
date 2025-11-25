import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

import { apiRequest } from '@/lib/api';

interface User {
  id: number | string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
}

interface RegisterData {
  name: string;
  email: string;
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await apiRequest<User>('/api/user');
      setUser(response);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await apiRequest<User>('/api/login', {
        method: 'POST',
        data: { username, password },
      });
      setUser(response);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await apiRequest<User>('/api/register', {
        method: 'POST',
        data,
      });
      setUser(response);
      return true;
    } catch (error) {
      console.error('Registration failed', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/logout', { method: 'POST', rawResponse: true });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setUser(null);
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    setUser({
      id: 'guest',
      name: 'Guest User',
      username: 'guest',
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        continueAsGuest,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};