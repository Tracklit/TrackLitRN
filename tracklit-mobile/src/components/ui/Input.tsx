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
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
import { typography, spacing, borderRadius } from '@/utils/theme';

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
  const { styles, theme } = useThemedStyles(createStyles);
  const variantStyle = variant === 'filled' ? styles.filled : styles.default;
  const [hidden, setHidden] = useState(true);
  const isPassword = secureTextEntry !== undefined && secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="caption" weight="medium" style={[styles.label, { color: theme.colors.foreground }]}>
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

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.sm,
  },
  inputRow: {
    position: 'relative',
  },
  base: {
    borderRadius: borderRadius.lg,
    fontSize: typography.sizes.base,
    color: t.colors.foreground,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  default: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  filled: {
    backgroundColor: t.colors.muted,
    borderWidth: 0,
  },
  error: {
    borderColor: t.colors.destructive,
  },
  errorText: {
    marginTop: spacing.xs,
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
