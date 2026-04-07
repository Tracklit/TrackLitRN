import React from 'react';
import {
  TouchableOpacity,
  Text as RNText,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
import { typography, spacing, borderRadius } from '@/utils/theme';

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'default';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const { styles, theme } = useThemedStyles(createStyles);

  const buttonStyle = [
    styles.base,
    styles[size],
    styles[variant],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.baseText,
    styles[`${size}Text`],
    styles[`${variant}Text`],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];

  const content = loading ? (
    <ActivityIndicator
      color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.primaryForeground}
      size="small"
    />
  ) : (
    children !== undefined
      ? (typeof children === 'string' || typeof children === 'number'
          ? <RNText style={textStyleCombined}>{children}</RNText>
          : children)
      : <RNText style={textStyleCombined}>{title}</RNText>
  );

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...t.shadows.sm,
  },

  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    minHeight: 48,
  },

  primary: {
    backgroundColor: t.colors.primary,
    borderWidth: 0,
  },
  default: {
    backgroundColor: t.colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: t.colors.secondary,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: t.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  destructive: {
    backgroundColor: t.colors.destructive,
    borderWidth: 0,
  },

  baseText: {
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  smText: {
    fontSize: typography.sizes.sm,
  },
  mdText: {
    fontSize: typography.sizes.base,
  },
  lgText: {
    fontSize: typography.sizes.lg,
  },

  primaryText: {
    color: t.colors.primaryForeground,
  },
  defaultText: {
    color: t.colors.primaryForeground,
  },
  secondaryText: {
    color: t.colors.secondaryForeground,
  },
  outlineText: {
    color: t.colors.primary,
  },
  ghostText: {
    color: t.colors.primary,
  },
  destructiveText: {
    color: t.colors.destructiveForeground,
  },

  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});
