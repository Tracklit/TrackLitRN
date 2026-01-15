import React from 'react';
import { Pressable, StyleSheet, Text as RNText, ViewStyle } from 'react-native';
import theme from '@/utils/theme';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface WebButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
}

export const WebButton: React.FC<WebButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <RNText style={[styles.textBase, styles[`${variant}Text`], styles[`${size}Text`]]}>{children}</RNText>
      ) : (
        children
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  sm: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  md: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  lg: { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg },

  textBase: { fontWeight: theme.typography.weights.semiBold as any },
  smText: { fontSize: theme.typography.sizes.sm },
  mdText: { fontSize: theme.typography.sizes.base },
  lgText: { fontSize: theme.typography.sizes.lg },

  default: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.secondary },
  destructive: { backgroundColor: theme.colors.destructive },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  ghost: { backgroundColor: 'transparent' },

  defaultText: { color: theme.colors.primaryForeground },
  secondaryText: { color: theme.colors.secondaryForeground },
  destructiveText: { color: theme.colors.destructiveForeground },
  outlineText: { color: theme.colors.foreground },
  ghostText: { color: theme.colors.foreground },

  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.99 }] },
});

