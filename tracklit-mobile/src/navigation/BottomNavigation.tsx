import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import {
  House,
  Barbell,
  ChatCircleDots,
  Newspaper,
  Timer,
  Target,
  type Icon,
} from 'phosphor-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import theme from '@/utils/theme';

type TabRoute = 'Home' | 'Training' | 'CoachDashboard' | 'Feed' | 'Tools' | 'Sprinthia';

interface NavItem {
  title: string;
  key: string;
  IconComponent: Icon;
  routeName: TabRoute;
}

const BASE_NAV_ITEMS: NavItem[] = [
  { title: 'Home',      routeName: 'Home',      key: 'dashboard', IconComponent: House },
  { title: 'Training',  routeName: 'Training',  key: 'training',  IconComponent: Barbell },
  { title: 'Feed',      routeName: 'Feed',      key: 'feed',      IconComponent: Newspaper },
  { title: 'Tools',     routeName: 'Tools',     key: 'tools',     IconComponent: Timer },
  { title: 'Aria',      routeName: 'Sprinthia', key: 'sprinthia', IconComponent: ChatCircleDots },
];

const COACH_NAV_ITEM: NavItem = {
  title: "Coach's",
  routeName: 'CoachDashboard',
  key: 'coach-dashboard',
  IconComponent: Target,
};

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
  showBadge?: boolean;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({
  item,
  isActive,
  onPress,
  onLongPress,
  showBadge,
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
        <IconComp size={23} color={contentColor} weight="fill" />
        {showBadge && <View style={styles.badge} />}
      </View>
      <Text style={[styles.navLabel, { color: contentColor }]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
};

interface FeedPostSummary {
  createdAt: string;
}

export const BottomNavigation: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isCoach = (user as any)?.isCoach === true;

  const parent = navigation.getParent();
  const parentState = parent?.getState();
  const parentRoute = parentState?.routes[parentState.index ?? 0];

  const [hasNewFeedPosts, setHasNewFeedPosts] = useState(false);
  const isFeedActive = state.routeNames[state.index] === 'Feed';

  const navItems = useMemo<NavItem[]>(() => {
    if (isCoach) {
      return BASE_NAV_ITEMS.map((item) =>
        item.routeName === 'Training' ? COACH_NAV_ITEM : item
      );
    }
    return BASE_NAV_ITEMS;
  }, [isCoach]);

  const feedCheckQuery = useQuery({
    queryKey: ['feed-badge-check'],
    queryFn: async () => {
      try {
        const data = await apiRequest<FeedPostSummary[]>('/api/feed?filter=all');
        return data && data.length > 0 ? data : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  useEffect(() => {
    const checkNew = async () => {
      const posts = feedCheckQuery.data;
      if (!posts || posts.length === 0) {
        setHasNewFeedPosts(false);
        return;
      }
      const lastSeen = await AsyncStorage.getItem('feed_last_seen');
      if (!lastSeen) {
        setHasNewFeedPosts(true);
        return;
      }
      const lastSeenTime = Number(lastSeen);
      const latestPostTime = Math.max(...posts.map(p => new Date(p.createdAt).getTime()));
      setHasNewFeedPosts(latestPostTime > lastSeenTime);
    };
    checkNew();
  }, [feedCheckQuery.data]);

  useEffect(() => {
    if (isFeedActive) {
      setHasNewFeedPosts(false);
    }
  }, [isFeedActive]);

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
          const isActive = state.routeNames[state.index] === item.routeName;

          const handlePress = () => {
            const route = state.routes.find((r) => r.name === item.routeName);
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
            const route = state.routes.find((r) => r.name === item.routeName);
            if (!route) return;
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <NavItemComponent
              key={item.key}
              item={item}
              isActive={isActive}
              onPress={handlePress}
              onLongPress={handleLongPress}
              showBadge={item.routeName === 'Feed' && hasNewFeedPosts && !isActive}
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
    bottom: -15,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 15,
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
    position: 'relative' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  navLabel: {
    fontSize: 8,
    fontWeight: theme.typography.weights.medium,
    textAlign: 'center',
    lineHeight: 10,
  },
});
