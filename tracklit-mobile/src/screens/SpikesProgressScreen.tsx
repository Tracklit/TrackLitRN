import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  CaretLeft,
  PushPin,
  Trophy,
  CalendarCheck,
  CheckCircle,
  Fire,
} from 'phosphor-react-native';
import { LinearGradient } from '@/components/LinearGradient';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';


import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
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

export const SpikesProgressScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const isGuest = user?.id === 'guest';
  const spikesBalance = Number((user as any)?.spikes ?? 0);

  const streakQuery = useQuery({
    queryKey: ['login-streak'],
    queryFn: () => apiRequest<LoginStreak>('/api/login-streak'),
    enabled: isAuthenticated && !isGuest,
  });

  const transactionsQuery = useQuery({
    queryKey: ['spike-transactions'],
    queryFn: () => apiRequest<SpikeTransaction[]>('/api/spike-transactions'),
    enabled: isAuthenticated && !isGuest,
  });

  const achievementsQuery = useQuery({
    queryKey: ['achievements'],
    queryFn: () => apiRequest<UserAchievement[]>('/api/achievements'),
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
  const achievements = useMemo(() => achievementsQuery.data ?? [], [achievementsQuery.data]);
  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);

  const completedCount = achievements.filter((a) => a.isCompleted).length;
  const proProgress = Math.min((spikesBalance / 1000) * 100, 100);

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CaretLeft size={22} color="#fff" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Progress</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceRow}>
          <Text style={styles.balanceText}>{spikesBalance.toLocaleString()} Spikes</Text>
        </View>

        <View style={styles.tierProgress}>
          <View style={styles.tierLabels}>
            <Text style={styles.tierLabel}>Pro Tier Progress</Text>
            <Text style={styles.tierPercent}>{Math.round(proProgress)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${proProgress}%` }]} />
          </View>
          <Text style={styles.tierSub}>
            {spikesBalance >= 1000
              ? 'Pro tier unlocked!'
              : `${1000 - spikesBalance} more spikes to Pro`}
          </Text>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Fire size={18} color={theme.colors.brandOrange} weight="fill" />
            <Text style={styles.streakTitle}>Login Streak</Text>
            <TouchableOpacity
              style={styles.checkInBtn}
              onPress={() => checkInMutation.mutate()}
              disabled={checkInMutation.isPending}
              activeOpacity={0.7}
            >
              <Text style={styles.checkInText}>
                {checkInMutation.isPending ? 'Checking…' : 'Check In'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.streakStats}>
            <View style={styles.streakStat}>
              <Text style={styles.streakValue}>{streak.currentStreak}</Text>
              <Text style={styles.streakLabel}>Current</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakStat}>
              <Text style={styles.streakValue}>{streak.longestStreak}</Text>
              <Text style={styles.streakLabel}>Best</Text>
            </View>
          </View>
          <View style={styles.dotsRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <View
                key={d}
                style={[
                  styles.dot,
                  d <= Math.min(streak.currentStreak, 7)
                    ? styles.dotActive
                    : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {achievementsQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.brandOrange} style={{ paddingVertical: 20 }} />
        ) : achievements.length > 0 ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <Text style={styles.sectionCount}>{completedCount}/{achievements.length}</Text>
            </View>
            <View style={styles.achievementList}>
              {achievements.map((a) => {
                const reqVal = a.requirementValue ?? 0;
                const prog = a.progress ?? 0;
                const pct = reqVal > 0 ? Math.min((prog / reqVal) * 100, 100) : 0;
                return (
                  <View key={a.id} style={styles.achievementRow}>
                    <View
                      style={[
                        styles.achieveIcon,
                        a.isCompleted ? styles.achieveIconDone : styles.achieveIconPending,
                      ]}
                    >
                      {a.isCompleted ? (
                        <CheckCircle size={16} color={theme.colors.success} weight="fill" />
                      ) : (
                        <Trophy size={16} color={theme.colors.textMuted} weight="fill" />
                      )}
                    </View>
                    <View style={styles.achieveContent}>
                      <Text style={styles.achieveName}>{a.name}</Text>
                      {a.isCompleted ? (
                        <Text style={styles.achieveDone}>Completed</Text>
                      ) : (
                        <View style={styles.miniProgress}>
                          <View style={styles.miniBar}>
                            <View style={[styles.miniFill, { width: `${pct}%` }]} />
                          </View>
                          <Text style={styles.miniLabel}>{prog}/{reqVal}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.achieveReward}>+{a.spikeReward ?? 0}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {transactionsQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.brandOrange} style={{ paddingVertical: 20 }} />
        ) : transactions.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.transactionList}>
              {transactions.slice(0, 15).map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View
                      style={[
                        styles.txIcon,
                        isPositive ? styles.txPositive : styles.txNegative,
                      ]}
                    >
                      <PushPin
                        size={12}
                        color={isPositive ? theme.colors.brandOrange : '#ef4444'}
                        weight="fill"
                      />
                    </View>
                    <View style={styles.txContent}>
                      <Text style={styles.txDesc}>
                        {tx.description || 'Spike activity'}
                      </Text>
                      <Text style={styles.txTime}>
                        {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: isPositive ? theme.colors.success : '#ef4444' },
                      ]}
                    >
                      {isPositive ? '+' : ''}
                      {tx.amount}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: t.colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  balanceText: {
    fontSize: 22,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  tierProgress: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  tierLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: t.colors.textPrimary,
  },
  tierPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: t.colors.brandOrange,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: t.colors.overlayLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: t.colors.brandOrange,
  },
  tierSub: {
    fontSize: 11,
    color: t.colors.textMuted,
  },
  streakCard: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: t.colors.textPrimary,
    flex: 1,
  },
  checkInBtn: {
    backgroundColor: t.colors.brandOrange,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  checkInText: {
    fontSize: 12,
    fontWeight: '600',
    color: t.colors.textPrimary,
  },
  streakStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  streakDivider: {
    width: 1,
    height: 28,
    backgroundColor: t.colors.overlayLight,
  },
  streakValue: {
    fontSize: 22,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  streakLabel: {
    fontSize: 11,
    color: t.colors.textMuted,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: t.colors.brandOrange,
  },
  dotInactive: {
    backgroundColor: t.colors.overlayLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: t.colors.textPrimary,
    marginBottom: 10,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: t.colors.brandOrange,
    marginBottom: 10,
  },
  achievementList: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    overflow: 'hidden',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: t.colors.overlayLight,
  },
  achieveIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achieveIconDone: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  achieveIconPending: {
    backgroundColor: t.colors.overlaySubtle,
  },
  achieveContent: {
    flex: 1,
    gap: 4,
  },
  achieveName: {
    fontSize: 13,
    fontWeight: '500',
    color: t.colors.textPrimary,
  },
  achieveDone: {
    fontSize: 11,
    color: t.colors.success,
    fontWeight: '500',
  },
  miniProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.overlayLight,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: t.colors.brandOrange,
  },
  miniLabel: {
    fontSize: 10,
    color: t.colors.textMuted,
    minWidth: 30,
  },
  achieveReward: {
    fontSize: 12,
    fontWeight: '700',
    color: t.colors.brandOrange,
  },
  transactionList: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: t.colors.overlayLight,
  },
  txIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txPositive: {
    backgroundColor: t.colors.brandOrangeLight,
  },
  txNegative: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  txContent: {
    flex: 1,
    gap: 1,
  },
  txDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: t.colors.textPrimary,
  },
  txTime: {
    fontSize: 10,
    color: t.colors.textMuted,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
});
