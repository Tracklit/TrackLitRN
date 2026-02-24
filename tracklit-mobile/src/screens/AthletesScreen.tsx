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
  ArrowLeft,
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
  card: '#1C1F2B',
  orange: '#FF7A00',
  orangeLight: '#FF9D00',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C0FF',
  textMuted: '#8A90B5',
  border: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',
  green: '#22c55e',
  yellow: '#eab308',
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
      Alert.alert('Success', 'Friend request sent!');
    },
    onError: (error: Error, userId: number) => {
      setPendingRequests((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });
      Alert.alert('Error', error.message || 'Failed to send friend request');
    },
    onSettled: (_data, _error, userId: number) => {
      setPendingRequests((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });
    },
  });

  const handleConnect = useCallback((athleteId: number) => {
    sendFriendRequestMutation.mutate(athleteId);
  }, [sendFriendRequestMutation]);

  const handleAthletePress = useCallback((athlete: Athlete) => {
    navigation.navigate('ChatConversation', {
      conversationId: athlete.id,
      type: 'direct',
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
        <View style={styles.connectedBadge}>
          <CheckCircle size={14} color={C.green} weight="fill" />
          <Text style={styles.connectedText}>Connected</Text>
        </View>
      );
    }

    if (isPending) {
      return (
        <View style={styles.pendingBadge}>
          <Clock size={14} color={C.yellow} weight="fill" />
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => handleConnect(athlete.id)}
        disabled={isSending}
        activeOpacity={0.8}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <>
            <UserPlus size={14} color="#000" weight="fill" />
            <Text style={styles.connectButtonText}>Connect</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }, [isAlreadyFriend, hasPendingRequest, pendingRequests, handleConnect]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Athletes</Text>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageSubtitle}>Search athletes by name or username.</Text>

        <View style={styles.searchRow}>
          <MagnifyingGlass size={16} color={C.textMuted} weight="bold" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search athletes..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>

        {isGuest ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Sign in to browse athletes.</Text>
          </View>
        ) : athletesQuery.isLoading && page === 1 ? (
          <SkeletonListRows count={4} />
        ) : athletesQuery.isError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Unable to load athletes.</Text>
          </View>
        ) : athletes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={28} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>No athletes found.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {athletes.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.athleteCard}
                onPress={() => handleAthletePress(a)}
                activeOpacity={0.7}
              >
                <Avatar
                  size="md"
                  fallback={(a.name || a.username || 'U').slice(0, 2)}
                  src={a.profileImageUrl || undefined}
                />
                <View style={styles.athleteInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.athleteName} numberOfLines={1}>
                      {a.name || 'TrackLit Athlete'}
                    </Text>
                    {isCoach(a) && (
                      <View style={styles.coachTag}>
                        <Text style={styles.coachTagText}>COACH</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.athleteUsername} numberOfLines={1}>@{a.username}</Text>
                  {(a.isFollowing || a.isFollower) && (
                    <Text style={styles.followInfo}>
                      {a.isFollowing ? 'Following' : ''}
                      {a.isFollowing && a.isFollower ? ' · ' : ''}
                      {a.isFollower ? 'Follows you' : ''}
                    </Text>
                  )}
                </View>
                {renderConnectionButton(a)}
              </TouchableOpacity>
            ))}

            {hasMore && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={athletesQuery.isFetching}
                activeOpacity={0.8}
              >
                {athletesQuery.isFetching ? (
                  <ActivityIndicator size="small" color={C.orange} />
                ) : (
                  <Text style={styles.loadMoreText}>Show More</Text>
                )}
              </TouchableOpacity>
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
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  pageSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: C.glass,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    color: C.textPrimary,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
  },
  listContainer: {
    gap: 10,
  },
  athleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 14,
  },
  athleteInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  athleteName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    flexShrink: 1,
  },
  athleteUsername: {
    fontSize: 12,
    color: C.textMuted,
  },
  followInfo: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 2,
  },
  coachTag: {
    backgroundColor: 'rgba(255,122,0,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coachTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.orange,
    letterSpacing: 0.5,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.orange,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 90,
    justifyContent: 'center',
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 0.5,
    borderColor: C.green,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.green,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 0.5,
    borderColor: C.yellow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.yellow,
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 4,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.orange,
  },
});
