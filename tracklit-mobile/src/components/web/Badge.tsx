import React from 'react';
import { View, StyleSheet, Text as RNText, ViewStyle } from 'react-native';
import theme from '@/utils/theme';

type Variant = 'default' | 'secondary' | 'outline' | 'success' | 'warning';

interface WebBadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  style?: ViewStyle;
}

export const WebBadge: React.FC<WebBadgeProps> = ({ children, variant = 'default', style }) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <RNText style={[styles.text, styles[`${variant}Text`]]}>{children}</RNText>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium as any,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  default: { backgroundColor: '#1f2937' },
  defaultText: { color: '#f8fafc' },
  secondary: { backgroundColor: '#e2e8f0' },
  secondaryText: { color: '#0f172a' },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  outlineText: { color: theme.colors.foreground },
  success: { backgroundColor: '#16a34a' },
  successText: { color: '#ecfeff' },
  warning: { backgroundColor: '#f59e0b' },
  warningText: { color: '#0f172a' },
});

