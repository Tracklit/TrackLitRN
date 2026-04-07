import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Text as RNText,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  CaretLeft,
  UserPlus,
  CheckCircle,
  Trophy,
  ChatDots,
  Barbell,
  MegaphoneSimple,
  Trash,
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import { Text } from '@/components/ui/Text';
import { SkeletonNotificationList } from '@/components/Skeleton';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface NotificationItem {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

const SYSTEM_NOTIFICATION_TYPES = new Set([
  'system',
  'system_update',
  'announcement',
  'promotion',
  'tip',
  'reminder',
  'welcome',
  'feature_update',
  'maintenance',
  'newsletter',
]);

const USER_NOTIFICATION_TYPES = new Set([
  'friend_request',
  'friend_request_received',
  'connection_request',
  'friend_accepted',
  'meet_invitation',
  'message',
  'chat',
  'comment',
  'like',
  'mention',
  'program_assigned',
  'program_shared',
]);

const isSystemNotification = (type: string): boolean => {
  if (USER_NOTIFICATION_TYPES.has(type)) return false;
  if (SYSTEM_NOTIFICATION_TYPES.has(type)) return true;
  return !type.includes('friend') && !type.includes('connection') && !type.includes('meet') && !type.includes('message') && !type.includes('chat') && !type.includes('program');
};

const throttleSystemNotifications = (items: NotificationItem[]): NotificationItem[] => {
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const result: NotificationItem[] = [];
  let lastSystemTimestamp: number | null = null;
  const MIN_SYSTEM_GAP_MS = 4 * 60 * 60 * 1000;

  for (const item of sorted) {
    if (!isSystemNotification(item.type)) {
      result.push(item);
      continue;
    }

    const ts = new Date(item.createdAt).getTime();
    if (lastSystemTimestamp === null || lastSystemTimestamp - ts >= MIN_SYSTEM_GAP_MS) {
      result.push(item);
      lastSystemTimestamp = ts;
    }
  }

  return result;
};

export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated, hasValidToken, logout } = useAuth();
  const isGuest = user?.id === 'guest';
  const { styles, theme } = useThemedStyles(createStyles);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
      case 'friend_request_received':
      case 'connection_request':
        return { Icon: UserPlus, color: '#3b82f6' };
      case 'friend_accepted':
        return { Icon: CheckCircle, color: theme.colors.success };
      case 'meet_invitation':
        return { Icon: Trophy, color: theme.colors.brandOrange };
      case 'message':
      case 'chat':
        return { Icon: ChatDots, color: theme.colors.brandOrange };
      case 'program_assigned':
      case 'program_shared':
        return { Icon: Barbell, color: theme.colors.brandOrange };
      case 'system':
      case 'system_update':
      case 'announcement':
      case 'feature_update':
        return { Icon: MegaphoneSimple, color: theme.colors.textMuted };
      default:
        return { Icon: Bell, color: theme.colors.textMuted };
    }
  };

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest<NotificationItem[]>('/api/notifications?limit=50&offset=0'),
    enabled: isAuthenticated && !isGuest && hasValidToken,
  });

  const notifications = useMemo(() => {
    const raw = notificationsQuery.data ?? [];
    return throttleSystemNotifications(raw);
  }, [notificationsQuery.data]);

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-home'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/notifications/mark-all-read', { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-home'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests-pending'] });
    },
    onError: () => {
      Alert.alert('Error', 'Unable to mark all as read.');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      setDeletingIds((prev) => new Set(prev).add(id));
      await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
    },
    onSettled: (_data, _err, id) => {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-home'] });
    },
  });

  const handleNotificationPress = async (n: NotificationItem) => {
    if (!n.isRead) {
      markReadMutation.mutate(n.id);
    }

    if (n.type === 'friend_request' || n.type === 'friend_request_received' || n.type === 'connection_request') {
      navigation.navigate('Connections');
      return;
    }

    if (n.type === 'friend_accepted') {
      navigation.navigate('Connections');
      return;
    }

    const url = n.actionUrl || '';

    if (url.startsWith('/rehab')) {
      navigation.navigate('Rehab');
      return;
    }

    if (url.startsWith('/messages') || url.startsWith('/chat')) {
      navigation.navigate('Chat');
      return;
    }

    if (url.startsWith('/programs')) {
      navigation.navigate('MainTabs', { screen: 'Training' } as any);
      return;
    }

    if (url.startsWith('/tools') || url.startsWith('/training-tools')) {
      navigation.navigate('MainTabs', { screen: 'Tools' } as any);
      return;
    }
  };

  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasForcedLogout = useRef(false);
  const notificationsError = notificationsQuery.error as (Error & { status?: number }) | null;

  useEffect(() => {
    if (notificationsError?.status === 401 && !hasForcedLogout.current) {
      hasForcedLogout.current = true;
      logout();
    }
  }, [notificationsError?.status, logout]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <CaretLeft size={18} color={theme.colors.textSecondary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.markAllBtn}
          onPress={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending || notifications.length === 0}
        >
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {isGuest || !hasValidToken ? (
          <View style={styles.emptyContainer}>
            <Bell size={40} color={theme.colors.textMuted} weight="fill" />
            <Text style={styles.emptyText}>Sign in to view notifications.</Text>
          </View>
        ) : notificationsQuery.isLoading ? (
          <SkeletonNotificationList count={6} />
        ) : notificationsQuery.isError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {notificationsError?.status === 401
                ? 'Session expired. Please sign in again.'
                : 'Unable to load notifications.'}
            </Text>
            <Button variant="outline" onPress={() => notificationsQuery.refetch()}>
              Retry
            </Button>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={40} color={theme.colors.textMuted} weight="fill" />
            <Text style={styles.emptyText}>You're all caught up.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((n, index) => {
              const { Icon, color } = getNotificationIcon(n.type);
              const prev = notifications[index - 1];
              const showDivider = index > 0 && prev && n.isRead && prev.isRead === false;
              return (
                <View key={n.id}>
                  {showDivider && (
                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>Earlier</Text>
                      <View style={styles.dividerLine} />
                    </View>
                  )}
                  {index > 0 && !showDivider && <View style={styles.itemSeparator} />}
                  <Swipeable
                    renderRightActions={() => (
                      <TouchableOpacity
                        style={styles.swipeDeleteAction}
                        onPress={() => !deletingIds.has(n.id) && deleteNotificationMutation.mutate(n.id)}
                        activeOpacity={0.85}
                      >
                        {deletingIds.has(n.id)
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Trash size={18} color="#fff" weight="fill" />
                        }
                        <RNText style={styles.swipeDeleteText}>Delete</RNText>
                      </TouchableOpacity>
                    )}
                    rightThreshold={60}
                    overshootRight={false}
                  >
                    <TouchableOpacity
                      onPress={() => handleNotificationPress(n)}
                      activeOpacity={0.6}
                      style={styles.itemRow}
                    >
                      <View style={[styles.itemIcon, { backgroundColor: `${color}15` }]}>
                        <Icon size={16} color={color} weight="fill" />
                      </View>
                      <View style={styles.itemBody}>
                        <View style={styles.itemHeaderRow}>
                          <Text style={styles.itemTitle} numberOfLines={1}>{n.title}</Text>
                          {!n.isRead && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.itemMessage} numberOfLines={2}>{n.message}</Text>
                        <Text style={styles.itemTime}>
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.backgroundSolid,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: t.colors.overlaySubtle,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.colors.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: t.colors.textPrimary,
    letterSpacing: 0.3,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: t.colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  markAllBtn: {
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: t.colors.brandOrange,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: t.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    gap: 0,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: t.colors.overlaySubtle,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '600',
    color: t.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemSeparator: {
    height: 0.5,
    backgroundColor: t.colors.overlaySubtle,
    marginLeft: 56,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    backgroundColor: t.colors.backgroundSolid,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  itemBody: {
    flex: 1,
    gap: 3,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: t.colors.textPrimary,
  },
  itemMessage: {
    fontSize: 11,
    color: t.colors.textSecondary,
    lineHeight: 16,
  },
  itemTime: {
    fontSize: 10,
    color: t.colors.textMuted,
    marginTop: 2,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: t.colors.brandOrange,
  },
  swipeDeleteAction: {
    backgroundColor: t.colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 5,
  },
  swipeDeleteText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
