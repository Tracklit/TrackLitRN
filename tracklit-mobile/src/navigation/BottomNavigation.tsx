import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import theme from '@/utils/theme';

interface NavItem {
  title: string;
  routeName: string;
  iconName: string;
  key: string;
}

interface BottomNavigationProps {
  currentRoute: string;
  onNavigate: (routeName: string) => void;
}

// Navigation items - exact replica from web app
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
    title: 'Race',
    routeName: 'Race',
    iconName: 'trophy',
    key: 'race'
  },
  {
    title: 'Tools',
    routeName: 'Tools',
    iconName: 'tools',
    key: 'tools'
  },
  {
    title: 'Sprinthia',
    routeName: 'Sprinthia',
    iconName: 'robot',
    key: 'sprinthia'
  }
];

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({
  item,
  isActive,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {item.key === 'sprinthia' ? (
          <View style={[
            styles.aiIcon,
            { backgroundColor: isActive ? theme.colors.accent : 'transparent' }
          ]}>
            <Text style={[
              styles.aiText,
              { color: isActive ? theme.colors.accentForeground : theme.colors.textSecondary }
            ]}>
              AI
            </Text>
          </View>
        ) : (
          <Icon
            name={item.iconName}
            size={theme.iconSizes.md}
            color={isActive ? theme.colors.accent : theme.colors.textSecondary}
            solid={isActive}
          />
        )}
      </View>
      <Text style={[
        styles.navLabel,
        { color: isActive ? theme.colors.accent : theme.colors.textSecondary }
      ]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.container,
      { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }
    ]}>
      <View style={styles.navBar}>
        {navItems.map((item) => (
          <NavItemComponent
            key={item.key}
            item={item}
            isActive={currentRoute === item.routeName}
            onPress={() => onNavigate(item.routeName)}
          />
        ))}
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
    backgroundColor: 'rgba(15, 20, 25, 0.95)', // Dark navy with opacity
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
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'currentColor',
  },
  aiText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
  },
  navLabel: {
    fontSize: 8, // Very small like web app
    fontWeight: theme.typography.weights.medium,
    textAlign: 'center',
    lineHeight: 10,
  },
});