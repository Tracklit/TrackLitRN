import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Icon from '@expo/vector-icons/FontAwesome5';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { LinearGradient } from '@/components/LinearGradient';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import { apiRequest } from '@/lib/api';
import theme from '../utils/theme';

interface HomeScreenProps {
  onNavigate?: (route: string) => void;
}
interface CategoryCard {
  title: string;
  description: string;
  iconName: string;
  route: string;
  disabled?: boolean;
  isSpecial?: boolean;
  showStar?: boolean;
}

type ActivityType =
  | 'workout'
  | 'journal_entry'
  | 'user_joined'
  | 'meet_created'
  | 'meet_results'
  | 'coach_status'
  | 'program_assigned'
  | 'group_joined'
  | string;

interface CommunityActivity {
  id: number;
  userId: number;
  activityType: ActivityType;
  title: string;
  description?: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    name: string;
    profileImageUrl?: string;
  };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();
  const [greeting, setGreeting] = useState('');
  const { user } = useAuth();
  const [tickerCollapsed, setTickerCollapsed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const userId = user?.id;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const activitiesQuery = useQuery<CommunityActivity[]>({
    queryKey: ['community-activities'],
    queryFn: () => apiRequest<CommunityActivity[]>('/api/community/activities'),
    refetchInterval: 30000,
    retry: false,
    staleTime: 60000,
    initialData: [
      {
        id: 1,
        userId: 1,
        activityType: 'workout',
        title: 'Sprint Training Complete',
        description: 'Finished 6x100m sprint session with excellent form',
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        user: { id: 1, username: 'speedster_pro', name: 'Alex R.' },
      },
      {
        id: 2,
        userId: 2,
        activityType: 'user_joined',
        title: 'New Athlete Joined',
        description: 'Welcome Sarah M. to the TrackLit community!',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        user: { id: 2, username: 'sarah_m_runner', name: 'Sarah M.' },
      },
      {
        id: 3,
        userId: 3,
        activityType: 'meet_created',
        title: 'Spring Championship Meet',
        description: 'New meet scheduled for April 15th at Metro Stadium',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        user: { id: 3, username: 'coach_jones', name: 'Coach Jones' },
      },
    ],
  });

  const activities = activitiesQuery.data ?? [];
  const currentActivity =
    activities.length > 0 ? activities[currentActivityIndex % activities.length] : undefined;

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-home'],
    queryFn: () => apiRequest<any[]>('/api/notifications'),
    staleTime: 30000,
    select: (data: any[] | undefined) =>
      (data || []).filter((n: any) => n.type !== 'message_received'),
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['friend-requests-pending'],
    queryFn: () => apiRequest<any[]>('/api/friend-requests/pending'),
    staleTime: 30000,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations-home'],
    queryFn: () => apiRequest<any[]>('/api/conversations'),
    staleTime: 30000,
    enabled: !!userId && userId !== 'guest',
  });

  const unreadNotifications =
    (notifications as any[]).filter((n) => !n.isRead).length + (pendingRequests as any[]).length;

  const unreadMessages =
    conversations && userId
      ? (conversations as any[]).filter(
          (conv) =>
            conv.lastMessage &&
            !conv.lastMessage.isRead &&
            conv.lastMessage.receiverId === userId
        ).length
      : 0;

  useEffect(() => {
    if (!activities.length || isPaused || tickerCollapsed) return;
    const id = setInterval(() => {
      setCurrentActivityIndex((prev) => (prev + 1) % activities.length);
    }, 7000);
    return () => clearInterval(id);
  }, [activities.length, isPaused, tickerCollapsed]);

  const formatTimeAgo = (dateString: string) => {
    const now = Date.now();
    const diff = Math.floor((now - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getActivityIconName = (activityType: ActivityType) => {
    switch (activityType) {
      case 'workout':
      case 'journal_entry':
        return 'book';
      case 'user_joined':
      case 'group_joined':
        return 'users';
      case 'meet_created':
        return 'calendar';
      case 'meet_results':
        return 'medal';
      case 'coach_status':
        return 'trophy';
      case 'program_assigned':
        return 'book-open';
      default:
        return 'user';
    }
  };

  const categoryCards: CategoryCard[] = [
    {
      title: 'Practice',
      description: 'Your daily workout',
      iconName: 'calendar-alt',
      route: 'Practice',
      isSpecial: true,
    },
    {
      title: 'Programs',
      description: 'Training plans and schedules',
      iconName: 'book',
      route: 'Programs',
    },
    {
      title: 'Tools',
      description: 'Training and performance tools',
      iconName: 'clock',
      route: 'Tools',
    },
    {
      title: 'Sprinthia',
      description: 'Your AI coach is ready',
      iconName: 'comments',
      route: 'Sprinthia',
      disabled: false,
      showStar: true,
    },
    {
      title: 'Race',
      description: 'Coming Soon',
      iconName: 'trophy',
      route: 'Meets',
      disabled: true,
    },
  ];

  const handleCardPress = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <LinearGradient
      colors={theme.gradients.background.colors}
      locations={theme.gradients.background.locations}
      start={theme.gradients.background.start}
      end={theme.gradients.background.end}
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      <ScrollView
        style={[styles.scrollView, { paddingTop: insets.top }]}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true, extra: theme.spacing.xxxxl }) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={`${greeting}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
          subtitle="Ready to train today?"
          right={
            <>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => onNavigate?.('Notifications')}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
              <Icon name="bell" size={18} color="#94a3b8" solid />
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text variant="caption" weight="bold" color="foreground">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => onNavigate?.('Chat')}
                accessibilityRole="button"
                accessibilityLabel="Messages"
              >
              <Icon name="paper-plane" size={16} color="#94a3b8" solid />
              {unreadMessages > 0 && (
                <View style={styles.badge}>
                  <Text variant="caption" weight="bold" color="foreground">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Text>
                </View>
              )}
              </TouchableOpacity>
            </>
          }
          containerStyle={styles.header}
        />

        {/* Feed ticker */}
        <View style={styles.tickerContainer}>
          {tickerCollapsed ? (
            <TouchableOpacity
              style={styles.tickerCollapsed}
              activeOpacity={0.8}
              onPress={() => setTickerCollapsed(false)}
            >
              <Text variant="body" weight="medium" color="foreground">
                Feed
              </Text>
              <Icon name="chevron-down" size={12} color="#cbd5e1" solid />
            </TouchableOpacity>
          ) : (
            <LinearGradient
              colors={['#5b21b6', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tickerCard}
            >
              <View style={styles.tickerControls}>
                <TouchableOpacity
                  style={styles.tickerIconButton}
                  onPress={() => setIsPaused((prev) => !prev)}
                >
                  <Icon name={isPaused ? 'play' : 'pause'} size={10} color="#ffffff" solid />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tickerIconButton}
                  onPress={() => setTickerCollapsed(true)}
                >
                  <Icon name="times" size={10} color="#ffffff" solid />
                </TouchableOpacity>
              </View>
              <View style={styles.tickerContent}>
                <View style={styles.tickerHeaderRow}>
                  <View style={styles.tickerAvatar}>
                    <Icon
                      name={getActivityIconName(currentActivity?.activityType ?? 'user')}
                      size={12}
                      color="#e2e8f0"
                      solid
                    />
                  </View>
                  <View style={styles.tickerTitleBlock}>
                    <Text variant="caption" color="accent" numberOfLines={1}>
                      {currentActivity?.title ?? 'Community updates'}
                    </Text>
                    {!!currentActivity?.user?.username && (
                      <Text variant="caption" color="secondary" numberOfLines={1}>
                        {currentActivity.user.username} · {formatTimeAgo(currentActivity.createdAt)}
                      </Text>
                    )}
                  </View>
                </View>
                <Text variant="body" weight="medium" color="foreground" numberOfLines={3}>
                  {currentActivity?.description ??
                    'Athletes are crushing their sessions today. Tap Feed to see more.'}
                </Text>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Category Cards */}
        <View style={styles.cardsContainer}>
          {categoryCards.map((card, idx) => {
            const disabled = card.disabled;
            const CardContent = (
              <Card
                key={card.title}
                style={[styles.categoryCard, idx > 0 && styles.categoryCardSpacer, disabled && styles.cardDisabled]}
                gradient={false}
              >
                <View style={styles.categoryInner}>
                  <View style={styles.categoryText}>
                    <Text variant="h4" weight="bold" color={disabled ? 'muted' : 'foreground'}>
                      {card.title}{' '}
                      {card.showStar ? (
                        <Icon name="star" size={12} color="#facc15" solid />
                      ) : null}
                    </Text>
                    <View style={styles.categorySubRow}>
                      <View style={styles.categoryDot} />
                      <Text variant="caption" color={disabled ? 'muted' : 'secondary'}>
                        {card.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryIcons}>
                    {card.isSpecial && (
                      <TouchableOpacity
                        style={styles.previewButton}
                        activeOpacity={0.7}
                        onPress={() => !disabled && handleCardPress(card.route)}
                      >
                        <Icon name="eye" size={14} color="#60a5fa" solid />
                      </TouchableOpacity>
                    )}
                    <Icon name="chevron-right" size={12} color={disabled ? '#94a3b8' : '#cbd5e1'} solid />
                  </View>
                </View>
              </Card>
            );

            if (disabled) {
              return (
                <View key={card.title} style={{ width: '100%' }} pointerEvents="none">
                  {CardContent}
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={card.title}
                activeOpacity={0.85}
                onPress={() => handleCardPress(card.route)}
              >
                {CardContent}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.container,
  },
  header: {
    paddingVertical: theme.spacing.xxl,
  },
  profileButton: {
    padding: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minHeight: 80,
    marginBottom: 0,
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cardsContainer: {
    gap: theme.spacing.lg,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tickerContainer: {
    marginBottom: theme.spacing.lg,
  },
  tickerCollapsed: {
    height: 40,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tickerCard: {
    borderRadius: 12,
    paddingVertical: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    width: '100%',
    alignSelf: 'stretch',
  },
  tickerControls: {
    position: 'absolute',
    right: theme.spacing.sm,
    top: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  tickerIconButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickerContent: {
    paddingRight: 48,
    gap: theme.spacing.xs,
  },
  tickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  tickerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  tickerTitleBlock: {
    flex: 1,
  },
  categoryCard: {
    height: 90,
    overflow: 'hidden',
    backgroundColor: 'rgba(147, 51, 234, 0.08)',
    borderColor: 'rgba(100, 116, 139, 0.25)',
    borderWidth: 0.5,
    borderRadius: 6,
  },
  categoryCardSpacer: {
    marginTop: theme.spacing.lg,
  },
  categoryInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  categoryText: {
    flex: 1,
  },
  categorySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60a5fa',
  },
  categoryIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginLeft: theme.spacing.md,
  },
  previewButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
});
