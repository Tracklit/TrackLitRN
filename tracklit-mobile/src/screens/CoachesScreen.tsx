import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, Trophy, ChevronRight, UserPlus, Check, Clock } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { WebScreen } from '@/components/web/Screen';
import { WebPageHeader } from '@/components/web/PageHeader';
import { WebCard } from '@/components/web/Card';
import { WebBadge } from '@/components/web/Badge';
import { WebButton } from '@/components/web/Button';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { SkeletonListRows } from '@/components/Skeleton';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

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

  // Fetch existing coaching relationships
  const myCoachesQuery = useQuery({
    queryKey: ['my-coaches'],
    queryFn: () => apiRequest<Coach[]>('/api/athlete/coaches'),
    enabled: isAuthenticated && !isGuest,
  });

  // Fetch pending coaching requests
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

  // Request coaching mutation
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
        const newSet = new Set(prev);
        newSet.delete(coachId);
        return newSet;
      });
      Alert.alert('Error', error.message || 'Failed to send coaching request');
    },
    onSettled: (_data, _error, coachId: number) => {
      setPendingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(coachId);
        return newSet;
      });
    },
  });

  const handleRequestCoaching = useCallback((coachId: number) => {
    requestCoachingMutation.mutate(coachId);
  }, [requestCoachingMutation]);

  const handleCoachPress = useCallback((coach: Coach) => {
    Alert.alert(
      coach.name,
      `@${coach.username}\n\n${coach.bio || 'No bio available'}${coach.location ? `\n\n📍 ${coach.location}` : ''}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Message',
          onPress: () => {
            navigation.navigate('ChatConversation', {
              conversationId: coach.id,
              type: 'direct',
            });
          },
        },
      ]
    );
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
        <View style={styles.coachBadge}>
          <Check size={14} color="#22c55e" />
          <Text variant="small" style={{ color: '#22c55e' }} weight="semiBold">Your Coach</Text>
        </View>
      );
    }

    if (isPending) {
      return (
        <View style={styles.pendingBadge}>
          <Clock size={14} color="#eab308" />
          <Text variant="small" style={{ color: '#eab308' }} weight="semiBold">Pending</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.requestButton}
        onPress={() => handleRequestCoaching(coach.id)}
        disabled={isSending}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <UserPlus size={14} color={theme.colors.primary} />
            <Text variant="small" color="primary" weight="semiBold">Request</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }, [isMyCoach, hasPendingRequest, pendingRequests, handleRequestCoaching]);

  return (
    <WebScreen backgroundColor="#0b1220" contentStyle={{ paddingTop: theme.spacing.lg }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight size={18} color={theme.colors.foreground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <WebPageHeader title="Coaches" description="Connect with experienced track and field coaches." />
      </View>

      <WebCard tone="muted" padding={theme.spacing.md}>
        <View style={styles.searchRow}>
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coaches by name, username, or bio..."
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </WebCard>

      {isGuest ? (
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          Sign in to browse coaches.
        </Text>
      ) : coachesQuery.isLoading ? (
        <View style={styles.center}>
          <SkeletonListRows count={4} />
        </View>
      ) : coachesQuery.isError ? (
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          Unable to load coaches.
        </Text>
      ) : filtered.length === 0 ? (
        <WebCard tone="muted" padding={theme.spacing.lg}>
          <View style={styles.emptyRow}>
            <Trophy size={24} color={theme.colors.textMuted} />
            <Text variant="body" color="muted">No coaches found.</Text>
          </View>
        </WebCard>
      ) : (
        filtered.map((coach) => (
          <TouchableOpacity key={coach.id} onPress={() => handleCoachPress(coach)} activeOpacity={0.7}>
            <WebCard tone="muted" padding={theme.spacing.md}>
              <View style={styles.itemRow}>
                <Avatar
                  size="lg"
                  fallback={coach.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  src={coach.profileImageUrl || undefined}
                />
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <View style={styles.nameRow}>
                    <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                      {coach.name}
                    </Text>
                    {!!coach.isVerified && (
                      <WebBadge variant="secondary">Verified</WebBadge>
                    )}
                  </View>
                  <Text variant="small" color="muted" numberOfLines={1}>
                    @{coach.username}
                  </Text>
                  {!!coach.location && (
                    <View style={styles.locationRow}>
                      <MapPin size={12} color={theme.colors.textMuted} />
                      <Text variant="small" color="muted" numberOfLines={1}>
                        {coach.location}
                      </Text>
                    </View>
                  )}
                  {!!coach.bio && (
                    <Text variant="small" color="muted" numberOfLines={2}>
                      {coach.bio}
                    </Text>
                  )}
                </View>
                {renderCoachButton(coach)}
              </View>
            </WebCard>
          </TouchableOpacity>
        ))
      )}
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  coachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#eab308',
  },
});


