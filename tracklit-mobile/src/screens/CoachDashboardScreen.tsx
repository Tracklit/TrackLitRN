import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  List,
  Users,
  Smiley,
  CaretDown,
  CaretRight,
  PaperPlaneTilt,
  Heart,
  GearSix,
  XCircle,
  NotePencil,
  ChartLineUp,
  CurrencyDollar,
  ArrowRight,
  ClipboardText,
  UserPlus,
  X,
  MagnifyingGlass,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonListRows } from '@/components/Skeleton';
import { MiniSparkline } from '@/components/MiniSparkline';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type PageKey = 'teamBoard' | 'myAthletes' | 'subscriptions';

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  cardAlt: '#181B27',
  orange: '#FF7A00',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.38)',
  border: 'rgba(255,255,255,0.07)',
  iconBg: 'rgba(255,255,255,0.05)',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#a855f7',
};

interface Friend {
  id: number;
  username: string;
  name?: string | null;
  profileImageUrl?: string | null;
}

interface CoachAthlete {
  id: number;
  username: string;
  name?: string | null;
  profileImageUrl?: string | null;
  relationshipId?: number;
}

interface AthleteMoodStat {
  athleteId: number;
  athleteName: string | null;
  athleteUsername: string;
  avgMood: string | null;
  entryCount: number;
  dailyTrend: { date: string; avg: number }[];
}

interface MoodStats {
  athletes: AthleteMoodStat[];
  overall: { avgMood: string | null; entryCount: number; dailyTrend: { date: string; avg: number }[] };
  timeRange: number;
}

interface AthleteJournalEntry {
  id: number;
  title: string | null;
  notes: string | null;
  content: string | null;
  createdAt: string;
  athleteId: number;
  athleteName: string | null;
  athleteUsername: string;
  athleteProfileImageUrl: string | null;
}

interface MySubscription {
  id: number;
  status: string;
  currentPeriodEnd?: string | null;
  totalAmount: number;
  coachId: number;
  coachName: string;
  coachUsername: string;
  subscriptionTitle: string;
  priceInterval: string;
}

interface MySubscriber {
  id: number;
  status: string;
  totalAmount: number;
  coachAmount: number;
  subscriberName: string;
  subscriberUsername: string;
  subscriptionTitle: string;
  priceInterval: string;
}

interface SubscriptionOffering {
  id: number;
  title: string;
  description: string;
  priceAmount: number;
  priceCurrency: string;
  priceInterval: string;
  isActive: boolean;
}

const formatPrice = (amountCents: number, currency = 'USD') => {
  const symbol = currency === 'EUR' ? '€' : '$';
  return `${symbol}${(amountCents / 100).toFixed(2)}`;
};

const formatRelativeTime = (dateStr: string) => {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const getMoodColor = (avg: number | null): string => {
  if (avg === null) return C.textMuted;
  if (avg >= 8) return C.green;
  if (avg >= 6) return '#84cc16';
  if (avg >= 4) return C.yellow;
  return C.red;
};

const getMoodLabel = (avg: number | null): string => {
  if (avg === null) return 'No data';
  if (avg >= 8) return 'Excellent';
  if (avg >= 6) return 'Good';
  if (avg >= 4) return 'Moderate';
  return 'Low';
};

const MoodDot: React.FC<{ avg: number | null; size?: number }> = ({ avg, size = 8 }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: getMoodColor(avg),
    }}
  />
);

export const CoachDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [page, setPage] = useState<PageKey>('teamBoard');
  const [athleteListOpen, setAthleteListOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');

  const athletesQuery = useQuery({
    queryKey: ['coach-athletes'],
    queryFn: () => apiRequest<CoachAthlete[]>('/api/coach/athletes'),
    enabled: isAuthenticated && !isGuest,
  });

  const moodStatsQuery = useQuery({
    queryKey: ['coach-mood-stats'],
    queryFn: () => apiRequest<MoodStats>('/api/coaches/mood-stats?timeRange=7'),
    enabled: isAuthenticated && !isGuest,
  });

  const journalQuery = useQuery({
    queryKey: ['coach-journal-entries'],
    queryFn: () => apiRequest<AthleteJournalEntry[]>('/api/coaches/journal-entries?limit=10'),
    enabled: isAuthenticated && !isGuest,
  });

  const mySubsQuery = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => apiRequest<MySubscription[]>('/api/my-subscriptions'),
    enabled: isAuthenticated && !isGuest,
  });

  const mySubscribersQuery = useQuery({
    queryKey: ['my-subscribers'],
    queryFn: () => apiRequest<MySubscriber[]>('/api/my-subscribers'),
    enabled: isAuthenticated && !isGuest,
  });

  const myOfferingQuery = useQuery({
    queryKey: ['my-subscription-offering'],
    queryFn: () => apiRequest<SubscriptionOffering | null>('/api/my-subscription'),
    enabled: isAuthenticated && !isGuest,
  });

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => apiRequest<Friend[]>('/api/friends'),
    enabled: isAuthenticated && !isGuest && showAddModal,
  });

  const addAthleteMutation = useMutation({
    mutationFn: (athleteId: number) =>
      apiRequest('/api/coach/athletes', { method: 'POST', data: { athleteId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-athletes'] });
      queryClient.invalidateQueries({ queryKey: ['coach-mood-stats'] });
      setShowAddModal(false);
      setAddSearch('');
    },
    onError: (error: any) => {
      Alert.alert('Failed to add athlete', error?.message || 'Please try again.');
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async (purchaseId: number) =>
      apiRequest(`/api/subscriptions/${purchaseId}/cancel`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] }),
  });

  const athletes = athletesQuery.data ?? [];
  const friends = friendsQuery.data ?? [];

  const availableConnections = useMemo(() => {
    const athleteIds = new Set(athletes.map((a) => a.id));
    const filtered = friends.filter((f) => !athleteIds.has(f.id));
    if (!addSearch.trim()) return filtered;
    const q = addSearch.trim().toLowerCase();
    return filtered.filter(
      (f) => f.name?.toLowerCase().includes(q) || f.username.toLowerCase().includes(q),
    );
  }, [friends, athletes, addSearch]);
  const moodStats = moodStatsQuery.data;
  const journalEntries = journalQuery.data ?? [];
  const mySubscriptions = useMemo(() => mySubsQuery.data ?? [], [mySubsQuery.data]);
  const mySubscribers = useMemo(() => mySubscribersQuery.data ?? [], [mySubscribersQuery.data]);
  const myOffering = myOfferingQuery.data ?? null;

  const overallAvg = moodStats?.overall?.avgMood ? parseFloat(moodStats.overall.avgMood) : null;
  const overallTrend = (moodStats?.overall?.dailyTrend ?? []).map(d => d.avg);
  const activeSubscribers = mySubscribers.filter(s => s.status === 'active');
  const monthlyRevenue = activeSubscribers.reduce((sum, s) => {
    const amount = s.coachAmount || s.totalAmount;
    return sum + (s.priceInterval === 'month' ? amount : amount / 12);
  }, 0);

  const handleAthletePress = useCallback((athlete: CoachAthlete) => {
    navigation.navigate('PublicProfile', {
      userId: athlete.id,
      name: athlete.name,
      username: athlete.username,
      profileImageUrl: athlete.profileImageUrl,
    });
  }, [navigation]);

  const startDMMutation = useMutation({
    mutationFn: (athleteId: number) =>
      apiRequest<{ conversationId: number }>('/api/conversations', {
        method: 'POST',
        data: { otherUserId: athleteId },
      }),
    onSuccess: (data) => {
      navigation.navigate('ChatConversation', {
        conversationId: data.conversationId,
        type: 'direct',
      });
    },
  });

  const removeAthleteMutation = useMutation({
    mutationFn: (relationshipId: number) =>
      apiRequest(`/api/coaches/${relationshipId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-athletes'] });
      queryClient.invalidateQueries({ queryKey: ['coach-mood-stats'] });
      queryClient.invalidateQueries({ queryKey: ['coach-journal-entries'] });
    },
  });

  const handleLongPressAthlete = useCallback((athlete: CoachAthlete) => {
    Alert.alert(
      'Remove Athlete',
      `Remove ${athlete.name || '@' + athlete.username} from your athlete roster?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (athlete.relationshipId) {
              removeAthleteMutation.mutate(athlete.relationshipId);
            }
          },
        },
      ]
    );
  }, [removeAthleteMutation]);

  const moodByAthlete = useMemo(() => {
    const map: Record<number, number | null> = {};
    moodStats?.athletes.forEach(a => {
      map[a.athleteId] = a.avgMood ? parseFloat(a.avgMood) : null;
    });
    return map;
  }, [moodStats]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.drawerButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <List size={20} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coach's Dashboard</Text>
        <View style={{ flex: 1 }} />
      </View>

      <View style={styles.pageTabRow}>
        {(['teamBoard', 'myAthletes', 'subscriptions'] as PageKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.pageTab, page === key && styles.pageTabActive]}
            onPress={() => setPage(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageTabText, page === key && styles.pageTabTextActive]}>
              {key === 'teamBoard' ? 'Team Board' : key === 'myAthletes' ? 'My Athletes' : 'Subscriptions'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        {page === 'teamBoard' && (
          <>
            {isGuest ? (
              <EmptyState icon={<ChartLineUp size={40} color={C.textMuted} weight="fill" />} text="Sign in to view your team board." />
            ) : (
              <>
                <MoodSummaryCard
                  overallAvg={overallAvg}
                  overallTrend={overallTrend}
                  athleteCount={athletes.length}
                  isLoading={moodStatsQuery.isLoading}
                  onPress={() => navigation.navigate('CoachTeamMood')}
                />

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <NotePencil size={14} color={C.orange} weight="fill" />
                      <Text style={styles.sectionTitle}>Recent Journal Entries</Text>
                    </View>
                  </View>

                  {journalQuery.isLoading ? (
                    <SkeletonListRows count={3} />
                  ) : journalEntries.length === 0 ? (
                    <View style={styles.card}>
                      <EmptyState
                        icon={<NotePencil size={32} color={C.textMuted} weight="fill" />}
                        text="No journal entries yet. Entries from your athletes will appear here."
                        compact
                      />
                    </View>
                  ) : (
                    <View style={styles.journalList}>
                      {journalEntries.map((entry) => (
                        <TouchableOpacity
                          key={entry.id}
                          style={styles.journalCard}
                          activeOpacity={0.75}
                          onPress={() =>
                            navigation.navigate('CoachAthleteDetail', {
                              athleteId: entry.athleteId,
                              athleteName: entry.athleteName,
                              athleteUsername: entry.athleteUsername,
                              athleteProfileImageUrl: entry.athleteProfileImageUrl,
                            })
                          }
                        >
                          <View style={styles.journalCardHeader}>
                            <View style={styles.journalAthlete}>
                              <Avatar
                                size="sm"
                                fallback={(entry.athleteName || entry.athleteUsername || 'U').slice(0, 2)}
                                src={entry.athleteProfileImageUrl || undefined}
                              />
                              <Text style={styles.journalAthleteName} numberOfLines={1}>
                                {entry.athleteName || `@${entry.athleteUsername}`}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.journalTime}>
                                {formatRelativeTime(entry.createdAt)}
                              </Text>
                              <CaretRight size={12} color={C.textMuted} weight="bold" />
                            </View>
                          </View>
                          {entry.title ? (
                            <Text style={styles.journalTitle} numberOfLines={1}>
                              {entry.title}
                            </Text>
                          ) : null}
                          <Text style={styles.journalBody} numberOfLines={2}>
                            {entry.notes || entry.content || 'No content'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </>
        )}

        {page === 'myAthletes' && (
          <>
            {isGuest ? (
              <EmptyState icon={<Users size={40} color={C.textMuted} weight="fill" />} text="Sign in to view your athletes." />
            ) : (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <TouchableOpacity
                    style={[styles.sectionHeader, { flex: 1 }]}
                    onPress={() => setAthleteListOpen(v => !v)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <Users size={14} color={C.orange} weight="fill" />
                      <Text style={styles.sectionTitle}>
                        Athletes ({athletes.length})
                      </Text>
                    </View>
                    {athleteListOpen
                      ? <CaretDown size={14} color={C.textMuted} weight="bold" />
                      : <CaretRight size={14} color={C.textMuted} weight="bold" />
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addAthleteHeaderBtn}
                    onPress={() => setShowAddModal(true)}
                    activeOpacity={0.6}
                  >
                    <UserPlus size={14} color={C.orange} weight="bold" />
                    <Text style={styles.addAthleteHeaderBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {athleteListOpen && (
                  <View style={styles.card}>
                    {athletesQuery.isLoading ? (
                      <SkeletonListRows count={4} />
                    ) : athletes.length === 0 ? (
                      <EmptyState
                        icon={<Users size={32} color={C.textMuted} weight="fill" />}
                        text="No athletes yet. Athletes will appear once they connect with you."
                        compact
                      />
                    ) : (
                      athletes.map((athlete, idx) => {
                        const moodAvg = moodByAthlete[athlete.id] ?? null;
                        return (
                          <View key={athlete.id}>
                            {idx > 0 && <View style={styles.rowDivider} />}
                            <View style={styles.athleteRow}>
                              <TouchableOpacity
                                style={styles.athleteInfo}
                                onPress={() =>
                                  navigation.navigate('CoachAthleteDetail', {
                                    athleteId: athlete.id,
                                    athleteName: athlete.name ?? null,
                                    athleteUsername: athlete.username,
                                    athleteProfileImageUrl: athlete.profileImageUrl ?? null,
                                  })
                                }
                                onLongPress={() => handleLongPressAthlete(athlete)}
                                delayLongPress={500}
                                activeOpacity={0.7}
                              >
                                <Avatar
                                  size="sm"
                                  fallback={(athlete.name || athlete.username || 'U').slice(0, 2)}
                                  src={athlete.profileImageUrl || undefined}
                                />
                                <View style={styles.athleteText}>
                                  <View style={styles.athleteNameRow}>
                                    <Text style={styles.athleteName} numberOfLines={1}>
                                      {athlete.name || 'Athlete'}
                                    </Text>
                                    <MoodDot avg={moodAvg} />
                                  </View>
                                  <Text style={styles.athleteUsername}>@{athlete.username}</Text>
                                </View>
                              </TouchableOpacity>
                              <View style={styles.athleteActions}>
                                <TouchableOpacity
                                  style={styles.dmButton}
                                  onPress={() => startDMMutation.mutate(athlete.id)}
                                  activeOpacity={0.7}
                                >
                                  <PaperPlaneTilt size={14} color={C.orange} weight="fill" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.assignButton}
                                  onPress={() =>
                                    navigation.navigate('CoachAssignProgram', {
                                      athleteId: athlete.id,
                                      athleteName: athlete.name ?? null,
                                      athleteUsername: athlete.username,
                                    })
                                  }
                                  activeOpacity={0.7}
                                >
                                  <ClipboardText size={14} color={C.orange} weight="fill" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {page === 'subscriptions' && (
          <>
            {isGuest ? (
              <EmptyState icon={<CurrencyDollar size={40} color={C.textMuted} weight="fill" />} text="Sign in to view subscriptions." />
            ) : (
              <>
                <View style={styles.statsRow}>
                  <StatCard
                    label="Active Subs"
                    value={mySubscribersQuery.isLoading ? '…' : String(activeSubscribers.length)}
                    color={C.green}
                  />
                  <StatCard
                    label="Est. Monthly"
                    value={mySubscribersQuery.isLoading ? '…' : formatPrice(monthlyRevenue)}
                    color={C.orange}
                  />
                  <StatCard
                    label="My Plans"
                    value={mySubsQuery.isLoading ? '…' : String(mySubscriptions.length)}
                    color={C.blue}
                  />
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <Users size={14} color={C.orange} weight="fill" />
                      <Text style={styles.sectionTitle}>Your Subscribers</Text>
                    </View>
                  </View>

                  {mySubscribersQuery.isLoading ? (
                    <SkeletonListRows count={3} />
                  ) : mySubscribers.length === 0 ? (
                    <View style={styles.card}>
                      <EmptyState
                        icon={<Users size={32} color={C.textMuted} weight="fill" />}
                        text="No subscribers yet."
                        compact
                      />
                    </View>
                  ) : (
                    <View style={styles.cardList}>
                      {mySubscribers.map((s) => (
                        <View key={s.id} style={styles.subCard}>
                          <View style={styles.subCardRow}>
                            <View style={{ flex: 1, gap: 3 }}>
                              <Text style={styles.subCardName}>{s.subscriberName}</Text>
                              <Text style={styles.subCardMeta}>
                                @{s.subscriberUsername} · {formatPrice(s.totalAmount)} / {s.priceInterval}
                              </Text>
                              <Text style={styles.subCardPlan} numberOfLines={1}>
                                {s.subscriptionTitle}
                              </Text>
                            </View>
                            <StatusBadge status={s.status} />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <GearSix size={14} color={C.orange} weight="fill" />
                      <Text style={styles.sectionTitle}>My Offering</Text>
                    </View>
                  </View>

                  {myOfferingQuery.isLoading ? (
                    <SkeletonListRows count={1} />
                  ) : (
                    <View style={styles.card}>
                      <Text style={styles.offeringTitle}>
                        {myOffering?.title || 'Coaching Subscription'}
                      </Text>
                      <Text style={[styles.subCardMeta, { marginTop: 6 }]}>
                        {myOffering?.description || 'Get personalized coaching and training programs'}
                      </Text>
                      <Text style={styles.offeringPrice}>
                        {myOffering
                          ? `${formatPrice(myOffering.priceAmount, myOffering.priceCurrency)} / ${myOffering.priceInterval}`
                          : '$25.00 / month'}
                      </Text>
                      <TouchableOpacity style={styles.editButton} activeOpacity={0.6}>
                        <GearSix size={13} color={C.orange} weight="bold" />
                        <Text style={styles.editButtonText}>Edit Offering</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <Heart size={14} color={C.orange} weight="fill" />
                      <Text style={styles.sectionTitle}>My Subscriptions</Text>
                    </View>
                  </View>

                  {mySubsQuery.isLoading ? (
                    <SkeletonListRows count={2} />
                  ) : mySubscriptions.length === 0 ? (
                    <View style={styles.card}>
                      <EmptyState
                        icon={<Heart size={32} color={C.textMuted} weight="fill" />}
                        text="You haven't subscribed to any coaches yet."
                        compact
                      />
                    </View>
                  ) : (
                    <View style={styles.cardList}>
                      {mySubscriptions.map((s) => (
                        <View key={s.id} style={styles.subCard}>
                          <View style={styles.subCardRow}>
                            <View style={{ flex: 1, gap: 3 }}>
                              <Text style={styles.subCardName}>{s.coachName}</Text>
                              <Text style={styles.subCardMeta}>
                                @{s.coachUsername} · {formatPrice(s.totalAmount)} / {s.priceInterval}
                              </Text>
                              <Text style={styles.subCardPlan} numberOfLines={1}>
                                {s.subscriptionTitle}
                              </Text>
                            </View>
                            <StatusBadge status={s.status} />
                          </View>
                          {s.status === 'active' && (
                            <TouchableOpacity
                              style={styles.cancelButton}
                              onPress={() => cancelSubscription.mutate(s.id)}
                              disabled={cancelSubscription.isPending}
                              activeOpacity={0.6}
                            >
                              {cancelSubscription.isPending ? (
                                <ActivityIndicator size="small" color={C.red} />
                              ) : (
                                <>
                                  <XCircle size={13} color={C.red} weight="bold" />
                                  <Text style={styles.cancelText}>Cancel</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Athlete Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Athlete from Connections</Text>
              <TouchableOpacity
                onPress={() => { setShowAddModal(false); setAddSearch(''); }}
                hitSlop={12}
              >
                <X size={20} color={C.textSecondary} weight="bold" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchRow}>
              <MagnifyingGlass size={14} color={C.textMuted} weight="bold" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search connections..."
                placeholderTextColor={C.textMuted}
                value={addSearch}
                onChangeText={setAddSearch}
                autoFocus
              />
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {friendsQuery.isLoading ? (
                <ActivityIndicator color={C.orange} style={{ marginTop: 32 }} />
              ) : availableConnections.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
                  <Users size={32} color={C.textMuted} weight="fill" />
                  <Text style={{ fontSize: 13, color: C.textMuted, textAlign: 'center' }}>
                    {friends.length === 0
                      ? 'No connections yet. Add friends first.'
                      : 'All connections are already your athletes.'}
                  </Text>
                </View>
              ) : (
                availableConnections.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.modalItem}
                    activeOpacity={0.6}
                    onPress={() => addAthleteMutation.mutate(friend.id)}
                    disabled={addAthleteMutation.isPending}
                  >
                    <Avatar
                      size="sm"
                      fallback={(friend.name || friend.username || 'U').slice(0, 2)}
                      src={friend.profileImageUrl || undefined}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: C.textPrimary }} numberOfLines={1}>
                        {friend.name || 'TrackLit User'}
                      </Text>
                      <Text style={{ fontSize: 11, color: C.textMuted }} numberOfLines={1}>
                        @{friend.username}
                      </Text>
                    </View>
                    <View style={styles.addAthleteBtn}>
                      <UserPlus size={14} color="#000" weight="bold" />
                      <Text style={styles.addAthleteBtnText}>Add</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const MoodSummaryCard: React.FC<{
  overallAvg: number | null;
  overallTrend: number[];
  athleteCount: number;
  isLoading: boolean;
  onPress: () => void;
}> = ({ overallAvg, overallTrend, athleteCount, isLoading, onPress }) => {
  const color = getMoodColor(overallAvg);
  const label = getMoodLabel(overallAvg);
  const avgDisplay = overallAvg !== null ? overallAvg.toFixed(1) : '—';

  return (
    <TouchableOpacity style={styles.moodCard} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.moodCardLeft}>
        <View style={[styles.moodIcon, { backgroundColor: `${color}20` }]}>
          <Smiley size={22} color={color} weight="fill" />
        </View>
        <View style={{ gap: 3 }}>
          <Text style={styles.moodLabel}>Team Mood</Text>
          <Text style={styles.moodSub}>
            {athleteCount} athlete{athleteCount !== 1 ? 's' : ''} · 7-day avg
          </Text>
          {overallTrend.length >= 2 && (
            <MiniSparkline data={overallTrend} width={90} height={22} strokeWidth={2} showDots />
          )}
        </View>
      </View>
      <View style={styles.moodRight}>
        {isLoading ? (
          <ActivityIndicator size="small" color={C.orange} />
        ) : (
          <>
            <Text style={[styles.moodScore, { color }]}>{avgDisplay}</Text>
            <Text style={[styles.moodStatus, { color }]}>{label}</Text>
          </>
        )}
        <CaretRight size={14} color={C.textMuted} weight="bold" style={{ marginLeft: 4 }} />
      </View>
    </TouchableOpacity>
  );
};

const StatCard: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isActive = status === 'active';
  return (
    <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
      <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
        {status}
      </Text>
    </View>
  );
};

const EmptyState: React.FC<{
  icon: React.ReactNode;
  text: string;
  compact?: boolean;
}> = ({ icon, text, compact }) => (
  <View style={[styles.emptyContainer, compact && styles.emptyContainerCompact]}>
    {icon}
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

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
  drawerButton: {
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

  pageTabRow: {
    flexDirection: 'row',
    backgroundColor: C.card,
    margin: 14,
    borderRadius: 10,
    padding: 3,
  },
  pageTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  pageTabActive: {
    backgroundColor: C.orange,
  },
  pageTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  pageTabTextActive: {
    color: '#000',
  },

  content: {
    paddingHorizontal: 14,
    gap: 0,
  },

  moodCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  moodCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
  },
  moodSub: {
    fontSize: 11,
    color: C.textMuted,
  },
  moodRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  moodScore: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  moodStatus: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.2,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: C.border,
  },

  rowDivider: {
    height: 0.5,
    backgroundColor: C.border,
    marginLeft: 48,
  },
  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  athleteInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  athleteText: {
    flex: 1,
    gap: 2,
  },
  athleteNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  athleteName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
    flexShrink: 1,
  },
  athleteUsername: {
    fontSize: 11,
    color: C.textMuted,
  },
  athleteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dmButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,122,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
  },
  assignButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,122,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
  },

  journalList: {
    gap: 10,
  },
  journalCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: C.border,
    gap: 6,
  },
  journalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journalAthlete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  journalAthleteName: {
    fontSize: 12,
    fontWeight: '600',
    color: C.orange,
    flexShrink: 1,
  },
  journalTime: {
    fontSize: 10,
    color: C.textMuted,
  },
  journalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },
  journalBody: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 17,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  cardList: {
    gap: 10,
  },
  subCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  subCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },
  subCardMeta: {
    fontSize: 11,
    color: C.textSecondary,
  },
  subCardPlan: {
    fontSize: 11,
    color: C.textMuted,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeActive: { backgroundColor: 'rgba(34,197,94,0.15)' },
  badgeInactive: { backgroundColor: 'rgba(255,255,255,0.06)' },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  badgeTextActive: { color: C.green },
  badgeTextInactive: { color: C.textMuted },

  offeringTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
  },
  offeringPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: C.orange,
    marginTop: 10,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.3)',
    backgroundColor: 'rgba(255,122,0,0.07)',
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.orange,
  },

  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.red,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyContainerCompact: {
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addAthleteHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.3)',
  },
  addAthleteHeaderBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.orange,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.iconBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 10,
    color: C.textPrimary,
    fontSize: 13,
  },
  modalList: {
    paddingHorizontal: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  addAthleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.orange,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addAthleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
});
