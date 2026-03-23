import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@tracklit_auth_token';
const USER_KEY = '@tracklit_user';
const PROFILE_KEY = '@tracklit_profile_fields';

const DEBUG_TOKEN = __DEV__;

/**
 * Get the stored authentication token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (DEBUG_TOKEN) {
      console.log('[TOKEN] getToken:', token ? `${token.substring(0, 30)}...` : 'null');
    }
    return token;
  } catch (error) {
    console.error('[TOKEN] Error getting token from storage:', error);
    return null;
  }
};

/**
 * Store the authentication token
 */
export const setToken = async (token: string): Promise<void> => {
  try {
    if (DEBUG_TOKEN) {
      console.log('[TOKEN] setToken:', token ? `${token.substring(0, 30)}...` : 'null');
    }
    await AsyncStorage.setItem(TOKEN_KEY, token);
    
    // Verify it was stored
    const stored = await AsyncStorage.getItem(TOKEN_KEY);
    if (DEBUG_TOKEN) {
      console.log('[TOKEN] Verified stored:', stored ? `${stored.substring(0, 30)}...` : 'null');
    }
  } catch (error) {
    console.error('[TOKEN] Error saving token to storage:', error);
    throw error;
  }
};

/**
 * Clear the stored authentication token
 */
export const clearToken = async (): Promise<void> => {
  try {
    if (DEBUG_TOKEN) {
      console.log('[TOKEN] clearToken called');
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('[TOKEN] Error clearing token from storage:', error);
    throw error;
  }
};

/**
 * Get the stored user data
 */
export const getStoredUser = async (): Promise<any | null> => {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    if (DEBUG_TOKEN) {
      console.log('[TOKEN] getStoredUser:', user?.id || 'null');
    }
    return user;
  } catch (error) {
    console.error('[TOKEN] Error getting user from storage:', error);
    return null;
  }
};

/**
 * Store user data locally
 */
export const setStoredUser = async (user: any): Promise<void> => {
  try {
    if (DEBUG_TOKEN) {
      console.log('[TOKEN] setStoredUser:', user?.id || 'null');
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('[TOKEN] Error saving user to storage:', error);
    throw error;
  }
};

/**
 * Clear the stored user data
 */
export const clearStoredUser = async (): Promise<void> => {
  try {
    if (DEBUG_TOKEN) {
      console.log('[TOKEN] clearStoredUser called');
    }
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('[TOKEN] Error clearing user from storage:', error);
    throw error;
  }
};

/**
 * Clear all auth-related storage
 */
export const clearAuthStorage = async (): Promise<void> => {
  try {
    if (DEBUG_TOKEN) {
      console.log('[TOKEN] clearAuthStorage called');
    }
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  } catch (error) {
    console.error('[TOKEN] Error clearing auth storage:', error);
    throw error;
  }
};

export interface StoredProfileFields {
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  gender?: string | null;
}

/**
 * Persist athlete profile fields independently of auth session.
 * These survive logout so the user doesn't have to re-enter them.
 */
export const getProfileFields = async (): Promise<StoredProfileFields | null> => {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
};

export const setProfileFields = async (fields: StoredProfileFields): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(fields));
  } catch (error) {
    console.error('[TOKEN] Error saving profile fields:', error);
  }
};

/**
 * Debug helper to check all auth storage
 */
export const debugAuthStorage = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const userJson = await AsyncStorage.getItem(USER_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    
    console.log('[TOKEN DEBUG] ================');
    console.log('[TOKEN DEBUG] Token exists:', !!token);
    console.log('[TOKEN DEBUG] Token preview:', token ? `${token.substring(0, 40)}...` : 'null');
    console.log('[TOKEN DEBUG] User:', user ? { id: user.id, username: user.username } : 'null');
    console.log('[TOKEN DEBUG] ================');
  } catch (error) {
    console.error('[TOKEN DEBUG] Error:', error);
  }
};
