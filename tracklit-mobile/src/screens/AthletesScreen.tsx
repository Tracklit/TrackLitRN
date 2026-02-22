import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, ChevronRight, UserPlus } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { WebScreen } from '@/components/web/Screen';
import { WebPageHeader } from '@/components/web/PageHeader';
import { WebCard } from '@/components/web/Card';
import { Button } from '@/components/ui/Button';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { SkeletonListRows } from '@/components/Skeleton';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

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

  // Fetch friends list
  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => apiRequest<Athlete[]>('/api/friends'),
    enabled: isAuthenticated && !isGuest,
  });

  // Fetch pending friend requests
  const pendingRequestsQuery = useQuery({
    queryKey: ['friend-requests-pending'],
    queryFn: () => apiRequest<FriendRequest[]>('/api/friend-requests/pending'),
    enabled: isAuthenticated && !isGuest,
  });

  const athletes = useMemo(() => athletesQuery.data?.athletes ?? [], [athletesQuery.data]);
  const friends = useMemo(() => friendsQuery.data ?? [], [friendsQuery.data]);
  const pendingFriendRequests = useMemo(() => pendingRequestsQuery.data ?? [], [pendingRequestsQuery.data]);
  const hasMore = athletesQuery.data?.pagination?.hasMore ?? false;

  // Check if user is a coach
  const isCoach = useCallback((athlete: Athlete) => {
    return athlete.bio?.toLowerCase().includes('coach') || false;
  }, []);

  // Check if already friends
  const isAlreadyFriend = useCallback((athleteId: number) => {
    return friends.some((friend) => friend.id === athleteId);
  }, [friends]);

  // Check if there's a pending friend request
  const hasPendingRequest = useCallback((athleteId: number) => {
    return pendingFriendRequests.some(
      (req) => req.toUserId === athleteId || req.fromUserId === athleteId
    );
  }, [pendingFriendRequests]);

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest<{ success: boolean }>(`/api/follow/${userId}`, {
        method: 'POST',
      });
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
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      Alert.alert('Error', error.message || 'Failed to send friend request');
    },
    onSettled: (_data, _error, userId: number) => {
      setPendingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    },
  });

  const handleConnect = useCallback((athleteId: number) => {
    sendFriendRequestMutation.mutate(athleteId);
  }, [sendFriendRequestMutation]);

  const handleAthletePress = useCallback((athlete: Athlete) => {
    // TODO: Navigate to user profile when it's implemented
    Alert.alert(
      athlete.name || 'TrackLit Athlete',
      `@${athlete.username}\n${athlete.bio || 'No bio available'}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Start Chat',
          onPress: () => {
            // Navigate to create/open conversation with this user
            navigation.navigate('ChatConversation', {
              conversationId: athlete.id,
              type: 'direct',
            });
          },
        },
      ]
    );
  }, [navigation]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !athletesQuery.isFetching) {
      setPage((prev) => prev + 1);
    }
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
          <Text variant="small" color="accent" weight="semiBold">Connected</Text>
        </View>
      );
    }

    if (isPending) {
      return (
        <View style={styles.pendingBadge}>
          <Text variant="small" color="warning" weight="semiBold">Pending</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => handleConnect(athlete.id)}
        disabled={isSending}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={theme.colors.background} />
        ) : (
          <>
            <UserPlus size={14} color={theme.colors.background} />
            <Text variant="small" weight="bold" style={styles.connectButtonText}>Connect</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }, [isAlreadyFriend, hasPendingRequest, pendingRequests, handleConnect]);

  return (
    <WebScreen backgroundColor="#0b1220" contentStyle={{ paddingTop: theme.spacing.lg }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight size={18} color={theme.colors.foreground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <WebPageHeader title="Athletes" description="Search athletes by name or username." />
      </View>

      <WebCard tone="muted" padding={theme.spacing.md}>
        <View style={styles.searchRow}>
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search athletes..."
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>
      </WebCard>

      {isGuest ? (
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          Sign in to browse athletes.
        </Text>
      ) : athletesQuery.isLoading && page === 1 ? (
        <View style={styles.center}>
          <SkeletonListRows count={4} />
        </View>
      ) : athletesQuery.isError ? (
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          Unable to load athletes.
        </Text>
      ) : athletes.length === 0 ? (
        <WebCard tone="muted" padding={theme.spacing.lg}>
          <View style={styles.emptyRow}>
            <Users size={24} color={theme.colors.textMuted} />
            <Text variant="body" color="muted">No athletes found.</Text>
          </View>
        </WebCard>
      ) : (
        <>
          {athletes.map((a) => (
            <TouchableOpacity key={a.id} onPress={() => handleAthletePress(a)} activeOpacity={0.7}>
              <WebCard tone="muted" padding={theme.spacing.md}>
                <View style={styles.itemRow}>
                  <Avatar size="md" fallback={(a.name || a.username || 'U').slice(0, 2)} src={a.profileImageUrl || undefined} />
                  <View style={styles.athleteInfo}>
                    <View style={styles.nameRow}>
                      <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                        {a.name || 'TrackLit Athlete'}
                      </Text>
                      {isCoach(a) && (
                        <View style={styles.coachBadge}>
                          <Text variant="caption" weight="bold" color="primary-foreground">COACH</Text>
                        </View>
                      )}
                    </View>
                    <Text variant="small" color="muted" numberOfLines={1}>
                      @{a.username}
                    </Text>
                    {(a.isFollowing || a.isFollower) && (
                      <Text variant="small" color="muted">
                        {a.isFollowing ? 'Following' : ''}
                        {a.isFollowing && a.isFollower ? ' • ' : ''}
                        {a.isFollower ? 'Follows you' : ''}
                      </Text>
                    )}
                  </View>
                  {renderConnectionButton(a)}
                </View>
              </WebCard>
            </TouchableOpacity>
          ))}

          {hasMore && (
            <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore} disabled={athletesQuery.isFetching}>
              {athletesQuery.isFetching ? (
                <ActivityIndicator size="small" color={theme.colors.foreground} />
              ) : (
                <Text variant="body" weight="semiBold" color="foreground">Show More</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#0f172a',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: { flex: 1, color: theme.colors.foreground },
  center: { alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.xl },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  athleteInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  coachBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#eab308',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 90,
    justifyContent: 'center',
  },
  connectButtonText: {
    color: '#000',
  },
  connectedBadge: {
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  pendingBadge: {
    borderWidth: 1,
    borderColor: '#eab308',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.md,
    backgroundColor: '#1f2937',
    borderRadius: theme.borderRadius.lg,
  },
});


