import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  List,
  MagnifyingGlass,
  Users,
  Heart,
  CurrencyDollar,
  GearSix,
  XCircle,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonListRows } from '@/components/Skeleton';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type TabKey = 'athletes' | 'subscribers' | 'mySubs' | 'offering';

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  orange: '#FF7A00',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.06)',
  iconBg: 'rgba(255,255,255,0.05)',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
};

interface CoachAthlete {
  id: number;
  username: string;
  name?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
}

interface MySubscription {
  id: number;
  status: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  totalAmount: number;
  coachId: number;
  coachName: string;
  coachUsername: string;
  subscriptionTitle: string;
  subscriptionDescription: string;
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
  coachId: number;
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

export const MyAthletesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const isCoach = (user as any)?.isCoach === true;

  const [tab, setTab] = useState<TabKey>(isCoach ? 'athletes' : 'mySubs');
  const [search, setSearch] = useState('');

  const athletesQuery = useQuery({
    queryKey: ['coach-athletes'],
    queryFn: () => apiRequest<CoachAthlete[]>('/api/coach/athletes'),
    enabled: isAuthenticated && !isGuest && isCoach,
  });

  const mySubsQuery = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => apiRequest<MySubscription[]>('/api/my-subscriptions'),
    enabled: isAuthenticated && !isGuest,
  });

  const mySubscribersQuery = useQuery({
    queryKey: ['my-subscribers'],
    queryFn: () => apiRequest<MySubscriber[]>('/api/my-subscribers'),
    enabled: isAuthenticated && !isGuest && isCoach,
  });

  const myOfferingQuery = useQuery({
    queryKey: ['my-subscription-offering'],
    queryFn: () => apiRequest<SubscriptionOffering | null>('/api/my-subscription'),
    enabled: isAuthenticated && !isGuest && isCoach,
  });

  const athletes = athletesQuery.data ?? [];
  const mySubscriptions = useMemo(() => mySubsQuery.data ?? [], [mySubsQuery.data]);
  const mySubscribers = useMemo(() => mySubscribersQuery.data ?? [], [mySubscribersQuery.data]);
  const myOffering = myOfferingQuery.data ?? null;

  const cancelSubscription = useMutation({
    mutationFn: async (purchaseId: number) => {
      return apiRequest(`/api/subscriptions/${purchaseId}/cancel`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
    },
  });

  const filteredAthletes = search.trim()
    ? athletes.filter((a) => {
        const q = search.trim().toLowerCase();
        return (
          (a.name?.toLowerCase().includes(q)) ||
          a.username.toLowerCase().includes(q)
        );
      })
    : athletes;

  const handleAthletePress = useCallback((athlete: CoachAthlete) => {
    navigation.navigate('PublicProfile', {
      userId: athlete.id,
      name: athlete.name,
      username: athlete.username,
      profileImageUrl: athlete.profileImageUrl,
    });
  }, [navigation]);

  const coachTabs: { key: TabKey; label: string }[] = [
    { key: 'athletes', label: 'Athletes' },
    { key: 'subscribers', label: 'Subscribers' },
    { key: 'mySubs', label: 'My Subs' },
    { key: 'offering', label: 'Offering' },
  ];

  const nonCoachTabs: { key: TabKey; label: string }[] = [
    { key: 'mySubs', label: 'My Subs' },
  ];

  const tabs = isCoach ? coachTabs : nonCoachTabs;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.drawerButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <List size={20} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Athletes</Text>
        <View style={{ flex: 1 }} />
      </View>

      {tab === 'athletes' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <MagnifyingGlass size={14} color={C.textMuted} weight="bold" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or username"
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      )}

      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabButton, tab === t.key && styles.tabButtonActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.6}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'athletes' && (
          <>
            {isGuest ? (
              <View style={styles.emptyContainer}>
                <Users size={40} color={C.textMuted} weight="fill" />
                <Text style={styles.emptyText}>Sign in to view your athletes.</Text>
              </View>
            ) : athletesQuery.isLoading ? (
              <SkeletonListRows count={6} />
            ) : athletesQuery.isError ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Unable to load athletes.</Text>
              </View>
            ) : filteredAthletes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={40} color={C.textMuted} weight="fill" />
                <Text style={styles.emptyText}>
                  {athletes.length === 0
                    ? 'No athletes yet. Athletes will appear here once they connect with you.'
                    : 'No athletes match your search.'}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filteredAthletes.map((a, index) => (
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
                        <Text style={styles.itemName} numberOfLines={1}>
                          {a.name || 'TrackLit Athlete'}
                        </Text>
                        <Text style={styles.itemUsername} numberOfLines={1}>@{a.username}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {tab === 'subscribers' && (
          <>
            {isGuest ? (
              <View style={styles.emptyContainer}>
                <Users size={40} color={C.textMuted} weight="fill" />
                <Text style={styles.emptyText}>Sign in to manage subscribers.</Text>
              </View>
            ) : mySubscribersQuery.isLoading ? (
              <SkeletonListRows count={2} />
            ) : mySubscribers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={40} color={C.textMuted} weight="fill" />
                <Text style={styles.emptyText}>No subscribers yet.</Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {mySubscribers.map((s) => (
                  <View key={s.id} style={styles.card}>
                    <View style={styles.cardRow}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.cardTitle}>{s.subscriberName}</Text>
                        <Text style={styles.cardSub}>
                          @{s.subscriberUsername} · {formatPrice(s.totalAmount)} / {s.priceInterval}
                        </Text>
                        <Text style={styles.cardMeta} numberOfLines={1}>
                          {s.subscriptionTitle}
                        </Text>
                      </View>
                      <View style={[styles.badge, s.status === 'active' ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.badgeText, s.status === 'active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
                          {s.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {tab === 'mySubs' && (
          <>
            {isGuest ? (
              <View style={styles.emptyContainer}>
                <Heart size={40} color={C.textMuted} weight="fill" />
                <Text style={styles.emptyText}>Sign in to manage subscriptions.</Text>
              </View>
            ) : mySubsQuery.isLoading ? (
              <SkeletonListRows count={2} />
            ) : mySubscriptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Heart size={40} color={C.textMuted} weight="fill" />
                <Text style={styles.emptyText}>No subscriptions yet.</Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {mySubscriptions.map((s) => (
                  <View key={s.id} style={styles.card}>
                    <View style={styles.cardRow}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.cardTitle}>{s.coachName}</Text>
                        <Text style={styles.cardSub}>
                          @{s.coachUsername} · {formatPrice(s.totalAmount)} / {s.priceInterval}
                        </Text>
                        <Text style={styles.cardMeta} numberOfLines={1}>
                          {s.subscriptionTitle}
                        </Text>
                      </View>
                      <View style={[styles.badge, s.status === 'active' ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.badgeText, s.status === 'active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
                          {s.status}
                        </Text>
                      </View>
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
                            <XCircle size={14} color={C.red} weight="bold" />
                            <Text style={styles.cancelText}>Cancel</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {tab === 'offering' && (
          <>
            {isGuest ? (
              <View style={styles.emptyContainer}>
                <GearSix size={40} color={C.textMuted} weight="fill" />
                <Text style={styles.emptyText}>Sign in to edit your offering.</Text>
              </View>
            ) : myOfferingQuery.isLoading ? (
              <SkeletonListRows count={2} />
            ) : (
              <View style={styles.cardList}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {myOffering?.title || 'Coaching Subscription'}
                  </Text>
                  <Text style={[styles.cardSub, { marginTop: 6 }]}>
                    {myOffering?.description || 'Get personalized coaching and training programs'}
                  </Text>
                  <Text style={[styles.priceText, { marginTop: 10 }]}>
                    {myOffering
                      ? `${formatPrice(myOffering.priceAmount, myOffering.priceCurrency)} / ${myOffering.priceInterval}`
                      : '$25.00 / month'}
                  </Text>
                  <TouchableOpacity style={styles.editButton} activeOpacity={0.6}>
                    <GearSix size={14} color={C.orange} weight="bold" />
                    <Text style={styles.editButtonText}>Edit Offering</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: C.card,
    margin: 12,
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: C.orange,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },
  tabTextActive: {
    color: '#000',
  },
  content: {
    padding: 16,
    gap: 16,
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
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: C.textSecondary,
  },
  cardMeta: {
    fontSize: 11,
    color: C.textMuted,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.orange,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  badgeTextActive: {
    color: C.green,
  },
  badgeTextInactive: {
    color: C.textMuted,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.red,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.3)',
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.orange,
  },
});
