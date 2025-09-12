import React from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Text } from './Text';
import theme from '@/utils/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  variant?: 'default' | 'filled';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  variant = 'default',
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="caption" weight="medium" style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.base,
          styles[variant],
          error && styles.error,
          inputStyle,
          style,
        ]}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        {...props}
      />
      {error && (
        <Text variant="small" color="destructive" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.foreground,
  },
  base: {
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  default: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filled: {
    backgroundColor: theme.colors.muted,
    borderWidth: 0,
  },
  error: {
    borderColor: theme.colors.destructive,
  },
  errorText: {
    marginTop: theme.spacing.xs,
  },
});