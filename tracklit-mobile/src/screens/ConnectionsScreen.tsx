import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MagnifyingGlass,
  UserPlus,
  Users,
  CheckCircle,
  XCircle,
  ChatCircle,
  UserMinus,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonListRows } from '@/components/Skeleton';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface ConnectionItem {
  id: number;
  name?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
}

interface NotificationItem {
  id: number;
  type: string;
  title?: string;
  message?: string;
  relatedId?: number | null;
  relatedType?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const ConnectionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'connections' | 'requests'>('connections');

  const connectionsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => apiRequest<ConnectionItem[]>('/api/friends'),
    enabled: isAuthenticated && !isGuest,
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest<NotificationItem[]>('/api/notifications'),
    enabled: isAuthenticated && !isGuest,
  });

  const [handledIds, setHandledIds] = useState<Set<number>>(new Set());

  const pendingRequests = useMemo(() => {
    if (!notificationsQuery.data) return [];
    return notificationsQuery.data.filter(
      (n) =>
        n.type === 'friend_request_received' &&
        n.relatedId &&
        !handledIds.has(n.id),
    );
  }, [notificationsQuery.data, handledIds]);

  const acceptMutation = useMutation({
    mutationFn: async ({
      fromUserId,
      notifId,
    }: {
      fromUserId: number;
      notifId: number;
    }) => {
      return apiRequest(`/api/friend-request/accept/${fromUserId}`, {
        method: 'POST',
      });
    },
    onSuccess: (_data, vars) => {
      setHandledIds((prev) => new Set(prev).add(vars.notifId));
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Could not accept request.');
    },
  });

  const declineMutation = useMutation({
    mutationFn: async ({
      fromUserId,
      notifId,
    }: {
      fromUserId: number;
      notifId: number;
    }) => {
      return apiRequest(`/api/friend-request/decline/${fromUserId}`, {
        method: 'POST',
      });
    },
    onSuccess: (_data, vars) => {
      setHandledIds((prev) => new Set(prev).add(vars.notifId));
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Could not decline request.');
    },
  });

  const removeConnectionMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/follow/${userId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to remove connection.');
    },
  });

  const handleRemove = useCallback(
    (c: ConnectionItem) => {
      Alert.alert(
        'Remove Connection',
        `Remove ${c.name || c.username || 'this user'} from your connections?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeConnectionMutation.mutate(c.id),
          },
        ],
      );
    },
    [removeConnectionMutation],
  );

  const filtered = useMemo(() => {
    const data = connectionsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((c) =>
      `${c.name || ''} ${c.username || ''}`.toLowerCase().includes(q),
    );
  }, [connectionsQuery.data, search]);

  const extractName = (message: string) => {
    const match = message.match(/^(.+?) sent you/);
    return match ? match[1] : 'Someone';
  };

  const isLoading =
    connectionsQuery.isLoading || notificationsQuery.isLoading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color="#e2e8f0" weight="bold" />
        </TouchableOpacity>
        <Text
          variant="body"
          weight="bold"
          color="foreground"
          style={styles.headerTitle}
        >
          Connections
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'connections' && styles.tabActive]}
          onPress={() => setTab('connections')}
        >
          <Text
            variant="body"
            weight={tab === 'connections' ? 'semiBold' : 'regular'}
            color={tab === 'connections' ? 'primary' : 'muted'}
          >
            Connections
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'requests' && styles.tabActive]}
          onPress={() => setTab('requests')}
        >
          <Text
            variant="body"
            weight={tab === 'requests' ? 'semiBold' : 'regular'}
            color={tab === 'requests' ? 'primary' : 'muted'}
          >
            Requests
          </Text>
          {pendingRequests.length > 0 && (
            <View style={styles.badge}>
              <Text
                variant="small"
                weight="bold"
                style={{ color: '#fff', fontSize: 11 }}
              >
                {pendingRequests.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {tab === 'connections' && (
        <View style={styles.searchRow}>
          <MagnifyingGlass size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search connections..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      )}

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.center}>
            <SkeletonListRows count={5} />
          </View>
        ) : isGuest ? (
          <View style={styles.center}>
            <Users size={32} color="rgba(255,255,255,0.3)" weight="fill" />
            <Text variant="body" color="muted">
              Sign in to view connections.
            </Text>
          </View>
        ) : tab === 'requests' ? (
          pendingRequests.length === 0 ? (
            <View style={styles.center}>
              <UserPlus size={32} color="rgba(255,255,255,0.3)" weight="fill" />
              <Text variant="body" color="muted">
                No pending requests.
              </Text>
            </View>
          ) : (
            pendingRequests.map((req) => {
              const senderName = extractName(req.message || '');
              const senderId = req.relatedId!;
              return (
                <View key={req.id} style={styles.requestCard}>
                  <TouchableOpacity
                    style={styles.requestInfo}
                    onPress={() =>
                      navigation.navigate('PublicProfile', {
                        userId: senderId,
                        name: senderName,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Avatar
                      size="md"
                      fallback={senderName.slice(0, 2).toUpperCase()}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="body"
                        weight="semiBold"
                        color="foreground"
                        numberOfLines={1}
                      >
                        {senderName}
                      </Text>
                      <Text variant="small" color="muted">
                        Wants to connect
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => acceptMutation.mutate({ fromUserId: senderId, notifId: req.id })}
                      disabled={acceptMutation.isPending}
                    >
                      <CheckCircle size={18} color="#fff" weight="fill" />
                      <Text
                        variant="small"
                        weight="semiBold"
                        style={{ color: '#fff' }}
                      >
                        Approve
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => declineMutation.mutate({ fromUserId: senderId, notifId: req.id })}
                      disabled={declineMutation.isPending}
                    >
                      <XCircle size={18} color="rgba(255,255,255,0.6)" weight="fill" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Users size={32} color="rgba(255,255,255,0.3)" weight="fill" />
            <Text variant="body" color="muted">
              No connections yet.
            </Text>
          </View>
        ) : (
          filtered.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.connectionCard}
              onPress={() =>
                navigation.navigate('PublicProfile', {
                  userId: c.id,
                  name: c.name,
                  username: c.username,
                  profileImageUrl: c.profileImageUrl,
                })
              }
              activeOpacity={0.7}
            >
              {c.profileImageUrl ? (
                <Image
                  source={{ uri: c.profileImageUrl }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar
                  size="md"
                  fallback={(c.name || c.username || 'U')
                    .slice(0, 2)
                    .toUpperCase()}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  variant="body"
                  weight="semiBold"
                  color="foreground"
                  numberOfLines={1}
                >
                  {c.name || 'TrackLit Athlete'}
                </Text>
                <Text variant="small" color="muted" numberOfLines={1}>
                  @{c.username || 'user'}
                </Text>
              </View>
              <View style={styles.connectionActions}>
                <TouchableOpacity
                  style={styles.messageIcon}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('ChatConversation', {
                      conversationId: c.id,
                      type: 'direct',
                    });
                  }}
                >
                  <ChatCircle size={18} color={theme.colors.primary} weight="fill" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeIcon}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemove(c);
                  }}
                >
                  <UserMinus size={16} color="rgba(255,255,255,0.35)" weight="fill" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 17,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabActive: {
    backgroundColor: 'rgba(255,152,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.25)',
  },
  badge: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 14,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 8,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  requestCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.15)',
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 52,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  connectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,152,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
