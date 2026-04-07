import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme, type ThemeValues } from '@/contexts/ThemeContext';
import { typography } from '@/utils/theme';

interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'small';
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'destructive' | 'success' | 'warning' | 'foreground' | 'primary-foreground';
  weight?: 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
  center?: boolean;
  children: React.ReactNode;
}

const colorTokenMap: Record<NonNullable<TextProps['color']>, keyof ThemeValues['colors']> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  muted: 'textMuted',
  accent: 'accent',
  destructive: 'destructive',
  success: 'success',
  warning: 'warning',
  foreground: 'foreground',
  'primary-foreground': 'primaryForeground',
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  weight = 'regular',
  center = false,
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const textStyle = [
    { color: theme.colors[colorTokenMap[color]] },
    styles[variant],
    styles[weight],
    center && styles.center,
    style,
  ];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: typography.sizes['4xl'],
    lineHeight: Math.ceil(typography.sizes['4xl'] * typography.lineHeights.tight),
  },
  h2: {
    fontSize: typography.sizes['3xl'],
    lineHeight: Math.ceil(typography.sizes['3xl'] * typography.lineHeights.tight),
  },
  h3: {
    fontSize: typography.sizes['2xl'],
    lineHeight: Math.ceil(typography.sizes['2xl'] * typography.lineHeights.tight),
  },
  h4: {
    fontSize: typography.sizes.xl,
    lineHeight: Math.ceil(typography.sizes.xl * typography.lineHeights.normal),
  },
  body: {
    fontSize: typography.sizes.base,
    lineHeight: Math.ceil(typography.sizes.base * typography.lineHeights.normal),
  },
  caption: {
    fontSize: typography.sizes.sm,
    lineHeight: Math.ceil(typography.sizes.sm * typography.lineHeights.normal),
  },
  small: {
    fontSize: typography.sizes.xs,
    lineHeight: Math.ceil(typography.sizes.xs * typography.lineHeights.normal),
  },

  light: {
    fontWeight: typography.weights.light,
  },
  regular: {
    fontWeight: typography.weights.regular,
  },
  medium: {
    fontWeight: typography.weights.medium,
  },
  semiBold: {
    fontWeight: typography.weights.semiBold,
  },
  bold: {
    fontWeight: typography.weights.bold,
  },
  extraBold: {
    fontWeight: typography.weights.extraBold,
  },

  center: {
    textAlign: 'center',
  },
});
