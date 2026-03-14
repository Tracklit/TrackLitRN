import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
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

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  cardUnread: '#1A1D2A',
  orange: '#FF7A00',
  orangeDim: 'rgba(255,122,0,0.12)',
  border: 'rgba(255,255,255,0.06)',
  borderUnread: 'rgba(255,122,0,0.35)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  unreadDot: '#FF7A00',
  iconBg: 'rgba(255,255,255,0.05)',
  divider: 'rgba(255,255,255,0.06)',
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
};

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

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'friend_request':
    case 'friend_request_received':
    case 'connection_request':
      return { Icon: UserPlus, color: C.blue };
    case 'friend_accepted':
      return { Icon: CheckCircle, color: C.green };
    case 'meet_invitation':
      return { Icon: Trophy, color: C.orange };
    case 'message':
    case 'chat':
      return { Icon: ChatDots, color: C.orange };
    case 'program_assigned':
    case 'program_shared':
      return { Icon: Barbell, color: C.orange };
    case 'system':
    case 'system_update':
    case 'announcement':
    case 'feature_update':
      return { Icon: MegaphoneSimple, color: C.textMuted };
    default:
      return { Icon: Bell, color: C.textMuted };
  }
};

export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated, hasValidToken, logout } = useAuth();
  const isGuest = user?.id === 'guest';

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
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/notifications/mark-all-read', { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      Alert.alert('Error', 'Unable to mark all as read.');
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
          <CaretLeft size={18} color={C.textSecondary} weight="bold" />
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
            <Bell size={40} color={C.textMuted} weight="fill" />
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
            <Bell size={40} color={C.textMuted} weight="fill" />
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
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.3,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.orange,
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
    color: C.orange,
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
    color: C.textMuted,
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
    backgroundColor: C.divider,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemSeparator: {
    height: 0.5,
    backgroundColor: C.divider,
    marginLeft: 56,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
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
    color: C.textPrimary,
  },
  itemMessage: {
    fontSize: 11,
    color: C.textSecondary,
    lineHeight: 16,
  },
  itemTime: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 2,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.unreadDot,
  },
});
