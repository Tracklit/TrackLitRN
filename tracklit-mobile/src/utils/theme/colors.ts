// Theme color palettes for dark and light modes

// ---- Types ----

export type ThemeColors = {
  // Primary brand colors
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  deepGold: string;
  accent: string;
  accentForeground: string;

  // Backgrounds
  background: string;
  backgroundSolid: string;
  foreground: string;

  // Card / surface
  card: string;
  cardForeground: string;
  cardSolid: string;

  // Muted
  muted: string;
  mutedForeground: string;

  // Border / input
  border: string;
  input: string;
  ring: string;

  // Status
  destructive: string;
  destructiveForeground: string;
  success: string;
  warning: string;

  // Popover
  popover: string;
  popoverForeground: string;

  // Sidebar
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;

  // Chart
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;

  // Named grays
  darkNavy: string;
  darkGray: string;
  lightGray: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Web parity
  webPurpleStart: string;
  webPurpleEnd: string;
  webBlueStart: string;
  webIndigoDeep: string;
  webNotificationBackground: string;
  webChatBackground: string;
  webCardBorder: string;
  webBorderLight: string;

  // Brand accent (used in 47+ files)
  brandOrange: string;
  brandOrangeLight: string;

  // Overlay tokens (replaces hardcoded rgba(255,255,255,...))
  overlaySubtle: string;
  overlayLight: string;
  overlayMedium: string;
  overlayHeavy: string;
};

export type GradientDef = {
  colors: string[];
  locations: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

export type ThemeGradients = {
  background: GradientDef;
  cardGradient: GradientDef;
  webPurple: GradientDef;
  webPurpleDeep: GradientDef;
  webHeader: GradientDef;
};

export type ThemeShadows = {
  none: ShadowDef;
  sm: ShadowDef;
  md: ShadowDef;
  lg: ShadowDef;
  xl: ShadowDef;
  webCard: ShadowDef;
};

type ShadowDef = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

// ---- Dark Palette ----

export const darkColors: ThemeColors = {
  primary: '#5b21b6',
  primaryForeground: '#FFFFFF',
  secondary: '#7c3aed',
  secondaryForeground: '#FFFFFF',
  deepGold: '#7c3aed',
  accent: '#7c3aed',
  accentForeground: '#FFFFFF',

  background: 'transparent',
  backgroundSolid: '#1a1a2e',
  foreground: '#F2F2F2',

  card: 'rgba(37, 42, 52, 0.8)',
  cardForeground: '#F2F2F2',
  cardSolid: '#252A34',

  muted: 'rgba(47, 57, 77, 0.8)',
  mutedForeground: '#A6A6A6',

  border: '#334155',
  input: '#334155',
  ring: '#7c3aed',

  destructive: '#E53935',
  destructiveForeground: '#F2F2F2',
  success: '#4CAF50',
  warning: '#FF9800',

  popover: 'rgba(26, 32, 44, 0.95)',
  popoverForeground: '#F2F2F2',

  sidebar: '#151a23',
  sidebarForeground: '#F2F2F2',
  sidebarPrimary: '#5b21b6',
  sidebarPrimaryForeground: '#FFFFFF',
  sidebarAccent: '#7c3aed',
  sidebarAccentForeground: '#FFFFFF',
  sidebarBorder: '#475569',

  chart1: '#A855F7',
  chart2: '#7C3AED',
  chart3: '#C084FC',
  chart4: '#8B5CF6',
  chart5: '#A78BFA',

  darkNavy: '#0F1419',
  darkGray: '#202634',
  lightGray: '#2D3748',

  textPrimary: '#F2F2F2',
  textSecondary: '#A6A6A6',
  textMuted: '#7A7A7A',

  webPurpleStart: '#5b21b6',
  webPurpleEnd: '#7c3aed',
  webBlueStart: '#1e3a8a',
  webIndigoDeep: '#1e1b4b',
  webNotificationBackground: '#010a18',
  webChatBackground: '#0b1220',
  webCardBorder: 'rgba(168, 85, 247, 0.1)',
  webBorderLight: 'rgba(255, 255, 255, 0.1)',

  brandOrange: '#FF7A00',
  brandOrangeLight: 'rgba(255, 122, 0, 0.15)',

  overlaySubtle: 'rgba(255, 255, 255, 0.06)',
  overlayLight: 'rgba(255, 255, 255, 0.08)',
  overlayMedium: 'rgba(255, 255, 255, 0.12)',
  overlayHeavy: 'rgba(255, 255, 255, 0.20)',
};

// ---- Light Palette ----

export const lightColors: ThemeColors = {
  primary: '#5b21b6',
  primaryForeground: '#FFFFFF',
  secondary: '#7c3aed',
  secondaryForeground: '#FFFFFF',
  deepGold: '#7c3aed',
  accent: '#7c3aed',
  accentForeground: '#FFFFFF',

  background: 'transparent',
  backgroundSolid: '#F0EDF7',
  foreground: '#1A1625',

  card: '#FFFFFF',
  cardForeground: '#1A1625',
  cardSolid: '#FFFFFF',

  muted: '#E8E3F3',
  mutedForeground: '#564E6E',

  border: '#C4B8E0',
  input: '#C4B8E0',
  ring: '#7c3aed',

  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
  success: '#15803D',
  warning: '#9A4600',

  popover: 'rgba(255, 255, 255, 0.97)',
  popoverForeground: '#1A1625',

  sidebar: '#F3F0FF',
  sidebarForeground: '#1A1625',
  sidebarPrimary: '#5b21b6',
  sidebarPrimaryForeground: '#FFFFFF',
  sidebarAccent: '#7c3aed',
  sidebarAccentForeground: '#FFFFFF',
  sidebarBorder: '#C4B8E0',

  chart1: '#7E22CE',
  chart2: '#6D28D9',
  chart3: '#9333EA',
  chart4: '#7C3AED',
  chart5: '#8B5CF6',

  darkNavy: '#F8FAFC',
  darkGray: '#F1F5F9',
  lightGray: '#D6DBE5',

  textPrimary: '#1A1625',
  textSecondary: '#4A4361',
  textMuted: '#6B5F82',

  webPurpleStart: '#5b21b6',
  webPurpleEnd: '#7c3aed',
  webBlueStart: '#1e3a8a',
  webIndigoDeep: '#EEF2FF',
  webNotificationBackground: '#F8FAFC',
  webChatBackground: '#F1F5F9',
  webCardBorder: 'rgba(91, 33, 182, 0.20)',
  webBorderLight: 'rgba(26, 22, 37, 0.14)',

  brandOrange: '#C45D00',
  brandOrangeLight: 'rgba(196, 93, 0, 0.12)',

  overlaySubtle: 'rgba(0, 0, 0, 0.06)',
  overlayLight: 'rgba(0, 0, 0, 0.10)',
  overlayMedium: 'rgba(0, 0, 0, 0.14)',
  overlayHeavy: 'rgba(0, 0, 0, 0.22)',
};

// ---- Dark Gradients ----

export const darkGradients: ThemeGradients = {
  background: {
    colors: ['#000000', '#1a1a2e', '#16213e', '#4a148c', '#7b1fa2'],
    locations: [0, 0.5, 0.7, 0.9, 1.0],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  cardGradient: {
    colors: ['rgba(37, 42, 52, 0.9)', 'rgba(26, 32, 44, 0.8)'],
    locations: [0, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  webPurple: {
    colors: ['#5b21b6', '#7c3aed'],
    locations: [0, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  webPurpleDeep: {
    colors: ['#1e1b4b', '#581c87', '#1e3a8a'],
    locations: [0, 0.5, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  webHeader: {
    colors: ['rgba(91, 33, 182, 0.95)', 'rgba(124, 58, 237, 0.95)'],
    locations: [0, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// ---- Light Gradients ----

export const lightGradients: ThemeGradients = {
  background: {
    colors: ['#FFFFFF', '#F8F7FC', '#F3F0FF', '#EDE8FF', '#F8F7FC'],
    locations: [0, 0.5, 0.7, 0.9, 1.0],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  cardGradient: {
    colors: ['rgba(255, 255, 255, 0.95)', 'rgba(248, 247, 252, 0.9)'],
    locations: [0, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  webPurple: {
    colors: ['#7C3AED', '#A78BFA'],
    locations: [0, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  webPurpleDeep: {
    colors: ['#EDE9FE', '#C4B5FD', '#DBEAFE'],
    locations: [0, 0.5, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  webHeader: {
    colors: ['rgba(91, 33, 182, 0.95)', 'rgba(124, 58, 237, 0.95)'],
    locations: [0, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// ---- Shadows ----

export const darkShadows: ThemeShadows = {
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
    shadowOpacity: 0.2,
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
  webCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 12,
  },
};

export const lightShadows: ThemeShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#1A1625',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1625',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1625',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: '#1A1625',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  webCard: {
    shadowColor: '#1A1625',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};
