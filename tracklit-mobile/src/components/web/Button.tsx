import React from 'react';
import { Pressable, StyleSheet, Text as RNText, ViewStyle } from 'react-native';
import { spacing, borderRadius, typography } from '@/utils/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

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
  const { styles } = useThemedStyles(createStyles);

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

const createStyles = (t: ThemeValues) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },

  textBase: {
    fontWeight: typography.weights.semiBold as any,
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  smText: { fontSize: typography.sizes.sm },
  mdText: { fontSize: typography.sizes.base },
  lgText: { fontSize: typography.sizes.lg },

  default: { backgroundColor: t.colors.primary },
  secondary: { backgroundColor: t.colors.secondary },
  destructive: { backgroundColor: t.colors.destructive },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.colors.border },
  ghost: { backgroundColor: 'transparent' },

  defaultText: { color: t.colors.primaryForeground },
  secondaryText: { color: t.colors.secondaryForeground },
  destructiveText: { color: t.colors.destructiveForeground },
  outlineText: { color: t.colors.foreground },
  ghostText: { color: t.colors.foreground },

  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.99 }] },
});
