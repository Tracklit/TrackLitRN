import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Coins,
  Trophy,
  CalendarCheck,
  MessageSquare,
  Medal,
  Gift,
  Crown,
  Award,
  Clock,
  RefreshCw,
  CheckCircle,
} from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

import { Text } from '@/components/ui/Text';
import { WebScreen } from '@/components/web/Screen';
import { WebCard } from '@/components/web/Card';
import { WebTabs, WebTabsList, WebTabsTrigger, WebTabsContent } from '@/components/web/Tabs';
import { WebProgress } from '@/components/web/Progress';
import { WebButton } from '@/components/web/Button';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import theme from '@/utils/theme';
type TabKey = 'achievements' | 'rewards' | 'premium' | 'history';

interface LoginStreak {
  currentStreak: number;
  longestStreak: number;
}

interface SpikeTransaction {
  id: number;
  amount: number;
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
  progress?: number;
  requirementValue?: number;
}

const ORANGE = '#FF7A00';
const GREEN = '#16a34a';

export const SpikesScreen: React.FC = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const isGuest = user?.id === 'guest';

  const [tab, setTab] = useState<TabKey>('achievements');

  const spikesBalance = Number((user as any)?.spikes ?? 0);

  const streakQuery = useQuery({
    queryKey: ['/api/login-streak'],
    queryFn: () => apiRequest<LoginStreak>('/api/login-streak'),
    enabled: isAuthenticated && !isGuest,
  });

  const transactionsQuery = useQuery({
    queryKey: ['/api/spike-transactions'],
    queryFn: () => apiRequest<SpikeTransaction[]>('/api/spike-transactions'),
    enabled: isAuthenticated && !isGuest,
  });

  const achievementsQuery = useQuery({
    queryKey: ['/api/achievements'],
    queryFn: () => apiRequest<UserAchievement[]>('/api/achievements'),
    enabled: isAuthenticated && !isGuest,
  });

  const checkInMutation = useMutation({
    mutationFn: () => apiRequest<LoginStreak>('/api/check-daily-login', { method: 'POST' }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/login-streak'] });
      await refreshUser();
    },
  });

  const streak = streakQuery.data ?? { currentStreak: 0, longestStreak: 0 };
  const achievements = useMemo(() => achievementsQuery.data ?? [], [achievementsQuery.data]);
  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);

  const loginAchievements = achievements.filter((a) => a.category === 'login');
  const workoutAchievements = achievements.filter((a) => a.category === 'workout');
  const meetAchievements = achievements.filter((a) => a.category === 'meet');
  const groupAchievements = achievements.filter((a) => a.category === 'group');

  const renderAchievementList = (items: UserAchievement[]) => (
    items.map((achievement) => {
      const requirementValue = achievement.requirementValue ?? 0;
      const progress = achievement.progress ?? 0;
      const progressPercent = requirementValue > 0 ? (progress / requirementValue) * 100 : 0;
      return (
        <View key={achievement.id} style={styles.achievementRow}>
          <View style={[styles.achievementIcon, achievement.isCompleted ? styles.achievementIconActive : styles.achievementIconMuted]}>
            <Trophy size={16} color={achievement.isCompleted ? ORANGE : theme.colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.achievementRowHeader}>
              <Text variant="small" weight="medium" color="foreground">
                {achievement.name}
              </Text>
              <Text variant="small" weight="medium" color="warning">
                +{achievement.spikeReward ?? 0} Spikes
              </Text>
            </View>
            <Text variant="small" color="muted">
              {achievement.description}
            </Text>
            {achievement.isCompleted ? (
              <View style={styles.completedRow}>
                <CheckCircle size={12} color={GREEN} />
                <Text variant="small" color="success">
                  Completed - Spikes Awarded!
                </Text>
              </View>
            ) : (
              <View style={styles.progressBlock}>
                <WebProgress value={progressPercent} style={styles.progressThin} />
                <Text variant="small" color="muted">
                  Progress: {progress}/{requirementValue || 0}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    })
  );

  return (
    <WebScreen backgroundColor="#0E0F14" contentStyle={{ paddingTop: theme.spacing.lg }}>
      <View style={styles.grid}>
        <WebCard tone="muted" padding={theme.spacing.lg}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Coins size={18} color={ORANGE} />
              <Text variant="h4" weight="semiBold" color="foreground">
                {spikesBalance} Spikes
              </Text>
            </View>
            <Text variant="small" color="muted">
              Spikes are automatically earned by completing activities
            </Text>
          </View>

          <View style={{ gap: theme.spacing.lg }}>
            <View>
              <View style={styles.progressRow}>
                <View style={styles.inlineRow}>
                  <Crown size={14} color={ORANGE} />
                  <Text variant="small" weight="medium" color="foreground">
                    Pro Tier Status
                  </Text>
                </View>
                <Text variant="small" color="muted">
                  1,000 Spikes needed
                </Text>
              </View>
              <WebProgress value={(spikesBalance / 1000) * 100} />
              <Text variant="small" color="muted" style={{ marginTop: theme.spacing.sm }}>
                Upgrade to Pro tier to unlock advanced features
              </Text>
            </View>

            {spikesBalance >= 500 && (
              <WebCard tone="light" padding={theme.spacing.md} style={styles.starCard}>
                <Text variant="body" weight="semiBold" style={styles.starTitle}>
                  Star Tier Available!
                </Text>
                <Text variant="small" style={styles.starCopy}>
                  You've earned enough Spikes to unlock Star tier benefits!
                </Text>
                <WebProgress value={Math.min((spikesBalance / 1000) * 100, 100)} style={styles.progressThin} />
              </WebCard>
            )}

            {streakQuery.isLoading ? (
              <WebCard tone="muted" padding={theme.spacing.md} style={styles.loadingCard}>
                <ActivityIndicator size="large" color={theme.colors.textMuted} />
              </WebCard>
            ) : (
            <WebCard tone="muted" padding={theme.spacing.md}>
                <Text variant="body" weight="semiBold" color="foreground" style={{ marginBottom: theme.spacing.sm }}>
                  Login Streak
                </Text>
                <View style={styles.progressRow}>
                  <View style={styles.inlineRow}>
                    <CalendarCheck size={16} color={ORANGE} />
                    <View>
                      <Text variant="small" weight="medium" color="foreground">
                        {streak.currentStreak}-day streak
                      </Text>
                      <Text variant="small" color="muted">
                        {streak.currentStreak >= 7 ? 'Awesome commitment!' : 'Come back daily for more Spikes'}
                        {streak.longestStreak > streak.currentStreak ? ` (Best: ${streak.longestStreak} days)` : ''}
                      </Text>
                    </View>
                  </View>
                <WebButton
                  variant="outline"
                  size="sm"
                  onPress={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                >
                    {checkInMutation.isPending ? 'Checking…' : 'Check In'}
                </WebButton>
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
              </WebCard>
              )}
          </View>
        </WebCard>

        <WebCard tone="muted" padding={theme.spacing.lg}>
          <Text variant="body" weight="semiBold" color="foreground" style={{ marginBottom: theme.spacing.sm }}>
            How to Earn Spikes
          </Text>
          <View style={{ gap: theme.spacing.md }}>
            <View style={styles.howRow}>
              <Trophy size={16} color={ORANGE} />
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground">
                  Compete in Meets
                </Text>
                <Text variant="small" color="muted">
                  Automatically earn 20-100 Spikes per meet
                </Text>
              </View>
            </View>
            <View style={styles.howRow}>
              <Clock size={16} color={ORANGE} />
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground">
                  Complete Training Sessions
                </Text>
                <Text variant="small" color="muted">
                  Automatically earn 10-30 Spikes per practice
                </Text>
              </View>
            </View>
            <View style={styles.howRow}>
              <MessageSquare size={16} color={ORANGE} />
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground">
                  Engage in Groups
                </Text>
                <Text variant="small" color="muted">
                  Automatically earn 5 Spikes for participation
                </Text>
              </View>
            </View>
            <View style={styles.howRow}>
              <CalendarCheck size={16} color={ORANGE} />
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground">
                  Daily Login
                </Text>
                <Text variant="small" color="muted">
                  Automatically earn 5-15 Spikes daily
                </Text>
              </View>
            </View>
            <View style={styles.howRow}>
              <Award size={16} color={ORANGE} />
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground">
                  Personal Records
                </Text>
                <Text variant="small" color="muted">
                  Automatically earn 50 Spikes for each new PR
                </Text>
              </View>
            </View>
            <View style={styles.howRow}>
              <RefreshCw size={16} color={ORANGE} />
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground">
                  Daily & Weekly Challenges
                </Text>
                <Text variant="small" color="muted">
                  Automatically earn bonus Spikes for challenges
                </Text>
              </View>
            </View>
          </View>
        </WebCard>
      </View>

      <WebTabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <WebTabsList>
          <WebTabsTrigger value="achievements">Achievements</WebTabsTrigger>
          <WebTabsTrigger value="rewards">Rewards</WebTabsTrigger>
          <WebTabsTrigger value="premium">Premium Features</WebTabsTrigger>
          <WebTabsTrigger value="history">Transaction History</WebTabsTrigger>
        </WebTabsList>

        <WebTabsContent value="achievements">
          {achievementsQuery.isLoading ? (
            <View style={styles.centeredBlock}>
              <ActivityIndicator size="large" color={theme.colors.textMuted} />
                  </View>
          ) : achievements.length > 0 ? (
            <View style={{ gap: theme.spacing.md }}>
              <WebCard tone="muted" padding={theme.spacing.lg}>
                <Text variant="body" weight="semiBold" color="foreground">
                  Login Achievements
                </Text>
                <Text variant="small" color="muted">
                  Spikes automatically earned for consistent logins
                </Text>
                <View style={styles.achievementList}>{renderAchievementList(loginAchievements)}</View>
              </WebCard>

              <WebCard tone="muted" padding={theme.spacing.lg}>
                <Text variant="body" weight="semiBold" color="foreground">
                  Workout Achievements
                </Text>
                <Text variant="small" color="muted">
                  Spikes automatically earned through training
                </Text>
                <View style={styles.achievementList}>{renderAchievementList(workoutAchievements)}</View>
              </WebCard>

              <WebCard tone="muted" padding={theme.spacing.lg}>
                <Text variant="body" weight="semiBold" color="foreground">
                  Meet Achievements
                </Text>
                <Text variant="small" color="muted">
                  Spikes automatically earned in competitions
                </Text>
                <View style={styles.achievementList}>{renderAchievementList(meetAchievements)}</View>
              </WebCard>

              <WebCard tone="muted" padding={theme.spacing.lg}>
                <Text variant="body" weight="semiBold" color="foreground">
                  Group Achievements
                </Text>
                <Text variant="small" color="muted">
                  Spikes automatically earned through collaboration
                </Text>
                <View style={styles.achievementList}>{renderAchievementList(groupAchievements)}</View>
              </WebCard>
            </View>
          ) : (
            <WebCard tone="muted" padding={theme.spacing.lg} style={styles.emptyStateCard}>
              <Trophy size={36} color={theme.colors.textMuted} />
              <Text variant="h4" weight="semiBold" color="foreground">
                No Achievements Yet
              </Text>
              <Text variant="body" color="muted" center>
                Start using the app to unlock achievements and earn Spikes automatically!
              </Text>
            </WebCard>
          )}
        </WebTabsContent>

        <WebTabsContent value="rewards">
          <View style={{ gap: theme.spacing.md }}>
            <WebCard tone="muted" padding={theme.spacing.lg}>
              <View style={styles.rewardTitleRow}>
                <Crown size={18} color={ORANGE} />
                <Text variant="body" weight="semiBold" color="foreground">
                  Pro Tier
                </Text>
              </View>
              <Text variant="small" color="muted">
                Unlock advanced features
              </Text>
              <Text variant="h4" weight="bold" color="foreground" style={{ marginTop: theme.spacing.sm }}>
                1,000 Spikes
              </Text>
              <View style={styles.rewardList}>
                <Text variant="small" color="muted">• Advanced analytics</Text>
                <Text variant="small" color="muted">• Custom workout plans</Text>
                <Text variant="small" color="muted">• Priority support</Text>
              </View>
              <WebButton
                style={{ marginTop: theme.spacing.md }}
                disabled={spikesBalance < 1000}
              >
                {spikesBalance >= 1000 ? 'Upgrade to Pro' : `Need ${1000 - spikesBalance} more Spikes`}
              </WebButton>
            </WebCard>

            <WebCard tone="muted" padding={theme.spacing.lg}>
              <View style={styles.rewardTitleRow}>
                <Medal size={18} color="rgba(255,122,0,0.7)" />
                <Text variant="body" weight="semiBold" color="foreground">
                  Star Tier
                </Text>
              </View>
              <Text variant="small" color="muted">
                Premium experience
              </Text>
              <Text variant="h4" weight="bold" color="foreground" style={{ marginTop: theme.spacing.sm }}>
                2,500 Spikes
              </Text>
              <View style={styles.rewardList}>
                <Text variant="small" color="muted">• Everything in Pro</Text>
                <Text variant="small" color="muted">• AI-powered coaching</Text>
                <Text variant="small" color="muted">• Exclusive features</Text>
              </View>
              <WebButton
                variant="secondary"
                style={{ marginTop: theme.spacing.md }}
                disabled={spikesBalance < 2500}
              >
                {spikesBalance >= 2500 ? 'Upgrade to Star' : `Need ${2500 - spikesBalance} more Spikes`}
              </WebButton>
            </WebCard>

            <WebCard tone="muted" padding={theme.spacing.lg}>
              <View style={styles.rewardTitleRow}>
                <Gift size={18} color={GREEN} />
                <Text variant="body" weight="semiBold" color="foreground">
                  Bonus Features
                </Text>
              </View>
              <Text variant="small" color="muted">
                One-time purchases
              </Text>
              <View style={styles.rewardRows}>
                <View style={styles.rewardRow}>
                  <Text variant="small" color="foreground">Custom Avatar</Text>
                  <Text variant="small" weight="medium" color="foreground">100 Spikes</Text>
                </View>
                <View style={styles.rewardRow}>
                  <Text variant="small" color="foreground">Extra Storage</Text>
                  <Text variant="small" weight="medium" color="foreground">250 Spikes</Text>
                </View>
                <View style={styles.rewardRow}>
                  <Text variant="small" color="foreground">Priority Queue</Text>
                  <Text variant="small" weight="medium" color="foreground">150 Spikes</Text>
                </View>
              </View>
          </WebCard>
          </View>
        </WebTabsContent>

        <WebTabsContent value="premium">
          <WebCard tone="muted" padding={theme.spacing.lg}>
            <Text variant="body" weight="semiBold" color="foreground">
              Premium Features Available
            </Text>
            <Text variant="small" color="muted">
              Unlock advanced capabilities with your Spikes
            </Text>
            <View style={{ gap: theme.spacing.lg, marginTop: theme.spacing.md }}>
              <View>
                <Text variant="small" weight="medium" color="foreground" style={{ marginBottom: theme.spacing.sm }}>
                  Pro Tier Benefits (1,000 Spikes)
                </Text>
                <View style={styles.benefitsList}>
                  <View style={styles.benefitRow}>
                    <CheckCircle size={14} color={GREEN} />
                    <Text variant="small" color="muted">Advanced performance analytics</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <CheckCircle size={14} color={GREEN} />
                    <Text variant="small" color="muted">Custom workout plan generator</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <CheckCircle size={14} color={GREEN} />
                    <Text variant="small" color="muted">Priority customer support</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <CheckCircle size={14} color={GREEN} />
                    <Text variant="small" color="muted">Extended data history</Text>
                  </View>
                </View>
              </View>

              <View>
                <Text variant="small" weight="medium" color="foreground" style={{ marginBottom: theme.spacing.sm }}>
                  Star Tier Benefits (2,500 Spikes)
                </Text>
                <View style={styles.benefitsList}>
                  <View style={styles.benefitRow}>
                    <CheckCircle size={14} color={ORANGE} />
                    <Text variant="small" color="muted">AI-powered performance coaching</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <CheckCircle size={14} color={ORANGE} />
                    <Text variant="small" color="muted">Personalized nutrition guidance</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <CheckCircle size={14} color={ORANGE} />
                    <Text variant="small" color="muted">Exclusive community features</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <CheckCircle size={14} color={ORANGE} />
                    <Text variant="small" color="muted">Early access to new features</Text>
                  </View>
                </View>
              </View>
            </View>
          </WebCard>
        </WebTabsContent>

        <WebTabsContent value="history">
          {transactionsQuery.isLoading ? (
            <View style={styles.centeredBlock}>
              <ActivityIndicator size="large" color={theme.colors.textMuted} />
            </View>
          ) : (
            <WebCard tone="muted" padding={theme.spacing.lg}>
                  <Text variant="body" weight="semiBold" color="foreground">
                Transaction History
              </Text>
              <Text variant="small" color="muted">
                All your Spike earnings and spending
              </Text>
              {transactions.length > 0 ? (
                <View style={styles.transactionList}>
                  {transactions.map((transaction) => {
                    const isPositive = transaction.amount > 0;
                    return (
                      <View key={transaction.id} style={styles.transactionRow}>
                        <View style={styles.transactionLeft}>
                          <View style={[styles.transactionIcon, isPositive ? styles.transactionPositive : styles.transactionNegative]}>
                            <Coins size={14} color={isPositive ? '#FF7A00' : '#ef4444'} />
                          </View>
                          <View>
                            <Text variant="small" weight="medium" color="foreground">
                              {transaction.description || 'Spike activity'}
                            </Text>
                            <Text variant="small" color="muted">
                              {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                            </Text>
                          </View>
                        </View>
                        <Text variant="small" weight="medium" color={isPositive ? 'success' : 'destructive'}>
                          {isPositive ? '+' : ''}{transaction.amount} Spikes
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyTransactions}>
                  <Coins size={36} color={theme.colors.textMuted} />
                  <Text variant="h4" weight="semiBold" color="foreground">
                    No Transactions Yet
                  </Text>
                  <Text variant="body" color="muted" center>
                    Your Spike earnings and purchases will appear here
                  </Text>
                </View>
              )}
                </WebCard>
          )}
        </WebTabsContent>
      </WebTabs>
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  grid: { gap: theme.spacing.md },
  cardHeader: { gap: theme.spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  dotsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: { backgroundColor: '#FF7A00' },
  dotInactive: { backgroundColor: '#1C1F2B' },
  starCard: { backgroundColor: 'rgba(255,122,0,0.08)', borderColor: 'rgba(255,122,0,0.2)' },
  starTitle: { color: '#FF7A00' },
  starCopy: { color: 'rgba(255,122,0,0.7)' },
  loadingCard: { alignItems: 'center', justifyContent: 'center', minHeight: 150 },
  progressThin: { height: 6, marginTop: theme.spacing.sm },
  centeredBlock: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
  achievementList: { marginTop: theme.spacing.md, gap: theme.spacing.md },
  achievementRow: { flexDirection: 'row', gap: theme.spacing.md },
  achievementIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconActive: { backgroundColor: 'rgba(255,122,0,0.08)' },
  achievementIconMuted: { backgroundColor: '#1C1F2B' },
  achievementRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginTop: theme.spacing.xs },
  progressBlock: { marginTop: theme.spacing.xs, gap: theme.spacing.xs },
  emptyStateCard: { alignItems: 'center', gap: theme.spacing.sm },
  rewardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  rewardList: { marginTop: theme.spacing.sm, gap: theme.spacing.xs },
  rewardRows: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
  rewardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  benefitsList: { gap: theme.spacing.sm },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  transactionList: { marginTop: theme.spacing.md },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 },
  transactionIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionPositive: { backgroundColor: 'rgba(255,122,0,0.12)' },
  transactionNegative: { backgroundColor: 'rgba(239,68,68,0.12)' },
  emptyTransactions: { alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.lg },
});


