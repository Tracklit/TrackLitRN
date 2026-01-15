import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Coins, Crown, Gift, MessageSquare, Award, RefreshCw, ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { WebScreen } from '@/components/web/Screen';
import { WebPageHeader } from '@/components/web/PageHeader';
import { WebCard } from '@/components/web/Card';
import { WebTabs, WebTabsList, WebTabsTrigger, WebTabsContent } from '@/components/web/Tabs';
import { WebSeparator } from '@/components/web/Separator';
import { WebProgress } from '@/components/web/Progress';
import { WebButton } from '@/components/web/Button';
import { WebBadge } from '@/components/web/Badge';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type TabKey = 'achievements' | 'rewards' | 'premium' | 'history';

interface LoginStreak {
  currentStreak: number;
  longestStreak: number;
}

interface SpikeTransaction {
  id: number;
  amount: number;
  type: string;
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
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const isGuest = user?.id === 'guest';

  const [tab, setTab] = useState<TabKey>('achievements');

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
    <WebScreen backgroundColor="#0b1220" contentStyle={{ paddingTop: theme.spacing.lg }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight size={18} color={theme.colors.foreground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <WebPageHeader
          title="Spikes"
          description="Your in-app currency for rewards and premium features - automatically earned!"
        />
      </View>

      <View style={styles.grid}>
        <WebCard tone="muted" padding={theme.spacing.lg}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Coins size={16} color={theme.colors.primary} />
              <Text variant="body" weight="semiBold" color="foreground">
                {spikesBalance} Spikes
              </Text>
            </View>
            <Text variant="small" color="muted">Spikes are automatically earned by completing activities</Text>
          </View>
          <View style={{ gap: theme.spacing.md }}>
            <View>
              <View style={styles.progressRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Crown size={14} color="#f59e0b" />
                  <Text variant="small" weight="medium" color="foreground">Pro Tier Status</Text>
                </View>
                <Text variant="small" color="muted">1,000 Spikes needed</Text>
              </View>
              <WebProgress value={(spikesBalance / 1000) * 100} />
            </View>
            {spikesBalance >= 500 && (
              <WebCard tone="light" padding={theme.spacing.md}>
                <Text variant="body" weight="semiBold" color="foreground">Star Tier Available!</Text>
                <WebProgress value={Math.min((spikesBalance / 1000) * 100, 100)} style={{ marginTop: theme.spacing.sm }} />
              </WebCard>
            )}
            <WebCard tone="muted" padding={theme.spacing.md}>
              <View style={styles.progressRow}>
                <Text variant="body" weight="semiBold" color="foreground">
                  Login Streak
                </Text>
                <WebButton
                  variant="outline"
                  size="sm"
                  onPress={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? 'Checking…' : 'Check in'}
                </WebButton>
              </View>
              {streakQuery.isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <View style={{ gap: theme.spacing.xs }}>
                  <Text variant="small" color="muted">
                    {streak.currentStreak}-day streak • Best: {streak.longestStreak} days
                  </Text>
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
                </View>
              )}
            </WebCard>
          </View>
        </WebCard>

        <WebCard tone="muted" padding={theme.spacing.lg}>
          <Text variant="body" weight="semiBold" color="foreground" style={{ marginBottom: theme.spacing.sm }}>
            How to Earn Spikes
          </Text>
          <View style={{ gap: theme.spacing.md }}>
            <View style={styles.howRow}>
              <Award size={16} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground">Compete in Meets</Text>
                <Text variant="small" color="muted">Automatically earn 20-100 Spikes per meet</Text>
              </View>
            </View>
            <View style={styles.howRow}>
              <RefreshCw size={16} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground">Daily & Weekly Challenges</Text>
                <Text variant="small" color="muted">Earn bonus Spikes for challenges</Text>
              </View>
            </View>
            <View style={styles.howRow}>
              <MessageSquare size={16} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground">Engage in Groups</Text>
                <Text variant="small" color="muted">Earn Spikes for participation</Text>
              </View>
            </View>
            <View style={styles.howRow}>
              <Gift size={16} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground">Daily Login</Text>
                <Text variant="small" color="muted">Earn 5-15 Spikes daily</Text>
              </View>
            </View>
          </View>
        </WebCard>
      </View>

      <WebTabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <WebTabsList>
          <WebTabsTrigger value="achievements">Achievements</WebTabsTrigger>
          <WebTabsTrigger value="rewards">Rewards</WebTabsTrigger>
          <WebTabsTrigger value="premium">Premium</WebTabsTrigger>
          <WebTabsTrigger value="history">History</WebTabsTrigger>
        </WebTabsList>

        <WebTabsContent value="achievements">
          {achievementsQuery.isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : achievements.length === 0 ? (
            <Text variant="body" color="muted">No achievements yet.</Text>
          ) : (
            achievements.map((a) => (
              <WebCard key={a.id} tone="muted" padding={theme.spacing.md}>
                <View style={styles.howRow}>
                  <Award size={16} color={a.isCompleted ? theme.colors.success : theme.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semiBold" color="foreground">{a.name}</Text>
                    <Text variant="small" color="muted">{a.description}</Text>
                  </View>
                  {a.spikeReward ? (
                    <WebBadge variant="secondary">+{a.spikeReward}</WebBadge>
                  ) : null}
                </View>
              </WebCard>
            ))
          )}
        </WebTabsContent>

        <WebTabsContent value="rewards">
          <WebCard tone="muted" padding={theme.spacing.md}>
            <Text variant="body" color="muted">Rewards coming soon.</Text>
          </WebCard>
        </WebTabsContent>

        <WebTabsContent value="premium">
          <WebCard tone="muted" padding={theme.spacing.md}>
            <Text variant="body" color="muted">Premium features mirror the web: Pro/Star unlocks.</Text>
          </WebCard>
        </WebTabsContent>

        <WebTabsContent value="history">
          {transactionsQuery.isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : transactions.length === 0 ? (
            <Text variant="body" color="muted">No transactions yet.</Text>
          ) : (
            transactions.map((t) => (
              <View key={t.id} style={{ marginBottom: theme.spacing.sm }}>
                <WebCard tone="muted" padding={theme.spacing.md}>
                  <Text variant="body" weight="semiBold" color="foreground">
                    {t.type} • {t.amount} Spikes
                  </Text>
                  {t.description ? (
                    <Text variant="small" color="muted">{t.description}</Text>
                  ) : null}
                  <WebSeparator style={{ marginTop: theme.spacing.sm }} />
                  <Text variant="small" color="muted">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </Text>
                </WebCard>
              </View>
            ))
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
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  grid: { gap: theme.spacing.md },
  cardHeader: { gap: theme.spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  dotsRow: { flexDirection: 'row', gap: theme.spacing.sm },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: { backgroundColor: theme.colors.primary },
  dotInactive: { backgroundColor: '#1f2937' },
});


