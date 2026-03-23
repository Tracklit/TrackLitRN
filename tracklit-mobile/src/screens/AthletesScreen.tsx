import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CaretLeft,
  MagnifyingGlass,
  Users,
  UserPlus,
  CheckCircle,
  Clock,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonListRows } from '@/components/Skeleton';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0E0F14',
  orange: '#FF7A00',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.06)',
  iconBg: 'rgba(255,255,255,0.05)',
  connected: 'rgba(255,255,255,0.5)',
  requested: 'rgba(255,255,255,0.35)',
};

interface Athlete {
  id: number;
  username: string;
  name?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  isFollowing?: boolean;
  isFollower?: boolean;
}

interface AthletesResponse {
  athletes: Athlete[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface FriendRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
}

export const AthletesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pendingRequests, setPendingRequests] = useState<Set<number>>(new Set());

  const athletesQuery = useQuery({
    queryKey: ['athletes', search, page],
    queryFn: () =>
      apiRequest<AthletesResponse>(
        `/api/athletes?search=${encodeURIComponent(search.trim())}&page=${page}&limit=20`,
      ),
    enabled: isAuthenticated && !isGuest,
  });

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => apiRequest<Athlete[]>('/api/friends'),
    enabled: isAuthenticated && !isGuest,
  });

  const pendingRequestsQuery = useQuery({
    queryKey: ['friend-requests-pending'],
    queryFn: () => apiRequest<FriendRequest[]>('/api/friend-requests/pending'),
    enabled: isAuthenticated && !isGuest,
  });

  const athletes = useMemo(() => athletesQuery.data?.athletes ?? [], [athletesQuery.data]);
  const friends = useMemo(() => friendsQuery.data ?? [], [friendsQuery.data]);
  const pendingFriendRequests = useMemo(() => pendingRequestsQuery.data ?? [], [pendingRequestsQuery.data]);
  const hasMore = athletesQuery.data?.pagination?.hasMore ?? false;

  const isCoach = useCallback((athlete: Athlete) => {
    return athlete.bio?.toLowerCase().includes('coach') || false;
  }, []);

  const isAlreadyFriend = useCallback((athleteId: number) => {
    return friends.some((friend) => friend.id === athleteId);
  }, [friends]);

  const hasPendingRequest = useCallback((athleteId: number) => {
    return pendingFriendRequests.some(
      (req) => req.toUserId === athleteId || req.fromUserId === athleteId,
    );
  }, [pendingFriendRequests]);

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest<{ success: boolean }>(`/api/follow/${userId}`, { method: 'POST' });
    },
    onMutate: (userId: number) => {
      setPendingRequests((prev) => new Set(prev).add(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests-pending'] });
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
    onError: (error: Error, userId: number) => {
      setPendingRequests((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });
      Alert.alert('Error', error.message || 'Failed to send friend request');
    },
  });

  const handleConnect = useCallback((athleteId: number) => {
    sendFriendRequestMutation.mutate(athleteId);
  }, [sendFriendRequestMutation]);

  const handleAthletePress = useCallback((athlete: Athlete) => {
    navigation.navigate('PublicProfile', {
      userId: athlete.id,
      name: athlete.name ?? null,
      username: athlete.username ?? null,
      profileImageUrl: (athlete as any).profileImageUrl ?? null,
    });
  }, [navigation]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !athletesQuery.isFetching) setPage((prev) => prev + 1);
  }, [hasMore, athletesQuery.isFetching]);

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    setPage(1);
  }, []);

  const renderConnectionButton = useCallback((athlete: Athlete) => {
    const isFriend = isAlreadyFriend(athlete.id);
    const isPending = hasPendingRequest(athlete.id) || pendingRequests.has(athlete.id);
    const isSending = pendingRequests.has(athlete.id);

    if (isFriend) {
      return (
        <View style={styles.statusBadge}>
          <CheckCircle size={12} color={C.connected} weight="fill" />
          <Text style={[styles.statusText, { color: C.connected }]}>Connected</Text>
        </View>
      );
    }

    if (isPending) {
      return (
        <View style={styles.statusBadge}>
          <Clock size={12} color={C.requested} weight="fill" />
          <Text style={[styles.statusText, { color: C.requested }]}>Requested</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => handleConnect(athlete.id)}
        disabled={isSending}
        activeOpacity={0.6}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={C.orange} />
        ) : (
          <Text style={styles.connectText}>Connect</Text>
        )}
      </TouchableOpacity>
    );
  }, [isAlreadyFriend, hasPendingRequest, pendingRequests, handleConnect]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <CaretLeft size={18} color={C.textSecondary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Athletes</Text>
        <View style={{ flex: 1 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <MagnifyingGlass size={14} color={C.textMuted} weight="bold" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or username"
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {isGuest ? (
          <View style={styles.emptyContainer}>
            <Users size={40} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>Sign in to browse athletes.</Text>
          </View>
        ) : athletesQuery.isLoading && page === 1 ? (
          <SkeletonListRows count={6} />
        ) : athletesQuery.isError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Unable to load athletes.</Text>
          </View>
        ) : athletes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={40} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>No athletes found.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {athletes.map((a, index) => (
              <View key={a.id}>
                {index > 0 && <View style={styles.itemSeparator} />}
                <TouchableOpacity
                  onPress={() => handleAthletePress(a)}
                  activeOpacity={0.6}
                  style={styles.itemRow}
                >
                  <Avatar
                    size="sm"
                    fallback={(a.name || a.username || 'U').slice(0, 2)}
                    src={a.profileImageUrl || undefined}
                  />
                  <View style={styles.itemBody}>
                    <View style={styles.itemHeaderRow}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {a.name || 'TrackLit Athlete'}
                      </Text>
                      {isCoach(a) && (
                        <View style={styles.coachTag}>
                          <Text style={styles.coachTagText}>COACH</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemUsername} numberOfLines={1}>@{a.username}</Text>
                    {(a.isFollowing || a.isFollower) && (
                      <Text style={styles.itemMeta}>
                        {a.isFollowing ? 'Following' : ''}
                        {a.isFollowing && a.isFollower ? ' · ' : ''}
                        {a.isFollower ? 'Follows you' : ''}
                      </Text>
                    )}
                  </View>
                  {renderConnectionButton(a)}
                </TouchableOpacity>
              </View>
            ))}

            {hasMore && (
              <>
                <View style={styles.itemSeparator} />
                <TouchableOpacity
                  style={styles.loadMoreRow}
                  onPress={handleLoadMore}
                  disabled={athletesQuery.isFetching}
                  activeOpacity={0.6}
                >
                  {athletesQuery.isFetching ? (
                    <ActivityIndicator size="small" color={C.orange} />
                  ) : (
                    <Text style={styles.loadMoreText}>Show More</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.iconBg,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: C.textPrimary,
    fontSize: 13,
  },
  content: {
    padding: 16,
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
  itemSeparator: {
    height: 0.5,
    backgroundColor: C.border,
    marginLeft: 48,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
    flexShrink: 1,
  },
  itemUsername: {
    fontSize: 11,
    color: C.textMuted,
  },
  itemMeta: {
    fontSize: 10,
    color: C.textSecondary,
    marginTop: 1,
  },
  coachTag: {
    backgroundColor: 'rgba(255,122,0,0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  coachTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: C.orange,
    letterSpacing: 0.5,
  },
  connectButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: C.orange,
  },
  connectText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  loadMoreRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.orange,
  },
});
