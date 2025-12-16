import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation, DrawerActions } from '@react-navigation/native';

import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  containerStyle?: ViewStyle;
};

/**
 * Simple, consistent top header for tab screens:
 * - Left: drawer hamburger (opens drawer)
 * - Center: title/subtitle
 * - Right: optional action slot (keeps spacing consistent)
 */
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
        <FontAwesome5 name="bars" size={18} color={theme.colors.foreground} solid />
      </TouchableOpacity>

      <View style={styles.center}>
        <Text variant="h3" weight="bold" color="foreground" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {!!subtitle && (
          <Text variant="body" color="muted" numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
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
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});


