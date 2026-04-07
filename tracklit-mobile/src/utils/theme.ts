// TrackLit React Native Theme System
// Re-exports dark palette as static default for backward compatibility.
// Migrated code should use useTheme() from @/contexts/ThemeContext instead.

import {
  darkColors,
  darkGradients,
  darkShadows,
  type ThemeColors,
  type ThemeGradients,
  type ThemeShadows,
} from './theme/colors';

// Re-export types for convenience
export type { ThemeColors, ThemeGradients, ThemeShadows };

// Static color exports -- backward-compatible, used by unmigrated code.
// After migration is complete these can be removed.
export const colors = darkColors;
export const gradients = darkGradients;

// Backward-compatible alias for existing screens that use theme.gradient
export const gradient = {
  background: darkGradients.background.colors,
  locations: darkGradients.background.locations,
};

// Spacing system - consistent with web app (8px base unit)
export const spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  xxxxl: 32,
  massive: 48,
  container: 16,
};

// Border radius - exact from web app (--radius: 0.5rem = 8px)
export const borderRadius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  round: 9999,
  webCard: 6,
};

// Typography system
export const typography = {
  sizes: {
    xs: 13,
    sm: 15,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Shadow system - static export for backward compatibility
export const shadows = darkShadows;

// Icon sizes
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Layout dimensions
export const layout = {
  headerHeight: 60,
  bottomNavHeight: 80,
  tabBarHeight: 50,
  maxContentWidth: 1200,
};

export default {
  colors,
  gradients,
  gradient,
  spacing,
  borderRadius,
  typography,
  shadows,
  iconSizes,
  layout,
};
