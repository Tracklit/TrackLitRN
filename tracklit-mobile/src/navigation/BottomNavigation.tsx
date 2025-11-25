import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/FontAwesome5';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import theme from '@/utils/theme';

type TabRoute = 'Home' | 'Practice' | 'Programs' | 'Feed' | 'Tools' | 'Profile';

interface NavItem {
  title: string;
  routeName: TabRoute;
  iconName?: string;
  key: string;
  isProfile?: boolean;
}

const navItems: NavItem[] = [
  {
    title: 'Home',
    routeName: 'Home',
    iconName: 'home',
    key: 'dashboard'
  },
  {
    title: 'Practice',
    routeName: 'Practice',
    iconName: 'calendar-alt',
    key: 'practice'
  },
  {
    title: 'Programs',
    routeName: 'Programs',
    iconName: 'book',
    key: 'programs'
  },
  {
    title: 'Feed',
    routeName: 'Feed',
    iconName: 'newspaper',
    key: 'feed'
  },
  {
    title: 'Tools',
    routeName: 'Tools',
    iconName: 'tools',
    key: 'tools'
  },
  {
    title: 'Profile',
    routeName: 'Profile',
    key: 'profile',
    isProfile: true
  }
];

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
  userName?: string;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({
  item,
  isActive,
  onPress,
  onLongPress,
  userName,
}) => {
  const contentColor = isActive ? theme.colors.accent : theme.colors.textSecondary;
  const initials = userName ? userName.slice(0, 2).toUpperCase() : undefined;

  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {item.isProfile ? (
          <Avatar
            size="sm"
            fallback={initials}
            style={[
              styles.profileAvatar,
              isActive ? styles.profileAvatarActive : undefined,
            ]}
          />
        ) : (
          <Icon
            name={item.iconName as string}
            size={theme.iconSizes.md}
            color={contentColor}
            solid
          />
        )}
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
  const { user } = useAuth();

  return (
    <View style={[
      styles.container,
      { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }
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
              userName={user?.name ?? undefined}
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
    backgroundColor: 'rgba(15, 20, 25, 0.95)',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navBar: {
    flexDirection: 'row',
    height: theme.layout.bottomNavHeight,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  navLabel: {
    fontSize: 8,
    fontWeight: theme.typography.weights.medium,
    textAlign: 'center',
    lineHeight: 10,
  },
  profileAvatar: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  profileAvatarActive: {
    borderColor: theme.colors.accent,
  },
});