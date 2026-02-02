import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import theme from '@/utils/theme';

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

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'friend_request':
    case 'connection_request':
      return { name: 'user-plus', color: '#3b82f6' };
    case 'friend_accepted':
      return { name: 'check', color: '#22c55e' };
    case 'meet_invitation':
      return { name: 'trophy', color: theme.colors.primary };
    default:
      return { name: 'bell', color: 'rgba(255,255,255,0.6)' };
  }
};

export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest<NotificationItem[]>('/api/notifications?limit=50&offset=0'),
    enabled: isAuthenticated && !isGuest,
  });

  const notifications = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);

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

    const url = n.actionUrl || '';

    // Best-effort deep links into mobile navigation
    if (url.startsWith('/rehab')) {
      navigation.navigate('Rehab');
      return;
    }

    if (url.startsWith('/messages') || url.startsWith('/chat')) {
      navigation.navigate('Chat');
      return;
    }

    if (url.startsWith('/programs')) {
      navigation.navigate('MainTabs', { screen: 'Programs' } as any);
      return;
    }

    if (url.startsWith('/tools') || url.startsWith('/training-tools')) {
      navigation.navigate('MainTabs', { screen: 'Tools' } as any);
      return;
    }

    // Default: do nothing (still marked read)
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color="white" solid />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text variant="h3" weight="bold" color="foreground">
            Notifications
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text variant="small" weight="bold" color="primary-foreground">
              {unreadCount}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending || notifications.length === 0}
        >
          <FontAwesome5 name="check-double" size={16} color={theme.colors.primary} solid />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {isGuest ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Sign in to view notifications.
          </Text>
        ) : notificationsQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="body" color="muted">Loading notifications…</Text>
          </View>
        ) : notificationsQuery.isError ? (
          <View style={styles.center}>
            <Text variant="body" color="muted" style={styles.emptyText}>
              Unable to load notifications.
            </Text>
            <Button variant="outline" onPress={() => notificationsQuery.refetch()}>
              Retry
            </Button>
          </View>
        ) : notifications.length === 0 ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            You’re all caught up.
          </Text>
        ) : (
          <View style={styles.list}>
            {notifications.map((n, index) => {
              const icon = getNotificationIcon(n.type);
              const prev = notifications[index - 1];
              const showDivider = index > 0 && prev && n.isRead && prev.isRead === false;
              return (
                <View key={n.id}>
                  {showDivider && (
                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text variant="small" color="muted" style={styles.dividerText}>
                        Older notifications
                      </Text>
                      <View style={styles.dividerLine} />
                    </View>
                  )}
                  <TouchableOpacity onPress={() => handleNotificationPress(n)} activeOpacity={0.8}>
                    <Card
                      style={
                        n.isRead
                          ? styles.itemCard
                          : ({ ...styles.itemCard, ...styles.itemCardUnread } as any)
                      }
                    >
                      <CardContent style={styles.itemContent}>
                        <View style={styles.itemIcon}>
                          <FontAwesome5 name={icon.name as any} size={14} color={icon.color} solid />
                        </View>
                        <View style={styles.itemBody}>
                          <View style={styles.itemHeaderRow}>
                            <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                              {n.title}
                            </Text>
                            {!n.isRead && <View style={styles.unreadDot} />}
                          </View>
                          <Text variant="small" color="muted" style={styles.itemMessage}>
                            {n.message}
                          </Text>
                          <Text variant="small" color="muted">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </Text>
                        </View>
                      </CardContent>
                    </Card>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.webNotificationBackground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.webBorderLight,
    backgroundColor: theme.colors.webNotificationBackground,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  unreadBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.webBorderLight,
  },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  center: { alignItems: 'center', paddingVertical: theme.spacing.xl, gap: theme.spacing.md },
  emptyText: { textAlign: 'center', lineHeight: 22, paddingVertical: theme.spacing.xl },
  list: { gap: theme.spacing.sm },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.webBorderLight,
  },
  dividerText: {
    opacity: 0.7,
  },
  itemCard: {
    marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: theme.colors.webBorderLight,
  },
  itemCardUnread: { borderColor: '#3b82f6' },
  itemContent: { flexDirection: 'row', gap: theme.spacing.md },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 2,
  },
  itemBody: { flex: 1, gap: theme.spacing.xs },
  itemHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  itemMessage: { lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
});
