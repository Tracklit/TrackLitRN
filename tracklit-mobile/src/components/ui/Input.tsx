import React, { useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Eye, EyeSlash } from 'phosphor-react-native';
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
  secureTextEntry,
  ...props
}) => {
  const variantStyle = variant === 'filled' ? styles.filled : styles.default;
  const [hidden, setHidden] = useState(true);
  const isPassword = secureTextEntry !== undefined && secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="caption" weight="medium" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.base,
            variantStyle,
            error ? styles.error : undefined,
            isPassword ? styles.inputWithIcon : undefined,
            inputStyle,
            style,
          ]}
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          secureTextEntry={isPassword ? hidden : false}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setHidden((v) => !v)}
            style={styles.eyeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.6}
          >
            {hidden ? (
              <EyeSlash size={18} color={theme.colors.textMuted} weight="fill" />
            ) : (
              <Eye size={18} color={theme.colors.foreground} weight="fill" />
            )}
          </TouchableOpacity>
        )}
      </View>
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
  inputRow: {
    position: 'relative',
  },
  base: {
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  inputWithIcon: {
    paddingRight: 48,
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
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
});
