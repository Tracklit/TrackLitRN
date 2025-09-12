import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import theme from '@/utils/theme';

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

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  
  // Sizes
  sm: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  md: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  lg: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  
  // Variants
  default: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  destructive: {
    backgroundColor: theme.colors.destructive,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  success: {
    backgroundColor: theme.colors.success,
  },
  warning: {
    backgroundColor: theme.colors.warning,
  },
  
  // Text styles
  baseText: {
    fontSize: theme.typography.sizes.xs,
  },
  defaultText: {
    color: theme.colors.primaryForeground,
  },
  secondaryText: {
    color: theme.colors.secondaryForeground,
  },
  destructiveText: {
    color: theme.colors.destructiveForeground,
  },
  outlineText: {
    color: theme.colors.foreground,
  },
  successText: {
    color: theme.colors.destructiveForeground,
  },
  warningText: {
    color: theme.colors.primaryForeground,
  },
});