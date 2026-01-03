import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
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
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  totalAmount: number;
  coachAmount: number;
  subscriberId: number;
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

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [title, setTitle] = useState('Coaching Subscription');
  const [description, setDescription] = useState('Get personalized coaching and training programs');
  const [priceAmount, setPriceAmount] = useState('25.00');
  const [priceCurrency, setPriceCurrency] = useState<'USD' | 'EUR'>('USD');
  const [priceInterval, setPriceInterval] = useState<'week' | 'month' | 'year'>('month');

  const openEditOffering = () => {
    setTitle(myOffering?.title || 'Coaching Subscription');
    setDescription(myOffering?.description || 'Get personalized coaching and training programs');
    setPriceAmount(myOffering?.priceAmount ? (myOffering.priceAmount / 100).toFixed(2) : '25.00');
    setPriceCurrency((myOffering?.priceCurrency as any) || 'USD');
    setPriceInterval((myOffering?.priceInterval as any) || 'month');
    setEditModalOpen(true);
  };

  const createOrUpdateOffering = useMutation({
    mutationFn: async () => {
      const dollars = Number(priceAmount);
      if (!Number.isFinite(dollars) || dollars <= 0) {
        throw new Error('Price must be a positive number');
      }
      const cents = Math.round(dollars * 100);
      return apiRequest('/api/subscriptions', {
        method: 'POST',
        data: {
          title: title.trim(),
          description: description.trim(),
          priceAmount: cents,
          priceCurrency,
          priceInterval,
        },
      });
    },
    onSuccess: () => {
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['my-subscription-offering'] });
      Alert.alert('Saved', 'Your subscription offering has been updated.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to save offering');
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async (purchaseId: number) => {
      return apiRequest(`/api/subscriptions/${purchaseId}/cancel`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
    },
  });

  const canUse = isAuthenticated && !isGuest;

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" color="foreground">
          Subscriptions
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'subscriptions' && styles.activeTab]} onPress={() => setTab('subscriptions')}>
            <Text variant="small" weight="medium" color={tab === 'subscriptions' ? 'foreground' : 'muted'}>
              My Subs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'subscribers' && styles.activeTab]} onPress={() => setTab('subscribers')}>
            <Text variant="small" weight="medium" color={tab === 'subscribers' ? 'foreground' : 'muted'}>
              Subscribers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'offering' && styles.activeTab]} onPress={() => setTab('offering')}>
            <Text variant="small" weight="medium" color={tab === 'offering' ? 'foreground' : 'muted'}>
              Offering
            </Text>
          </TouchableOpacity>
        </View>

        {!canUse ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Sign in to manage subscriptions.
          </Text>
        ) : tab === 'subscriptions' ? (
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Coaches I'm subscribed to</CardTitle>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.md }}>
              {mySubsQuery.isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text variant="body" color="muted">Loading…</Text>
                </View>
              ) : mySubsQuery.isError ? (
                <Text variant="body" color="muted" style={styles.emptyText}>
                  Unable to load subscriptions.
                </Text>
              ) : mySubscriptions.length === 0 ? (
                <Text variant="body" color="muted" style={styles.emptyText}>
                  No subscriptions yet.
                </Text>
              ) : (
                <View style={{ gap: theme.spacing.sm }}>
                  {mySubscriptions.map((s) => (
                    <Card key={s.id} style={{ marginBottom: 0 }}>
                      <CardContent style={styles.row}>
                        <View style={{ flex: 1, gap: 2 }}>
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
                        {s.status === 'active' && (
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => cancelSubscription.mutate(s.id)}
                            disabled={cancelSubscription.isPending}
                          >
                            <FontAwesome5 name="ban" size={14} color={theme.colors.destructive} solid />
                          </TouchableOpacity>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        ) : tab === 'subscribers' ? (
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Athletes subscribed to me</CardTitle>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.md }}>
              {mySubscribersQuery.isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text variant="body" color="muted">Loading…</Text>
                </View>
              ) : mySubscribersQuery.isError ? (
                <Text variant="body" color="muted" style={styles.emptyText}>
                  Unable to load subscribers.
                </Text>
              ) : mySubscribers.length === 0 ? (
                <Text variant="body" color="muted" style={styles.emptyText}>
                  No subscribers yet.
                </Text>
              ) : (
                <View style={{ gap: theme.spacing.sm }}>
                  {mySubscribers.map((s) => (
                    <Card key={s.id} style={{ marginBottom: 0 }}>
                      <CardContent style={styles.row}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text variant="body" weight="semiBold" color="foreground">
                            {s.subscriberName}
                          </Text>
                          <Text variant="small" color="muted">
                            @{s.subscriberUsername} • Earn {formatPrice(s.coachAmount)} / {s.priceInterval}
                          </Text>
                          <Text variant="small" color="muted" numberOfLines={1}>
                            {s.subscriptionTitle} • {s.status}
                          </Text>
                        </View>
                      </CardContent>
                    </Card>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>My subscription offering</CardTitle>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.md }}>
              {myOfferingQuery.isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text variant="body" color="muted">Loading…</Text>
                </View>
              ) : myOfferingQuery.isError ? (
                <Text variant="body" color="muted" style={styles.emptyText}>
                  Unable to load offering.
                </Text>
              ) : !myOffering ? (
                <>
                  <Text variant="body" color="muted" style={styles.emptyText}>
                    You don’t have an active offering yet.
                  </Text>
                  <Button variant="default" onPress={openEditOffering}>
                    Create offering
                  </Button>
                </>
              ) : (
                <>
                  <Text variant="body" weight="semiBold" color="foreground">
                    {myOffering.title}
                  </Text>
                  <Text variant="small" color="muted">
                    {myOffering.description}
                  </Text>
                  <Text variant="body" color="foreground">
                    {formatPrice(myOffering.priceAmount, myOffering.priceCurrency)} / {myOffering.priceInterval}
                  </Text>

                  <Button variant="outline" onPress={openEditOffering}>
                    Edit offering
                  </Button>

                  <Text variant="small" color="muted">
                    Program inclusion management (add/remove programs) is wired in the backend and will be added to mobile next.
                  </Text>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </ScrollView>

      <Modal
        visible={editModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.modalTitle}>
              Subscription offering
            </Text>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={theme.colors.textMuted}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor={theme.colors.textMuted}
              multiline
            />
            <TextInput
              style={styles.input}
              value={priceAmount}
              onChangeText={setPriceAmount}
              placeholder="Price (e.g. 25.00)"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
            />

            <View style={styles.pillRow}>
              {(['USD', 'EUR'] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pill, priceCurrency === c && styles.pillActive]}
                  onPress={() => setPriceCurrency(c)}
                >
                  <Text variant="small" weight="medium" color={priceCurrency === c ? 'foreground' : 'muted'}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.pillRow}>
              {(['week', 'month', 'year'] as const).map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.pill, priceInterval === i && styles.pillActive]}
                  onPress={() => setPriceInterval(i)}
                >
                  <Text variant="small" weight="medium" color={priceInterval === i ? 'foreground' : 'muted'}>
                    {i}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button variant="ghost" onPress={() => setEditModalOpen(false)} disabled={createOrUpdateOffering.isPending} style={styles.modalButton}>
                Cancel
              </Button>
              <Button variant="default" onPress={() => createOrUpdateOffering.mutate()} loading={createOrUpdateOffering.isPending} style={styles.modalButton}>
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerSpacer: { flex: 1 },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.muted,
    padding: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.backgroundSolid,
  },
  emptyText: { textAlign: 'center', lineHeight: 22, paddingVertical: theme.spacing.lg },
  card: { marginBottom: 0 },
  center: { alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.backgroundSolid,
    padding: theme.spacing.lg,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    gap: theme.spacing.md,
  },
  modalTitle: { textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row', gap: theme.spacing.sm },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  pillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing.md },
  modalButton: { minWidth: 120 },
});
