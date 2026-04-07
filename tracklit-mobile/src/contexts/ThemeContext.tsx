import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  darkColors,
  darkGradients,
  darkShadows,
  lightColors,
  lightGradients,
  lightShadows,
  type ThemeColors,
  type ThemeGradients,
  type ThemeShadows,
} from '@/utils/theme/colors';

// ---- Types ----

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export interface ThemeValues {
  colors: ThemeColors;
  gradients: ThemeGradients;
  shadows: ThemeShadows;
  /** Backward-compatible shortcut: gradient.background = gradients.background.colors */
  gradient: {
    background: string[];
    locations: number[];
  };
}

export interface ThemeContextType {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  theme: ThemeValues;
  setMode: (mode: ThemeMode) => void;
}

// ---- Storage ----

const STORAGE_KEY = '@tracklit/theme-mode';

// ---- Helpers ----

function resolveTheme(
  mode: ThemeMode,
  systemScheme: ColorSchemeName,
): ResolvedTheme {
  if (mode === 'system') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }
  return mode;
}

function getThemeValues(resolved: ResolvedTheme): ThemeValues {
  const isDark = resolved === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const gradients = isDark ? darkGradients : lightGradients;
  const shadows = isDark ? darkShadows : lightShadows;
  return {
    colors,
    gradients,
    shadows,
    gradient: {
      background: gradients.background.colors,
      locations: gradients.background.locations,
    },
  };
}

// ---- Context ----

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );

  // Listen to OS appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const resolvedTheme = resolveTheme(mode, systemScheme);
  const isDark = resolvedTheme === 'dark';

  const themeValues = useMemo(
    () => getThemeValues(resolvedTheme),
    [resolvedTheme],
  );

  const value = useMemo<ThemeContextType>(
    () => ({ mode, resolvedTheme, isDark, theme: themeValues, setMode }),
    [mode, resolvedTheme, isDark, themeValues, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
