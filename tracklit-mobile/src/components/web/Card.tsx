import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import theme from '@/utils/theme';

type Tone = 'dark' | 'muted' | 'light';

interface WebCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  tone?: Tone;
  padding?: number;
}

export const WebCard: React.FC<WebCardProps> = ({
  children,
  style,
  tone = 'dark',
  padding = theme.spacing.lg,
}) => {
  const palette = tone === 'light'
    ? { bg: '#f8fafc', border: '#e2e8f0' }
    : tone === 'muted'
      ? { bg: '#111827', border: '#1f2937' }
      : { bg: '#0f172a', border: '#1f2937' };

  return (
    <View style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.border, padding }, style]}>
      {children}
    </View>
  );
};

export const WebCardSection: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({
  children,
  style,
}) => <View style={[{ gap: theme.spacing.sm }, style]}>{children}</View>;

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    ...theme.shadows.md,
    gap: theme.spacing.sm,
  },
});

