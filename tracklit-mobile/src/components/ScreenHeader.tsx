import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { List } from 'phosphor-react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';

import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  containerStyle?: ViewStyle;
};

export const ScreenHeader: React.FC<Props> = ({ title, subtitle, right, containerStyle }) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={styles.sideButton}
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        activeOpacity={0.8}
      >
        <List size={20} color={theme.colors.foreground} weight="bold" />
      </TouchableOpacity>

      <View style={styles.center}>
        {title ? (
          <Text variant="body" weight="semiBold" color="foreground" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="small" color="muted" style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightContainer}>
        {right ?? null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    minHeight: 72,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  center: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
