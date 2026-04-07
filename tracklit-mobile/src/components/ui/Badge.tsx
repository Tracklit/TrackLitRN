import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
import { typography, spacing, borderRadius } from '@/utils/theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  style,
}) => {
  const { styles } = useThemedStyles(createStyles);

  const badgeStyle = [
    styles.base,
    styles[size],
    styles[variant],
    style,
  ];

  return (
    <View style={badgeStyle}>
      <Text
        variant="small"
        weight="medium"
        style={[styles.baseText, styles[`${variant}Text`]]}
      >
        {children}
      </Text>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  lg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  default: {
    backgroundColor: t.colors.primary,
  },
  secondary: {
    backgroundColor: t.colors.secondary,
  },
  destructive: {
    backgroundColor: t.colors.destructive,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  success: {
    backgroundColor: t.colors.success,
  },
  warning: {
    backgroundColor: t.colors.warning,
  },

  baseText: {
    fontSize: typography.sizes.xs,
  },
  defaultText: {
    color: t.colors.primaryForeground,
  },
  secondaryText: {
    color: t.colors.secondaryForeground,
  },
  destructiveText: {
    color: t.colors.destructiveForeground,
  },
  outlineText: {
    color: t.colors.foreground,
  },
  successText: {
    color: t.colors.destructiveForeground,
  },
  warningText: {
    color: t.colors.primaryForeground,
  },
});
