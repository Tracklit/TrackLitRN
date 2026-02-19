import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Bell,
  PaperPlaneTilt,
  CaretDown,
  X,
  CaretRight,
  Star,
  Book,
  Users,
  CalendarBlank,
  Medal,
  Trophy,
  BookOpen,
  User,
  Heart,
  FloppyDisk,
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { LinearGradient } from '@/components/LinearGradient';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InlineRefreshHeader } from '@/components/refresh/InlineRefreshHeader';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
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
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [tickerCollapsed, setTickerCollapsed] = useState(false);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [nextActivityIndex, setNextActivityIndex] = useState<number | null>(null);
  const [tickerModalVisible, setTickerModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CommunityActivity | null>(null);
  const [likedActivities, setLikedActivities] = useState<Set<number>>(new Set());
  const isAnimatingRef = useRef(false);
  const userId = user?.id;

  const screenOpacity = useSharedValue(0);
  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
  }, []);
  const screenFadeStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const currentOpacity = useSharedValue(1);
  const currentTranslateY = useSharedValue(0);
  const nextOpacity = useSharedValue(0);
  const nextTranslateY = useSharedValue(-20);

  const ANIM_DURATION = 400;
  const easeOutCubic = Easing.bezier(0.33, 1, 0.68, 1);

  const currentAnimStyle = useAnimatedStyle(() => ({
    opacity: currentOpacity.value,
    transform: [{ translateY: currentTranslateY.value }],
  }));

  const nextAnimStyle = useAnimatedStyle(() => ({
    opacity: nextOpacity.value,
    transform: [{ translateY: nextTranslateY.value }],
  }));

  const promoteNext = useCallback((idx: number) => {
    currentOpacity.value = 1;
    currentTranslateY.value = 0;
    nextOpacity.value = 0;
    nextTranslateY.value = -20;

    setNextActivityIndex(null);
    setCurrentActivityIndex(idx);
    isAnimatingRef.current = false;
  }, []);

  const triggerTransition = useCallback((nextIdx: number) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setNextActivityIndex(nextIdx);

    const outConfig = { duration: ANIM_DURATION, easing: easeOutCubic };
    const inConfig = { duration: ANIM_DURATION, easing: easeOutCubic };

    currentOpacity.value = withTiming(0, outConfig);
    currentTranslateY.value = withTiming(20, outConfig);

    nextOpacity.value = withTiming(1, inConfig);
    nextTranslateY.value = withTiming(0, inConfig, (finished) => {
      'worklet';
      if (finished) {
        runOnJS(promoteNext)(nextIdx);
      }
    });
  }, [promoteNext]);

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
  const nextActivity =
    nextActivityIndex !== null && activities.length > 0
      ? activities[nextActivityIndex % activities.length]
      : undefined;

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

  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentActivityIndex;

  const isPaused = tickerModalVisible;

  useEffect(() => {
    if (tickerCollapsed || isPaused) {
      isAnimatingRef.current = false;
      setNextActivityIndex(null);
      currentOpacity.value = 1;
      currentTranslateY.value = 0;
      nextOpacity.value = 0;
      nextTranslateY.value = -20;
    }
  }, [tickerCollapsed, isPaused]);

  useEffect(() => {
    if (!activities.length || isPaused || tickerCollapsed) return;
    const id = setInterval(() => {
      const nextIdx = (currentIndexRef.current + 1) % activities.length;
      triggerTransition(nextIdx);
    }, 7000);
    return () => clearInterval(id);
  }, [activities.length, isPaused, tickerCollapsed, triggerTransition]);

  const formatTimeAgo = (dateString: string) => {
    const now = Date.now();
    const diff = Math.floor((now - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleTickerTap = (activity: CommunityActivity | undefined) => {
    if (!activity) return;
    setSelectedActivity(activity);
    setTickerModalVisible(true);
  };

  const handleLikeActivity = (activityId: number) => {
    setLikedActivities(prev => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  };

  const saveToJournalMutation = useMutation({
    mutationFn: (activity: CommunityActivity) =>
      apiRequest('/api/journal', {
        method: 'POST',
        data: {
          title: activity.title,
          notes: `Saved from community feed:\n\n${activity.description || ''}\n\nOriginally posted by ${activity.user?.name || activity.user?.username || 'Unknown'}`,
          type: 'workout',
          date: new Date().toISOString().split('T')[0],
          moodRating: 5,
          isPublic: false,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      Alert.alert('Saved', 'Added to your Journal.');
      setTickerModalVisible(false);
    },
    onError: () => {
      Alert.alert('Error', 'Could not save to Journal. Please try again.');
    },
  });

  const getActivityIconComponent = (activityType: ActivityType) => {
    switch (activityType) {
      case 'workout':
      case 'journal_entry':
        return Book;
      case 'user_joined':
      case 'group_joined':
        return Users;
      case 'meet_created':
        return CalendarBlank;
      case 'meet_results':
        return Medal;
      case 'coach_status':
        return Trophy;
      case 'program_assigned':
        return BookOpen;
      default:
        return User;
    }
  };

  const categoryCards: CategoryCard[] = [
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
      description: 'Your AI Track Companion',
      iconName: 'comments',
      route: 'Sprinthia',
      disabled: false,
      showStar: true,
    },
  ];

  const { isRefreshing, onRefresh } = usePullToRefresh(async () => {
    await Promise.all([queryClient.invalidateQueries(), refreshUser()]);
  });

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

      <Animated.View style={[{ flex: 1 }, screenFadeStyle]}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top }]}>
        <ScreenHeader
          title=""
          right={
            <>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => onNavigate?.('Notifications')}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
              <Bell size={22} color="#94a3b8" weight="fill" />
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
              <PaperPlaneTilt size={19} color="#94a3b8" weight="fill" />
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
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true, extra: theme.spacing.xxxxl }) }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <InlineRefreshHeader visible={isRefreshing} />

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
              <CaretDown size={12} color="#cbd5e1" weight="fill" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.tickerCard}
              activeOpacity={0.85}
              onPress={() => handleTickerTap(currentActivity)}
            >
              <View style={styles.tickerControls}>
                <TouchableOpacity
                  style={styles.tickerIconButton}
                  onPress={(e) => { e.stopPropagation(); setTickerCollapsed(true); }}
                >
                  <X size={10} color="#ffffff" weight="bold" />
                </TouchableOpacity>
              </View>
              <View style={styles.tickerContent}>
                <Animated.View style={[styles.tickerMessageLayer, currentAnimStyle]}>
                  <View style={styles.tickerHeaderRow}>
                    <View style={styles.tickerAvatar}>
                      {(() => {
                        const ActivityIcon = getActivityIconComponent(currentActivity?.activityType ?? 'user');
                        return <ActivityIcon size={12} color="#e2e8f0" weight="fill" />;
                      })()}
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
                  <Text variant="caption" weight="medium" color="foreground" numberOfLines={1}>
                    {currentActivity?.description ??
                      'Athletes are crushing their sessions today. Tap Feed to see more.'}
                  </Text>
                </Animated.View>

                {nextActivity && (
                  <Animated.View style={[styles.tickerMessageLayer, nextAnimStyle]}>
                    <View style={styles.tickerHeaderRow}>
                      <View style={styles.tickerAvatar}>
                        {(() => {
                          const ActivityIcon = getActivityIconComponent(nextActivity.activityType ?? 'user');
                          return <ActivityIcon size={12} color="#e2e8f0" weight="fill" />;
                        })()}
                      </View>
                      <View style={styles.tickerTitleBlock}>
                        <Text variant="caption" color="accent" numberOfLines={1}>
                          {nextActivity.title ?? 'Community updates'}
                        </Text>
                        {!!nextActivity.user?.username && (
                          <Text variant="caption" color="secondary" numberOfLines={1}>
                            {nextActivity.user.username} · {formatTimeAgo(nextActivity.createdAt)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text variant="caption" weight="medium" color="foreground" numberOfLines={1}>
                      {nextActivity.description ??
                        'Athletes are crushing their sessions today. Tap Feed to see more.'}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </TouchableOpacity>
          )}
          <View style={styles.tickerDivider} />
        </View>

        {/* Practice Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleCardPress('Practice')}
          style={styles.practiceCardWrapper}
        >
          <LinearGradient
            colors={['#6d28d9', '#c084fc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.practiceCard}
          >
            <View style={styles.practiceTopRow}>
              <View style={styles.practiceLabelPill}>
                <Text style={styles.practiceLabelText}>TODAY'S SESSION</Text>
              </View>
            </View>

            <Text style={styles.practiceNoSession}>
              No Session Scheduled — add a Program to get started
            </Text>
          </LinearGradient>
        </TouchableOpacity>

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
                    <Text variant="body" weight="bold" color={disabled ? 'muted' : 'foreground'}>
                      {card.title}{' '}
                      {card.showStar ? (
                        <Star size={12} color="#facc15" weight="fill" />
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
                        <CaretRight size={14} color="#60a5fa" weight="fill" />
                      </TouchableOpacity>
                    )}
                    <CaretRight size={12} color={disabled ? '#94a3b8' : '#cbd5e1'} weight="fill" />
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
      </Animated.View>

      <Modal
        visible={tickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTickerModalVisible(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { paddingTop: insets.top + 60 }]}
          activeOpacity={1}
          onPress={() => setTickerModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={() => {}}
          >
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setTickerModalVisible(false)}
            >
              <X size={16} color="#94a3b8" weight="bold" />
            </TouchableOpacity>

            {selectedActivity && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    {(() => {
                      const ActivityIcon = getActivityIconComponent(selectedActivity.activityType);
                      return <ActivityIcon size={18} color="#e2e8f0" weight="fill" />;
                    })()}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="bold" color="foreground">
                      {selectedActivity.title}
                    </Text>
                    {!!selectedActivity.user?.username && (
                      <Text variant="caption" color="secondary">
                        {selectedActivity.user.name || selectedActivity.user.username} · {formatTimeAgo(selectedActivity.createdAt)}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.modalBody}>
                  <Text variant="body" color="foreground" style={{ lineHeight: 22 }}>
                    {selectedActivity.description || 'No additional details available.'}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.modalActionButton,
                      likedActivities.has(selectedActivity.id) && styles.modalActionButtonActive,
                    ]}
                    onPress={() => handleLikeActivity(selectedActivity.id)}
                  >
                    <Heart
                      size={18}
                      color={likedActivities.has(selectedActivity.id) ? '#ef4444' : '#94a3b8'}
                      weight={likedActivities.has(selectedActivity.id) ? 'fill' : 'regular'}
                    />
                    <Text
                      variant="caption"
                      weight="medium"
                      color={likedActivities.has(selectedActivity.id) ? 'foreground' : 'secondary'}
                    >
                      {likedActivities.has(selectedActivity.id) ? 'Liked' : 'Like'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => saveToJournalMutation.mutate(selectedActivity)}
                    disabled={saveToJournalMutation.isPending}
                  >
                    <FloppyDisk size={18} color="#FF9800" weight="fill" />
                    <Text variant="caption" weight="medium" color="secondary">
                      {saveToJournalMutation.isPending ? 'Saving...' : 'Save to Journal'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  fixedHeader: {
    zIndex: 10,
    paddingHorizontal: theme.spacing.container,
  },
  header: {
    paddingVertical: theme.spacing.xs,
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
    gap: theme.spacing.sm,
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
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  tickerCollapsed: {
    height: 36,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tickerCard: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.lg,
    height: 76,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  tickerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: theme.spacing.lg,
  },
  tickerControls: {
    position: 'absolute',
    right: 10,
    top: 10,
    flexDirection: 'row',
    zIndex: 2,
  },
  tickerIconButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickerContent: {
    paddingRight: 36,
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
  },
  tickerMessageLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    gap: 2,
  },
  tickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  tickerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
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
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  categoryCardSpacer: {
    marginTop: theme.spacing.sm,
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
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  practiceCardWrapper: {
    marginBottom: theme.spacing.xxxl,
  },
  practiceCard: {
    borderRadius: 16,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    height: 240,
  },
  practiceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  practiceLabelPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  practiceLabelText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  practiceFireIcon: {
    fontSize: 22,
  },
  practiceStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  practiceStat: {
    flex: 1,
    alignItems: 'flex-start' as const,
  },
  practiceStatValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800' as const,
  },
  practiceStatUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  practiceStatLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  practiceProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden' as const,
    marginBottom: theme.spacing.md,
  },
  practiceProgressFill: {
    height: '100%' as any,
    backgroundColor: '#f97316',
    borderRadius: 3,
    minWidth: 6,
  },
  practiceNoSession: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '500' as const,
    fontStyle: 'italic' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.container,
  },
  modalContent: {
    backgroundColor: '#1a1028',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingRight: 36,
  },
  modalAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  modalActionButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
});
