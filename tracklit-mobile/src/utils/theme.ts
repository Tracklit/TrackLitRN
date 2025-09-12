// TrackLit React Native Theme System - Exact replica of web design
// Based on HSL color values from the web application

export const colors = {
  // Primary colors - exact HSL values from web app
  primary: '#F5C842', // hsl(45, 93%, 58%) - Gold
  primaryForeground: '#000000', // hsl(0, 0%, 0%)
  secondary: '#E2994B', // hsl(38, 92%, 50%) - Deep gold  
  secondaryForeground: '#000000', // hsl(0, 0%, 0%)
  accent: '#F5C842', // hsl(45, 93%, 58%) - Gold
  accentForeground: '#000000', // hsl(0, 0%, 0%)
  
  // Background colors - dark theme
  background: 'transparent', // Allows gradient to show through
  backgroundSolid: '#1a1a2e', // Fallback solid color
  foreground: '#F2F2F2', // hsl(0, 0%, 95%)
  
  // Card and surface colors with opacity
  card: 'rgba(37, 42, 52, 0.8)', // hsl(220, 25%, 15%) with 80% opacity
  cardForeground: '#F2F2F2', // hsl(0, 0%, 95%)
  cardSolid: '#252A34', // Solid version for when opacity isn't supported
  
  // Muted colors
  muted: 'rgba(47, 57, 77, 0.8)', // hsl(220, 25%, 15%)
  mutedForeground: '#A6A6A6', // hsl(220, 5%, 65%)
  
  // Border and input colors
  border: '#334155', // hsl(220, 20%, 20%)
  input: '#334155', // hsl(220, 20%, 20%)
  ring: '#F5C842', // hsl(45, 93%, 58%) - Gold
  
  // Status colors
  destructive: '#E53935', // hsl(0, 70%, 50%)
  destructiveForeground: '#F2F2F2', // hsl(0, 0%, 95%)
  success: '#4CAF50', // hsl(142, 71%, 45%)
  warning: '#FF9800', // hsl(36, 93%, 54%)
  
  // Popover colors
  popover: 'rgba(26, 32, 44, 0.95)', // hsl(220, 30%, 10%) with 95% opacity
  popoverForeground: '#F2F2F2', // hsl(0, 0%, 95%)
  
  // Sidebar colors
  sidebar: 'rgba(21, 26, 35, 0.9)', // hsl(220, 30%, 8%) with 90% opacity
  sidebarForeground: '#F2F2F2', // hsl(0, 0%, 95%)
  sidebarPrimary: '#F5C842', // hsl(45, 93%, 58%) - Gold
  sidebarPrimaryForeground: '#000000', // hsl(0, 0%, 0%)
  sidebarAccent: '#F5C842', // hsl(45, 93%, 58%) - Gold
  sidebarAccentForeground: '#000000', // hsl(0, 0%, 0%)
  sidebarBorder: '#475569', // hsl(220, 20%, 20%)
  
  // Chart colors
  chart1: '#A855F7', // hsl(280, 85%, 65%)
  chart2: '#7C3AED', // hsl(260, 70%, 50%)
  chart3: '#C084FC', // hsl(300, 70%, 60%)
  chart4: '#8B5CF6', // hsl(250, 80%, 55%)
  chart5: '#A78BFA', // hsl(290, 75%, 50%)
  
  // Specific theme colors from web app
  darkNavy: '#0F1419', // hsl(220, 30%, 6%)
  darkGray: '#202634', // hsl(220, 20%, 15%)
  lightGray: '#2D3748', // hsl(220, 15%, 20%)
  
  // Text colors
  textPrimary: '#F2F2F2',
  textSecondary: '#A6A6A6',
  textMuted: '#7A7A7A',
};

// Gradient background - exact replica from web app
export const gradients = {
  background: {
    colors: ['#000000', '#1a1a2e', '#16213e', '#4a148c', '#7b1fa2'],
    locations: [0, 0.5, 0.7, 0.9, 1.0],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  },
  // Gradient for cards
  cardGradient: {
    colors: ['rgba(37, 42, 52, 0.9)', 'rgba(26, 32, 44, 0.8)'],
    locations: [0, 1],
    start: {x: 0, y: 0},
    end: {x: 1, y: 1},
  }
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
  sm: 4, // calc(--radius - 4px)
  md: 6, // calc(--radius - 2px)
  lg: 8, // var(--radius) - main radius used throughout app
  xl: 12,
  round: 9999, // fully rounded
};

// Typography system
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
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
  }
};

// Shadow system - matching web app shadow styles
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Increased from default for better visibility
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 25,
  },
};

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
  bottomNavHeight: 80, // Matching web app bottom nav
  tabBarHeight: 50,
  maxContentWidth: 1200,
};

export default {
  colors,
  gradients,
  spacing,
  borderRadius,
  typography,
  shadows,
  iconSizes,
  layout,
};