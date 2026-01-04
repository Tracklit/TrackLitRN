import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

interface ReadOnlyFieldProps {
  label: string;
  value?: string | null;
  placeholder?: string;
}

export const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ label, value, placeholder }) => {
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

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
  },
});

