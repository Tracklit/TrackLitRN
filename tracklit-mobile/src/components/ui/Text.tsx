import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import theme from '@/utils/theme';

interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'small';
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'destructive' | 'success' | 'warning' | 'foreground' | 'primary-foreground';
  weight?: 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
  center?: boolean;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  weight = 'regular',
  center = false,
  style,
  children,
  ...props
}) => {
  const textStyle = [
    styles.base,
    styles[variant],
    styles[color],
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
  base: {
    color: theme.colors.textPrimary,
  },
  
  // Variants
  h1: {
    fontSize: theme.typography.sizes['4xl'],
    lineHeight: theme.typography.sizes['4xl'] * theme.typography.lineHeights.tight,
  },
  h2: {
    fontSize: theme.typography.sizes['3xl'],
    lineHeight: theme.typography.sizes['3xl'] * theme.typography.lineHeights.tight,
  },
  h3: {
    fontSize: theme.typography.sizes['2xl'],
    lineHeight: theme.typography.sizes['2xl'] * theme.typography.lineHeights.tight,
  },
  h4: {
    fontSize: theme.typography.sizes.xl,
    lineHeight: theme.typography.sizes.xl * theme.typography.lineHeights.normal,
  },
  body: {
    fontSize: theme.typography.sizes.base,
    lineHeight: theme.typography.sizes.base * theme.typography.lineHeights.normal,
  },
  caption: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: theme.typography.sizes.sm * theme.typography.lineHeights.normal,
  },
  small: {
    fontSize: theme.typography.sizes.xs,
    lineHeight: theme.typography.sizes.xs * theme.typography.lineHeights.normal,
  },
  
  // Colors
  primary: {
    color: theme.colors.textPrimary,
  },
  secondary: {
    color: theme.colors.textSecondary,
  },
  muted: {
    color: theme.colors.textMuted,
  },
  accent: {
    color: theme.colors.accent,
  },
  destructive: {
    color: theme.colors.destructive,
  },
  success: {
    color: theme.colors.success,
  },
  warning: {
    color: theme.colors.warning,
  },
  foreground: {
    color: theme.colors.foreground,
  },
  'primary-foreground': {
    color: theme.colors.primaryForeground,
  },
  
  // Weights
  light: {
    fontWeight: theme.typography.weights.light,
  },
  regular: {
    fontWeight: theme.typography.weights.regular,
  },
  medium: {
    fontWeight: theme.typography.weights.medium,
  },
  semiBold: {
    fontWeight: theme.typography.weights.semiBold,
  },
  bold: {
    fontWeight: theme.typography.weights.bold,
  },
  extraBold: {
    fontWeight: theme.typography.weights.extraBold,
  },
  
  // Alignment
  center: {
    textAlign: 'center',
  },
});