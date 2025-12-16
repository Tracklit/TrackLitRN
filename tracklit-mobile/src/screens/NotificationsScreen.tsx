import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text variant="h3" weight="bold" color="foreground">
            Notifications
          </Text>
          <Text variant="small" color="muted">
            {unreadCount} unread
          </Text>
        </View>
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
            {notifications.map((n) => (
              <TouchableOpacity
                key={n.id}
                onPress={() => handleNotificationPress(n)}
                activeOpacity={0.8}
              >
                <Card
                  style={
                    n.isRead
                      ? styles.itemCard
                      : ({ ...styles.itemCard, ...styles.itemCardUnread } as any)
                  }
                >
                  <CardContent style={styles.itemContent}>
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
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  center: { alignItems: 'center', paddingVertical: theme.spacing.xl, gap: theme.spacing.md },
  emptyText: { textAlign: 'center', lineHeight: 22, paddingVertical: theme.spacing.xl },
  list: { gap: theme.spacing.sm },
  itemCard: { marginBottom: 0 },
  itemCardUnread: { borderColor: theme.colors.primary },
  itemContent: { gap: theme.spacing.xs },
  itemHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  itemMessage: { lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});
