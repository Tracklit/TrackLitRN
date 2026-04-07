import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CaretLeft,
  Heart,
  Users,
  CurrencyDollar,
  GearSix,
  XCircle,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { SkeletonListRows } from '@/components/Skeleton';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
type Navigation = NativeStackNavigationProp<RootStackParamList>;
type TabKey = 'subscriptions' | 'subscribers' | 'offering';


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

export const SubscriptionsScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [tab, setTab] = useState<TabKey>('subscriptions');

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

  const activeSubCount = mySubscriptions.filter((s) => s.status === 'active').length;
  const activeSubscriberCount = mySubscribers.filter((s) => s.status === 'active').length;
  const monthlyIncome = mySubscribers
    .filter((s) => s.status === 'active')
    .reduce((sum, sub) => sum + (sub.coachAmount || 0), 0);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'subscriptions', label: 'Subscriptions' },
    { key: 'subscribers', label: 'Subscribers' },
    { key: 'offering', label: 'Offering' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <CaretLeft size={18} color={theme.colors.textSecondary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscriptions</Text>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Heart size={20} color={theme.colors.destructive} weight="fill" />
            <Text style={styles.statValue}>{activeSubCount}</Text>
            <Text style={styles.statLabel}>Active Subs</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={20} color={'#3b82f6'} weight="fill" />
            <Text style={styles.statValue}>{activeSubscriberCount}</Text>
            <Text style={styles.statLabel}>Subscribers</Text>
          </View>
          <View style={styles.statCard}>
            <CurrencyDollar size={20} color={theme.colors.success} weight="fill" />
            <Text style={styles.statValue}>{formatPrice(monthlyIncome)}</Text>
            <Text style={styles.statLabel}>Monthly</Text>
          </View>
        </View>

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

        {tab === 'subscriptions' && (
          <>
            {isGuest ? (
              <View style={styles.emptyContainer}>
                <Heart size={40} color={theme.colors.textMuted} weight="fill" />
                <Text style={styles.emptyText}>Sign in to manage subscriptions.</Text>
              </View>
            ) : mySubsQuery.isLoading ? (
              <SkeletonListRows count={2} />
            ) : mySubscriptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Heart size={40} color={theme.colors.textMuted} weight="fill" />
                <Text style={styles.emptyText}>No subscriptions yet.</Text>
              </View>
            ) : (
              mySubscriptions.map((s) => (
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
                        <ActivityIndicator size="small" color={theme.colors.destructive} />
                      ) : (
                        <>
                          <XCircle size={14} color={theme.colors.destructive} weight="bold" />
                          <Text style={styles.cancelText}>Cancel</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {tab === 'subscribers' && (
          <>
            {isGuest ? (
              <View style={styles.emptyContainer}>
                <Users size={40} color={theme.colors.textMuted} weight="fill" />
                <Text style={styles.emptyText}>Sign in to manage subscribers.</Text>
              </View>
            ) : mySubscribersQuery.isLoading ? (
              <SkeletonListRows count={2} />
            ) : mySubscribers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={40} color={theme.colors.textMuted} weight="fill" />
                <Text style={styles.emptyText}>No subscribers yet.</Text>
              </View>
            ) : (
              mySubscribers.map((s) => (
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
              ))
            )}
          </>
        )}

        {tab === 'offering' && (
          <>
            {isGuest ? (
              <View style={styles.emptyContainer}>
                <GearSix size={40} color={theme.colors.textMuted} weight="fill" />
                <Text style={styles.emptyText}>Sign in to edit your offering.</Text>
              </View>
            ) : myOfferingQuery.isLoading ? (
              <SkeletonListRows count={2} />
            ) : (
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
                  <GearSix size={14} color={theme.colors.brandOrange} weight="bold" />
                  <Text style={styles.editButtonText}>Edit Offering</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.backgroundSolid },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: t.colors.overlayLight,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.colors.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: t.colors.textPrimary,
    letterSpacing: 0.3,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: t.colors.textMuted,
    letterSpacing: 0.3,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: t.colors.cardSolid,
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
    backgroundColor: t.colors.brandOrange,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: t.colors.textMuted,
  },
  tabTextActive: {
    color: '#000',
  },
  card: {
    backgroundColor: t.colors.cardSolid,
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
    color: t.colors.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: t.colors.textSecondary,
  },
  cardMeta: {
    fontSize: 11,
    color: t.colors.textMuted,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: t.colors.brandOrange,
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
    backgroundColor: t.colors.overlaySubtle,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  badgeTextActive: {
    color: t.colors.success,
  },
  badgeTextInactive: {
    color: t.colors.textMuted,
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
    color: t.colors.destructive,
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
    color: t.colors.brandOrange,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: t.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
