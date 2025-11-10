import React from 'react';
import {
  TouchableOpacity,
  Text as RNText,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import theme from '@/utils/theme';

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'default';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
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

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...theme.shadows.sm,
  },
  
  // Sizes
  sm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 32,
  },
  md: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 40,
  },
  lg: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.lg,
    minHeight: 48,
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
  },
  default: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  destructive: {
    backgroundColor: theme.colors.destructive,
    borderWidth: 0,
  },
  
  // Text styles
  baseText: {
    fontWeight: theme.typography.weights.medium,
    textAlign: 'center',
  },
  smText: {
    fontSize: theme.typography.sizes.sm,
  },
  mdText: {
    fontSize: theme.typography.sizes.base,
  },
  lgText: {
    fontSize: theme.typography.sizes.lg,
  },
  
  // Text variants
  primaryText: {
    color: theme.colors.primaryForeground,
  },
  defaultText: {
    color: theme.colors.primaryForeground,
  },
  secondaryText: {
    color: theme.colors.secondaryForeground,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  ghostText: {
    color: theme.colors.primary,
  },
  destructiveText: {
    color: theme.colors.destructiveForeground,
  },
  
  // Disabled states
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});