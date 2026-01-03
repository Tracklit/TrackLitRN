import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type TabKey = 'overview' | 'history' | 'achievements';

interface LoginStreak {
  currentStreak: number;
  longestStreak: number;
}

interface SpikeTransaction {
  id: number;
  amount: number;
  type: string;
  source?: string | null;
  description?: string | null;
  createdAt: string;
}

interface UserAchievement {
  id: number;
  name: string;
  description: string;
  category?: string;
  spikeReward?: number;
  isCompleted?: boolean;
  createdAt?: string;
}

export const SpikesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const isGuest = user?.id === 'guest';

  const [tab, setTab] = useState<TabKey>('overview');

  const spikesBalance = Number((user as any)?.spikes ?? 0);

  const streakQuery = useQuery({
    queryKey: ['login-streak'],
    queryFn: () => apiRequest<LoginStreak>('/api/user/streak'),
    enabled: isAuthenticated && !isGuest,
  });

  const transactionsQuery = useQuery({
    queryKey: ['spike-transactions'],
    queryFn: () => apiRequest<SpikeTransaction[]>('/api/user/spikes/transactions'),
    enabled: isAuthenticated && !isGuest,
  });

  const achievementsQuery = useQuery({
    queryKey: ['user-achievements'],
    queryFn: () => apiRequest<UserAchievement[]>('/api/user/achievements'),
    enabled: isAuthenticated && !isGuest,
  });

  const checkInMutation = useMutation({
    mutationFn: () => apiRequest<LoginStreak>('/api/check-daily-login', { method: 'POST' }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['login-streak'] });
      await refreshUser();
    },
  });

  const streak = streakQuery.data ?? { currentStreak: 0, longestStreak: 0 };
  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);
  const achievements = useMemo(() => achievementsQuery.data ?? [], [achievementsQuery.data]);

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
          Spikes
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'overview' && styles.activeTab]} onPress={() => setTab('overview')}>
            <Text variant="small" weight="medium" color={tab === 'overview' ? 'foreground' : 'muted'}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'achievements' && styles.activeTab]} onPress={() => setTab('achievements')}>
            <Text variant="small" weight="medium" color={tab === 'achievements' ? 'foreground' : 'muted'}>
              Achievements
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'history' && styles.activeTab]} onPress={() => setTab('history')}>
            <Text variant="small" weight="medium" color={tab === 'history' ? 'foreground' : 'muted'}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {!isAuthenticated || isGuest ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Sign in to view your Spikes.
          </Text>
        ) : tab === 'overview' ? (
          <>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>
                  {spikesBalance} Spikes
                </CardTitle>
              </CardHeader>
              <CardContent style={{ gap: theme.spacing.md }}>
                <Text variant="small" color="muted">
                  Spikes are earned automatically as you train, compete, and engage.
                </Text>

                <View style={styles.progressBox}>
                  <View style={styles.progressRow}>
                    <Text variant="small" color="muted">
                      Pro Tier Progress
                    </Text>
                    <Text variant="small" color="muted">
                      {Math.min(spikesBalance, 1000)}/1000
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min((spikesBalance / 1000) * 100, 100)}%` }]} />
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Login Streak</CardTitle>
              </CardHeader>
              <CardContent style={{ gap: theme.spacing.md }}>
                {streakQuery.isLoading ? (
                  <View style={styles.center}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text variant="small" color="muted">
                      Loading streak…
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.streakRow}>
                      <View>
                        <Text variant="body" weight="semiBold" color="foreground">
                          {streak.currentStreak}-day streak
                        </Text>
                        <Text variant="small" color="muted">
                          Best: {streak.longestStreak} days
                        </Text>
                      </View>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => checkInMutation.mutate()}
                        loading={checkInMutation.isPending}
                      >
                        Check in
                      </Button>
                    </View>

                    <View style={styles.dotsRow}>
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <View
                          key={d}
                          style={[
                            styles.dot,
                            d <= Math.min(streak.currentStreak, 7) ? styles.dotActive : styles.dotInactive,
                          ]}
                        />
                      ))}
                    </View>
                  </>
                )}
              </CardContent>
            </Card>

            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>How to Earn Spikes</CardTitle>
              </CardHeader>
              <CardContent style={{ gap: theme.spacing.md }}>
                <Text variant="small" color="muted">- Compete in meets</Text>
                <Text variant="small" color="muted">- Complete training sessions</Text>
                <Text variant="small" color="muted">- Participate in groups and chats</Text>
                <Text variant="small" color="muted">- Maintain a daily login streak</Text>
              </CardContent>
            </Card>
          </>
        ) : tab === 'achievements' ? (
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.sm }}>
              {achievementsQuery.isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text variant="body" color="muted">Loading achievements…</Text>
                </View>
              ) : achievementsQuery.isError ? (
                <Text variant="body" color="muted" style={styles.emptyText}>
                  Unable to load achievements.
                </Text>
              ) : achievements.length === 0 ? (
                <Text variant="body" color="muted" style={styles.emptyText}>
                  No achievements yet.
                </Text>
              ) : (
                achievements.map((a) => (
                  <View key={a.id} style={styles.achievementRow}>
                    <View style={styles.achievementIcon}>
                      <FontAwesome5
                        name={a.isCompleted ? 'check-circle' : 'trophy'}
                        size={16}
                        color={a.isCompleted ? theme.colors.success : theme.colors.primary}
                        solid
                      />
                    </View>
                    <View style={styles.achievementText}>
                      <Text variant="body" weight="semiBold" color="foreground">
                        {a.name}
                      </Text>
                      <Text variant="small" color="muted">
                        {a.description}
                      </Text>
                    </View>
                    <Text variant="small" color="muted">
                      +{a.spikeReward ?? 0}
                    </Text>
                  </View>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.sm }}>
              {transactionsQuery.isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text variant="body" color="muted">Loading history…</Text>
                </View>
              ) : transactionsQuery.isError ? (
                <Text variant="body" color="muted" style={styles.emptyText}>
                  Unable to load transactions.
                </Text>
              ) : transactions.length === 0 ? (
                <Text variant="body" color="muted" style={styles.emptyText}>
                  No transactions yet.
                </Text>
              ) : (
                transactions.map((t) => (
                  <View key={t.id} style={styles.transactionRow}>
                    <View style={styles.transactionLeft}>
                      <Text variant="body" weight="semiBold" color="foreground">
                        {t.amount > 0 ? `+${t.amount}` : `${t.amount}`} Spikes
                      </Text>
                      <Text variant="small" color="muted" numberOfLines={1}>
                        {t.description || t.source || t.type}
                      </Text>
                    </View>
                    <Text variant="small" color="muted">
                      {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                    </Text>
                  </View>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </ScrollView>
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
  emptyText: { textAlign: 'center', lineHeight: 22, paddingVertical: theme.spacing.xl },
  card: { marginBottom: 0 },
  center: { alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.md },
  progressBox: { gap: theme.spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.muted,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: theme.colors.primary },
  dotInactive: { backgroundColor: theme.colors.muted },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  transactionLeft: { flex: 1, paddingRight: theme.spacing.md, gap: 2 },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  achievementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementText: { flex: 1, gap: 2 },
});
