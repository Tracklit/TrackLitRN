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
  Trophy,
  UserPlus,
  CheckCircle,
  Clock,
  MapPin,
  SealCheck,
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

interface Coach {
  id: number;
  username: string;
  name: string;
  profileImageUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  specialties?: string[] | null;
  isVerified?: boolean | null;
}

interface CoachingRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  status: string;
}

export const CoachesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [pendingRequests, setPendingRequests] = useState<Set<number>>(new Set());

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

  const myCoaches = useMemo(() => myCoachesQuery.data ?? [], [myCoachesQuery.data]);
  const sentRequests = useMemo(() => coachingRequestsQuery.data?.sent ?? [], [coachingRequestsQuery.data]);

  const isMyCoach = useCallback((coachId: number) => {
    return myCoaches.some((c) => c.id === coachId);
  }, [myCoaches]);

  const hasPendingRequest = useCallback((coachId: number) => {
    return sentRequests.some((r) => r.toUserId === coachId && r.status === 'pending');
  }, [sentRequests]);

  const requestCoachingMutation = useMutation({
    mutationFn: async (coachId: number) => {
      return apiRequest<{ success: boolean }>('/api/coaching-requests', {
        method: 'POST',
        data: {
          toUserId: coachId,
          requestType: 'athlete_request',
          message: "I'd like to request your coaching",
        },
      });
    },
    onMutate: (coachId: number) => {
      setPendingRequests((prev) => new Set(prev).add(coachId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-coaches'] });
      Alert.alert('Success', 'Coaching request sent!');
    },
    onError: (error: Error, coachId: number) => {
      setPendingRequests((prev) => {
        const s = new Set(prev);
        s.delete(coachId);
        return s;
      });
      Alert.alert('Error', error.message || 'Failed to send coaching request');
    },
    onSettled: (_data, _error, coachId: number) => {
      setPendingRequests((prev) => {
        const s = new Set(prev);
        s.delete(coachId);
        return s;
      });
    },
  });

  const handleRequestCoaching = useCallback((coachId: number) => {
    requestCoachingMutation.mutate(coachId);
  }, [requestCoachingMutation]);

  const handleCoachPress = useCallback((coach: Coach) => {
    navigation.navigate('ChatConversation', {
      conversationId: coach.id,
      type: 'direct',
    });
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
    const isCoached = isMyCoach(coach.id);
    const isPending = hasPendingRequest(coach.id) || pendingRequests.has(coach.id);
    const isSending = pendingRequests.has(coach.id);

    if (isCoached) {
      return (
        <View style={styles.connectedBadge}>
          <CheckCircle size={14} color={C.green} weight="fill" />
          <Text style={styles.connectedText}>Your Coach</Text>
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
        style={styles.requestButton}
        onPress={() => handleRequestCoaching(coach.id)}
        disabled={isSending}
        activeOpacity={0.8}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={C.orange} />
        ) : (
          <>
            <UserPlus size={14} color={C.orange} weight="fill" />
            <Text style={styles.requestButtonText}>Request</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }, [isMyCoach, hasPendingRequest, pendingRequests, handleRequestCoaching]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coaches</Text>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageSubtitle}>Connect with experienced track and field coaches.</Text>

        <View style={styles.searchRow}>
          <MagnifyingGlass size={16} color={C.textMuted} weight="bold" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coaches by name or bio..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {isGuest ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Sign in to browse coaches.</Text>
          </View>
        ) : coachesQuery.isLoading ? (
          <SkeletonListRows count={4} />
        ) : coachesQuery.isError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Unable to load coaches.</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Trophy size={28} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>No coaches found.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filtered.map((coach) => (
              <TouchableOpacity
                key={coach.id}
                style={styles.coachCard}
                onPress={() => handleCoachPress(coach)}
                activeOpacity={0.7}
              >
                <Avatar
                  size="lg"
                  fallback={coach.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  src={coach.profileImageUrl || undefined}
                />
                <View style={styles.coachInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.coachName} numberOfLines={1}>
                      {coach.name}
                    </Text>
                    {!!coach.isVerified && (
                      <SealCheck size={16} color={C.orange} weight="fill" />
                    )}
                  </View>
                  <Text style={styles.coachUsername} numberOfLines={1}>@{coach.username}</Text>
                  {!!coach.location && (
                    <View style={styles.locationRow}>
                      <MapPin size={12} color={C.textMuted} weight="fill" />
                      <Text style={styles.locationText} numberOfLines={1}>{coach.location}</Text>
                    </View>
                  )}
                  {!!coach.bio && (
                    <Text style={styles.bioText} numberOfLines={2}>{coach.bio}</Text>
                  )}
                </View>
                {renderCoachButton(coach)}
              </TouchableOpacity>
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
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 14,
  },
  coachInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coachName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    flexShrink: 1,
  },
  coachUsername: {
    fontSize: 12,
    color: C.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: C.textMuted,
  },
  bioText: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.orange,
  },
  requestButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.orange,
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
});
