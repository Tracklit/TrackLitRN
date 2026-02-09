import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

type Props = {
  visible: boolean;
  label?: string;
};

export const InlineRefreshHeader: React.FC<Props> = ({
  visible,
  label = 'Refreshing...',
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <ActivityIndicator size="small" color={theme.colors.foreground} />
      <Text variant="small" color="muted" style={styles.label}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  label: {
    marginTop: 1,
  },
});
