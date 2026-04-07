import React from 'react';
import { View, StyleSheet, Text as RNText, ViewStyle } from 'react-native';
import { spacing, borderRadius, typography } from '@/utils/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

type Variant = 'default' | 'secondary' | 'outline' | 'success' | 'warning';

interface WebBadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  style?: ViewStyle;
}

export const WebBadge: React.FC<WebBadgeProps> = ({ children, variant = 'default', style }) => {
  const { styles } = useThemedStyles(createStyles);

  return (
    <View style={[styles.base, styles[variant], style]}>
      <RNText style={[styles.text, styles[`${variant}Text`]]}>{children}</RNText>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as any,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  default: { backgroundColor: t.colors.darkGray },
  defaultText: { color: t.colors.foreground },
  secondary: { backgroundColor: t.colors.lightGray },
  secondaryText: { color: t.colors.cardForeground },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.colors.border },
  outlineText: { color: t.colors.foreground },
  success: { backgroundColor: t.colors.success },
  successText: { color: t.colors.foreground },
  warning: { backgroundColor: t.colors.warning },
  warningText: { color: t.colors.cardForeground },
});
