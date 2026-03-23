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
  Trophy,
  UserPlus,
  CheckCircle,
  Clock,
  MapPin,
  SealCheck,
  UserCircle,
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

interface Coach {
  id: number;
  username: string;
  name: string;
  profileImageUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  specialties?: string[] | null;
  isVerified?: boolean | null;
  isFollowing?: boolean | null;
  isFriend?: boolean | null;
}

interface CoachingRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  status: string;
}

interface Friend {
  id: number;
  username: string;
  name: string;
}

export const CoachesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');

  const [pendingConnects, setPendingConnects] = useState<Set<number>>(new Set());
  const [pendingCoachRequests, setPendingCoachRequests] = useState<Set<number>>(new Set());

  const coachesQuery = useQuery({
    queryKey: ['coaches'],
    queryFn: () => apiRequest<Coach[]>('/api/coaches'),
    enabled: isAuthenticated && !isGuest,
  });

  const myCoachesQuery = useQuery({
    queryKey: ['my-coaches'],
    queryFn: () => apiRequest<Coach[]>('/api/athlete/coaches'),
    enabled: isAuthenticated && !isGuest,
  });

  const coachingRequestsQuery = useQuery({
    queryKey: ['coaching-requests'],
    queryFn: () => apiRequest<{ sent: CoachingRequest[]; received: CoachingRequest[] }>('/api/coaching-requests'),
    enabled: isAuthenticated && !isGuest,
  });

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => apiRequest<Friend[]>('/api/friends'),
    enabled: isAuthenticated && !isGuest,
  });

  const myCoaches = useMemo(() => myCoachesQuery.data ?? [], [myCoachesQuery.data]);
  const sentRequests = useMemo(() => coachingRequestsQuery.data?.sent ?? [], [coachingRequestsQuery.data]);
  const friendIds = useMemo(() => {
    const set = new Set<number>();
    (friendsQuery.data ?? []).forEach((f) => set.add(f.id));
    return set;
  }, [friendsQuery.data]);

  const isMyCoach = useCallback((coachId: number) => {
    return myCoaches.some((c) => c.id === coachId);
  }, [myCoaches]);

  const hasPendingCoachRequest = useCallback((coachId: number) => {
    return sentRequests.some((r) => r.toUserId === coachId && r.status === 'pending');
  }, [sentRequests]);

  const isConnected = useCallback((coach: Coach) => {
    return (
      friendIds.has(coach.id) ||
      !!coach.isFollowing ||
      !!coach.isFriend ||
      pendingConnects.has(coach.id)
    );
  }, [friendIds, pendingConnects]);

  const connectMutation = useMutation({
    mutationFn: async (coachId: number) => {
      return apiRequest<{ success: boolean }>(`/api/follow/${coachId}`, { method: 'POST' });
    },
    onMutate: (coachId: number) => {
      setPendingConnects((prev) => new Set(prev).add(coachId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
    onError: (error: Error, coachId: number) => {
      const msg = (error?.message ?? '').toLowerCase();
      const alreadyFollowing =
        msg.includes('already following') ||
        msg.includes('already connected') ||
        msg.includes('already friend') ||
        msg.includes('duplicate') ||
        msg.includes('conflict');
      if (alreadyFollowing) {
        setPendingConnects((prev) => new Set(prev).add(coachId));
        queryClient.invalidateQueries({ queryKey: ['friends'] });
        queryClient.invalidateQueries({ queryKey: ['coaches'] });
      } else {
        setPendingConnects((prev) => {
          const s = new Set(prev);
          s.delete(coachId);
          return s;
        });
        Alert.alert('Error', error.message || 'Failed to connect');
      }
    },
  });

  const requestCoachingMutation = useMutation({
    mutationFn: async (coachId: number) => {
      return apiRequest<{ success: boolean }>('/api/coaching-requests', {
        method: 'POST',
        data: { toUserId: coachId },
      });
    },
    onMutate: (coachId: number) => {
      setPendingCoachRequests((prev) => new Set(prev).add(coachId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-coaches'] });
    },
    onError: (error: Error, coachId: number) => {
      setPendingCoachRequests((prev) => {
        const s = new Set(prev);
        s.delete(coachId);
        return s;
      });
      Alert.alert('Error', error.message || 'Failed to send coaching request');
    },
  });

  const handleConnect = useCallback((coachId: number) => {
    connectMutation.mutate(coachId);
  }, [connectMutation]);

  const handleRequestCoaching = useCallback((coachId: number) => {
    requestCoachingMutation.mutate(coachId);
  }, [requestCoachingMutation]);

  const handleCoachPress = useCallback(async (coach: Coach) => {
    try {
      const result = await apiRequest<{ conversationId: number }>('/api/conversations', {
        method: 'POST',
        data: { toUserId: coach.id },
      });
      navigation.navigate('ChatConversation', {
        conversationId: result.conversationId,
        type: 'direct',
      });
    } catch {
      navigation.navigate('Chat');
    }
  }, [navigation]);

  const filtered = useMemo(() => {
    const list = coachesQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      `${c.name} ${c.username} ${c.bio || ''}`.toLowerCase().includes(q),
    );
  }, [coachesQuery.data, search]);

  const renderCoachButton = useCallback((coach: Coach) => {
    if (isMyCoach(coach.id)) {
      return (
        <View style={styles.statusBadge}>
          <CheckCircle size={12} color={C.connected} weight="fill" />
          <Text style={[styles.statusText, { color: C.connected }]}>Your Coach</Text>
        </View>
      );
    }

    if (hasPendingCoachRequest(coach.id) || pendingCoachRequests.has(coach.id)) {
      return (
        <View style={styles.statusBadge}>
          <Clock size={12} color={C.requested} weight="fill" />
          <Text style={[styles.statusText, { color: C.requested }]}>Requested</Text>
        </View>
      );
    }

    if (isConnected(coach)) {
      const isSending = requestCoachingMutation.isPending && pendingCoachRequests.has(coach.id);
      return (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => handleRequestCoaching(coach.id)}
          disabled={isSending}
          activeOpacity={0.6}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.requestText}>Request Coaching</Text>
          )}
        </TouchableOpacity>
      );
    }

    if (pendingConnects.has(coach.id)) {
      return (
        <View style={styles.statusBadge}>
          <UserCircle size={12} color={C.connected} weight="fill" />
          <Text style={[styles.statusText, { color: C.connected }]}>Connected</Text>
        </View>
      );
    }

    const isConnecting = connectMutation.isPending && pendingConnects.has(coach.id);
    return (
      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => handleConnect(coach.id)}
        disabled={isConnecting}
        activeOpacity={0.6}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color={C.orange} />
        ) : (
          <>
            <UserPlus size={10} color={C.orange} weight="bold" />
            <Text style={styles.connectText}>Connect</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }, [
    isMyCoach,
    hasPendingCoachRequest,
    pendingCoachRequests,
    isConnected,
    pendingConnects,
    handleRequestCoaching,
    handleConnect,
    connectMutation.isPending,
    requestCoachingMutation.isPending,
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <CaretLeft size={18} color={C.textSecondary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coaches</Text>
        <View style={{ flex: 1 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <MagnifyingGlass size={14} color={C.textMuted} weight="bold" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or bio"
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.layerHint}>
        <Text style={styles.layerHintText}>
          Connect first, then request coaching from a connected coach.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {isGuest ? (
          <View style={styles.emptyContainer}>
            <Trophy size={40} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>Sign in to browse coaches.</Text>
          </View>
        ) : coachesQuery.isLoading ? (
          <SkeletonListRows count={6} />
        ) : coachesQuery.isError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Unable to load coaches.</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Trophy size={40} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>No coaches found.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((coach, index) => (
              <View key={coach.id}>
                {index > 0 && <View style={styles.itemSeparator} />}
                <TouchableOpacity
                  onPress={() => handleCoachPress(coach)}
                  activeOpacity={0.6}
                  style={styles.itemRow}
                >
                  <Avatar
                    size="sm"
                    fallback={coach.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    src={coach.profileImageUrl || undefined}
                  />
                  <View style={styles.itemBody}>
                    <View style={styles.itemHeaderRow}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {coach.name}
                      </Text>
                      {!!coach.isVerified && (
                        <SealCheck size={13} color={C.orange} weight="fill" />
                      )}
                    </View>
                    <Text style={styles.itemUsername} numberOfLines={1}>@{coach.username}</Text>
                    {!!coach.location && (
                      <View style={styles.locationRow}>
                        <MapPin size={10} color={C.textMuted} weight="fill" />
                        <Text style={styles.itemMeta} numberOfLines={1}>{coach.location}</Text>
                      </View>
                    )}
                    {!!coach.bio && (
                      <Text style={styles.itemBio} numberOfLines={1}>{coach.bio}</Text>
                    )}
                  </View>
                  {renderCoachButton(coach)}
                </TouchableOpacity>
              </View>
            ))}
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
  layerHint: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  layerHintText: {
    fontSize: 11,
    color: C.textMuted,
    lineHeight: 16,
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
    gap: 5,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  itemMeta: {
    fontSize: 10,
    color: C.textMuted,
  },
  itemBio: {
    fontSize: 11,
    color: C.textSecondary,
    lineHeight: 15,
    marginTop: 1,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.orange,
  },
  connectText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.orange,
  },
  requestButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: C.orange,
  },
  requestText: {
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
});
