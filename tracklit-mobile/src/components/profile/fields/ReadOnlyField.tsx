import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { spacing, borderRadius } from '@/utils/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

interface ReadOnlyFieldProps {
  label: string;
  value?: string | null;
  placeholder?: string;
}

export const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ label, value, placeholder }) => {
  const { styles } = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text variant="body" weight="medium" color="foreground">
        {label}
      </Text>
      <View style={styles.input}>
        <Text variant="body" color={value ? 'foreground' : 'muted'}>
          {value || placeholder || '—'}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: t.colors.card,
  },
});
