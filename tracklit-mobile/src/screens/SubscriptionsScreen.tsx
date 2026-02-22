import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Heart, Users, DollarSign, Settings, ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { WebScreen } from '@/components/web/Screen';
import { WebPageHeader } from '@/components/web/PageHeader';
import { WebCard } from '@/components/web/Card';
import { WebTabs, WebTabsList, WebTabsTrigger, WebTabsContent } from '@/components/web/Tabs';
import { WebBadge } from '@/components/web/Badge';
import { WebButton } from '@/components/web/Button';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { SkeletonListRows } from '@/components/Skeleton';
import theme from '@/utils/theme';

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

  return (
    <WebScreen
      backgroundColor="#f3f4f6"
      contentStyle={{ paddingTop: theme.spacing.lg }}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight size={18} color="#0f172a" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <WebPageHeader
          title="My Subscriptions"
          description="Manage your coaching subscriptions and subscriber relationships"
        />
      </View>

      <View style={styles.statsGrid}>
        <WebCard tone="light" padding={theme.spacing.lg}>
          <View style={styles.statsRow}>
            <Heart size={24} color="#ef4444" />
            <View>
              <Text variant="h4" weight="bold" color="foreground">
                {mySubscriptions.filter((s) => s.status === 'active').length}
              </Text>
              <Text variant="small" color="muted">Active Subscriptions</Text>
            </View>
          </View>
        </WebCard>
        <WebCard tone="light" padding={theme.spacing.lg}>
          <View style={styles.statsRow}>
            <Users size={24} color="#3b82f6" />
            <View>
              <Text variant="h4" weight="bold" color="foreground">
                {mySubscribers.filter((s) => s.status === 'active').length}
              </Text>
              <Text variant="small" color="muted">Active Subscribers</Text>
            </View>
          </View>
        </WebCard>
        <WebCard tone="light" padding={theme.spacing.lg}>
          <View style={styles.statsRow}>
            <DollarSign size={24} color="#22c55e" />
            <View>
              <Text variant="h4" weight="bold" color="foreground">
                {formatPrice(
                  mySubscribers
                    .filter((s) => s.status === 'active')
                    .reduce((sum, sub) => sum + (sub.coachAmount || 0), 0),
                )}
              </Text>
              <Text variant="small" color="muted">Monthly Income</Text>
            </View>
          </View>
        </WebCard>
      </View>

      <WebTabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <WebTabsList>
          <WebTabsTrigger value="subscriptions">My Subscriptions</WebTabsTrigger>
          <WebTabsTrigger value="subscribers">My Subscribers</WebTabsTrigger>
          <WebTabsTrigger value="offering">My Offering</WebTabsTrigger>
        </WebTabsList>

        <WebTabsContent value="subscriptions">
          {isGuest ? (
            <Text variant="body" color="muted">Sign in to manage subscriptions.</Text>
          ) : mySubsQuery.isLoading ? (
            <SkeletonListRows count={2} hasAvatar={false} />
          ) : mySubscriptions.length === 0 ? (
            <WebCard tone="muted" padding={theme.spacing.md}>
              <Text variant="body" color="muted">No subscriptions yet.</Text>
            </WebCard>
          ) : (
            mySubscriptions.map((s) => (
              <WebCard key={s.id} tone="muted" padding={theme.spacing.md}>
                <View style={styles.itemRow}>
                  <View style={{ flex: 1, gap: theme.spacing.xs }}>
                    <Text variant="body" weight="semiBold" color="foreground">
                      {s.coachName}
                    </Text>
                    <Text variant="small" color="muted">
                      @{s.coachUsername} • {formatPrice(s.totalAmount)} / {s.priceInterval}
                    </Text>
                    <Text variant="small" color="muted" numberOfLines={1}>
                      {s.subscriptionTitle}
                    </Text>
                  </View>
                  <WebBadge variant="secondary">{s.status}</WebBadge>
                </View>
                {s.status === 'active' && (
                  <WebButton
                    variant="outline"
                    size="sm"
                    onPress={() => cancelSubscription.mutate(s.id)}
                    disabled={cancelSubscription.isPending}
                    style={{ marginTop: theme.spacing.sm }}
                  >
                    Cancel
                  </WebButton>
                )}
              </WebCard>
            ))
          )}
        </WebTabsContent>

        <WebTabsContent value="subscribers">
          {isGuest ? (
            <Text variant="body" color="muted">Sign in to manage subscribers.</Text>
          ) : mySubscribersQuery.isLoading ? (
            <SkeletonListRows count={2} hasAvatar={false} />
          ) : mySubscribers.length === 0 ? (
            <WebCard tone="muted" padding={theme.spacing.md}>
              <Text variant="body" color="muted">No subscribers yet.</Text>
            </WebCard>
          ) : (
            mySubscribers.map((s) => (
              <WebCard key={s.id} tone="muted" padding={theme.spacing.md}>
                <View style={styles.itemRow}>
                  <View style={{ flex: 1, gap: theme.spacing.xs }}>
                    <Text variant="body" weight="semiBold" color="foreground">
                      {s.subscriberName}
                    </Text>
                    <Text variant="small" color="muted">
                      @{s.subscriberUsername} • {formatPrice(s.totalAmount)} / {s.priceInterval}
                    </Text>
                    <Text variant="small" color="muted" numberOfLines={1}>
                      {s.subscriptionTitle}
                    </Text>
                  </View>
                  <WebBadge variant="secondary">{s.status}</WebBadge>
                </View>
              </WebCard>
            ))
          )}
        </WebTabsContent>

        <WebTabsContent value="offering">
          {isGuest ? (
            <Text variant="body" color="muted">Sign in to edit your offering.</Text>
          ) : myOfferingQuery.isLoading ? (
            <SkeletonListRows count={2} hasAvatar={false} />
          ) : (
            <WebCard tone="muted" padding={theme.spacing.md}>
              <Text variant="body" weight="semiBold" color="foreground" style={{ marginBottom: theme.spacing.xs }}>
                {myOffering?.title || 'Coaching Subscription'}
              </Text>
              <Text variant="small" color="muted" style={{ marginBottom: theme.spacing.sm }}>
                {myOffering?.description || 'Get personalized coaching and training programs'}
              </Text>
              <Text variant="small" color="muted">
                {myOffering
                  ? `${formatPrice(myOffering.priceAmount, myOffering.priceCurrency)} / ${myOffering.priceInterval}`
                  : '$25.00 / month'}
              </Text>
              <WebButton variant="outline" size="sm" style={{ marginTop: theme.spacing.md }}>
                <Settings size={14} color={theme.colors.foreground} />
                Edit Offering
              </WebButton>
            </WebCard>
          )}
        </WebTabsContent>
      </WebTabs>
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
});


