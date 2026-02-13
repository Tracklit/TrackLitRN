import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  House,
  CalendarBlank,
  BookOpen,
  Newspaper,
  Wrench,
  UserCircle,
} from 'phosphor-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useAuth } from '@/contexts/AuthContext';
import theme from '@/utils/theme';

type TabRoute = 'Home' | 'Practice' | 'Programs' | 'Feed' | 'Tools' | 'Profile';

interface NavItem {
  title: string;
  routeName: TabRoute;
  key: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string; weight?: string }>;
}

const navItems: NavItem[] = [
  {
    title: 'Home',
    routeName: 'Home',
    key: 'dashboard',
    IconComponent: House,
  },
  {
    title: 'Practice',
    routeName: 'Practice',
    key: 'practice',
    IconComponent: CalendarBlank,
  },
  {
    title: 'Programs',
    routeName: 'Programs',
    key: 'programs',
    IconComponent: BookOpen,
  },
  {
    title: 'Feed',
    routeName: 'Feed',
    key: 'feed',
    IconComponent: Newspaper,
  },
  {
    title: 'Tools',
    routeName: 'Tools',
    key: 'tools',
    IconComponent: Wrench,
  },
  {
    title: 'Profile',
    routeName: 'Profile',
    key: 'profile',
    IconComponent: UserCircle,
  },
];

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({
  item,
  isActive,
  onPress,
  onLongPress,
}) => {
  const contentColor = isActive ? theme.colors.accent : theme.colors.textSecondary;
  const IconComp = item.IconComponent;

  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <IconComp
          size={20}
          color={contentColor}
          weight="fill"
        />
      </View>
      <Text style={[
        styles.navLabel,
        { color: contentColor }
      ]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
};

export const BottomNavigation: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const parent = navigation.getParent();
  const parentState = parent?.getState();
  const parentRoute = parentState?.routes[parentState.index ?? 0];

  if (parentRoute?.name && parentRoute.name !== 'MainTabs') {
    return null;
  }

  return (
    <View style={[
      styles.container,
      { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }
    ]}>
      <View style={styles.navBar}>
        {navItems.map((item) => {
          const route = state.routes.find((r) => r.name === item.routeName);
          const isActive = state.routeNames[state.index] === item.routeName;

          const handlePress = () => {
            if (!route) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(item.routeName);
            }
          };

          const handleLongPress = () => {
            if (!route) return;
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <NavItemComponent
              key={item.key}
              item={item}
              isActive={isActive}
              onPress={handlePress}
              onLongPress={handleLongPress}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  navBar: {
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 8,
    fontWeight: theme.typography.weights.medium,
    textAlign: 'center',
    lineHeight: 10,
  },
});
