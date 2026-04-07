import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing, borderRadius } from '@/utils/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

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
  padding = spacing.lg,
}) => {
  const { styles, theme } = useThemedStyles(createStyles);

  const palette = tone === 'light'
    ? { bg: theme.colors.backgroundSolid, border: theme.colors.border }
    : tone === 'muted'
      ? { bg: theme.colors.darkNavy, border: theme.colors.darkGray }
      : { bg: theme.colors.webChatBackground, border: theme.colors.darkGray };

  return (
    <View style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.border, padding }, style]}>
      {children}
    </View>
  );
};

export const WebCardSection: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({
  children,
  style,
}) => <View style={[{ gap: spacing.sm }, style]}>{children}</View>;

const createStyles = (t: ThemeValues) => StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...t.shadows.md,
    gap: spacing.sm,
  },
});
