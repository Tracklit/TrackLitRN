import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { spacing, borderRadius } from '@/utils/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

type Props = {
  visible: boolean;
  label?: string;
};

export const InlineRefreshHeader: React.FC<Props> = ({
  visible,
  label = 'Refreshing...',
}) => {
  const { styles, theme } = useThemedStyles(createStyles);

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

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: t.colors.overlaySubtle,
    borderWidth: 1,
    borderColor: t.colors.border,
    marginBottom: spacing.sm,
  },
  label: {
    marginTop: 1,
  },
});
