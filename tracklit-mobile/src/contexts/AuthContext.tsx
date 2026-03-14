import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Linking } from 'react-native';

import { apiRequest } from '@/lib/api';
import {
  getToken, 
  setToken, 
  clearAuthStorage, 
  getStoredUser,
  setStoredUser,
  debugAuthStorage,
  clearStoredUser,
} from '@/lib/tokenStorage';
import { getQueryParam } from '@/utils/url';

const DEBUG_AUTH = __DEV__;

interface User {
  id: number | string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  country?: string | null;
  dateOfBirth?: string | null; // server returns ISO string
  defaultClubId?: number | null;
  isPrivate?: boolean | null;
  spikes?: number | null;
  isPremium?: boolean | null;
  subscriptionTier?: string | null;
  sprinthiaPrompts?: number | null;
  sprinthiaProgramsCreated?: number | null;
  sprinthiaRegenerationsUsed?: number | null;
  token?: string; // Token may be included in response
  role?: string | null;
  isCoach?: boolean | null;
}

interface RegisterData {
  name: string;
  email: string;
  username: string;
  password: string;
}

interface LoginResponse extends User {
  token: string;
}

interface RegisterResponse {
  user: User & { token?: string };
  token: string;
  requiresOnboarding?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasValidToken: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithToken: (token: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  refreshUser: () => Promise<void>;
  setUserAndPersist: (user: User | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidToken, setHasValidToken] = useState(false);
  const authRequestIdRef = useRef(0);

  const setUserAndPersist = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) {
      await setStoredUser(nextUser);
    } else {
      await clearStoredUser();
    }
  }, []);

  // Fetch user from API (validates token)
  const fetchUser = useCallback(async (tokenOverride?: string | null) => {
    const requestId = ++authRequestIdRef.current;

    if (DEBUG_AUTH) {
      console.log('[AUTH] Starting fetchUser...', {
        requestId,
        hasTokenOverride: !!tokenOverride,
      });
    }
    
    try {
      // First check if we have a stored token
      const token = tokenOverride ?? await getToken();

      const isStaleRequest = () => authRequestIdRef.current !== requestId;
      
      if (DEBUG_AUTH) {
        console.log('[AUTH] Token exists:', !!token, token ? `${token.substring(0, 20)}...` : 'none');
      }
      
      if (!token) {
        // No token - check if there's a stored user
        const storedUser = await getStoredUser();

        if (isStaleRequest()) {
          return;
        }
        
        if (storedUser && storedUser.id === 'guest') {
          // Guest user doesn't need a token
          if (DEBUG_AUTH) {
            console.log('[AUTH] No token, but found guest user');
          }
          setUser(storedUser);
          setHasValidToken(false);
        } else if (storedUser) {
          // We have a stored user but no token - this is invalid state
          // Clear the stored user and force re-login
          if (DEBUG_AUTH) {
            console.log('[AUTH] Stored user found but no token - clearing and requiring login');
          }
          await clearAuthStorage();
          setUser(null);
          setHasValidToken(false);
        } else {
          if (DEBUG_AUTH) {
            console.log('[AUTH] No token, no stored user');
          }
          setUser(null);
          setHasValidToken(false);
        }
        return;
      }

      // We have a token, validate it with the server
      if (DEBUG_AUTH) {
        console.log('[AUTH] Validating token with /api/user...');
      }
      
      // Cache-bust to avoid any intermediary caching of identity responses.
      const response = await apiRequest<User>(`/api/user?_=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        },
      });

      if (isStaleRequest()) {
        return;
      }
      
      if (DEBUG_AUTH) {
        console.log('[AUTH] Token valid, user:', response.id, response.username);
      }
      
      setUser(response);
      setHasValidToken(true);
      // Update stored user data
      await setStoredUser(response);
    } catch (error) {
      if (authRequestIdRef.current !== requestId) {
        return;
      }

      if (DEBUG_AUTH) {
        console.log('[AUTH] Token validation failed:', error);
      }
      // Token is invalid or expired, clear storage
      await clearAuthStorage();
      setUser(null);
      setHasValidToken(false);
    } finally {
      if (authRequestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  const loginWithToken = useCallback(async (token: string) => {
    try {
      if (!token) return false;
      setIsLoading(true);
      await setToken(token);
      setHasValidToken(true);
      // Validate token & populate user
      await fetchUser(token);
      return true;
    } catch (error) {
      console.error('[AUTH] loginWithToken failed:', error);
      return false;
    }
  }, [fetchUser]);

  // Deep link handler for mobile OAuth (e.g. tracklitmobile://auth?token=...)
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const token = getQueryParam(url, 'token');
      if (token) {
        await loginWithToken(token);
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => sub.remove();
  }, [loginWithToken]);

  // Initialize auth state on mount
  useEffect(() => {
    // Debug: Check what's in storage
    if (DEBUG_AUTH) {
      debugAuthStorage();
    }
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    if (DEBUG_AUTH) {
      console.log('[AUTH] Attempting login for:', usernameOrEmail);
    }
    
    try {
      const isEmail = usernameOrEmail.includes('@');
      const response = await apiRequest<LoginResponse>('/api/mobile/login', {
        method: 'POST',
        data: isEmail
          ? { email: usernameOrEmail, password }
          : { username: usernameOrEmail, password },
        skipAuth: true,
      });

      if (DEBUG_AUTH) {
        console.log('[AUTH] Login response:', {
          hasToken: !!response.token,
          userId: response.id,
          username: response.username,
        });
      }

      // Extract and store the token
      if (response.token) {
        await setToken(response.token);
        setHasValidToken(true);
        
        if (DEBUG_AUTH) {
          console.log('[AUTH] Token stored successfully');
        }
      } else {
        if (DEBUG_AUTH) {
          console.log('[AUTH] WARNING: No token in login response!');
        }
        const errorMessage =
          (response as any)?.error ||
          (response as any)?.message ||
          'Invalid username or password. Please try again.';
        setHasValidToken(false);
        throw new Error(errorMessage);
      }

      // Store user data (without token in user object)
      const userData = { ...response } as any;
      delete userData.token;
      setUser(userData);
      await setStoredUser(userData);
      
      return true;
    } catch (error) {
      console.error('[AUTH] Login failed:', error);
      setHasValidToken(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    if (DEBUG_AUTH) {
      console.log('[AUTH] Attempting registration for:', data.username);
    }
    
    try {
      const response = await apiRequest<RegisterResponse>('/api/register', {
        method: 'POST',
        data,
        skipAuth: true, // Don't add auth header for register
      });

      if (DEBUG_AUTH) {
        console.log('[AUTH] Register response:', {
          hasToken: !!response.token,
          userId: response.user?.id,
        });
      }

      // Extract and store the token
      if (response.token) {
        await setToken(response.token);
        setHasValidToken(true);
      } else {
        setHasValidToken(false);
      }

      // Store user data (without token in user object)
      const userData = { ...(response.user as any) };
      delete userData.token;
      setUser(userData);
      await setStoredUser(userData);
      
      return true;
    } catch (error) {
      console.error('[AUTH] Registration failed:', error);
      setHasValidToken(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    if (DEBUG_AUTH) {
      console.log('[AUTH] Logging out...');
    }
    
    try {
      // Try to call logout endpoint (it's okay if this fails)
      await apiRequest('/api/logout', { method: 'POST', rawResponse: true });
    } catch (error) {
      console.log('[AUTH] Logout API call failed (non-critical):', error);
    } finally {
      // Always clear local auth state
      await clearAuthStorage();
      setUser(null);
      setHasValidToken(false);
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    if (DEBUG_AUTH) {
      console.log('[AUTH] Continuing as guest');
    }
    
    const guestUser = {
      id: 'guest',
      name: 'Guest User',
      username: 'guest',
    };
    
    setUser(guestUser);
    setHasValidToken(false);
    setStoredUser(guestUser);
  }, []);

  // isAuthenticated is true if we have a user (including guest)
  // hasValidToken is true only if we have a valid JWT token
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        hasValidToken,
        login,
        loginWithToken,
        register,
        logout,
        continueAsGuest,
        refreshUser: fetchUser,
        setUserAndPersist,
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
