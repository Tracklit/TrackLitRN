import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

interface WebPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export const WebPageHeader: React.FC<WebPageHeaderProps> = ({ title, description, action, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <Text variant="h3" weight="bold" color="foreground">
          {title}
        </Text>
        {description ? (
          <Text variant="body" color="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
});

