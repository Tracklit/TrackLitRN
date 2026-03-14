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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  CaretLeft,
  Lightning,
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
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';
import { goBackOrNavigateToScreen } from '@/navigation/appNavigation';

const C = {
  orange: '#FF7A00',
  card: '#1C1F2B',
  textMuted: 'rgba(255,255,255,0.5)',
  border: 'rgba(255,255,255,0.06)',
  green: '#22c55e',
};

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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
  const handleBackPress = () => {
    goBackOrNavigateToScreen(navigation, 'Spikes');
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
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
          <Lightning size={20} color={C.orange} weight="fill" />
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
            <Fire size={18} color={C.orange} weight="fill" />
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
          <ActivityIndicator color={C.orange} style={{ paddingVertical: 20 }} />
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
                        <CheckCircle size={16} color={C.green} weight="fill" />
                      ) : (
                        <Trophy size={16} color={C.textMuted} weight="fill" />
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
          <ActivityIndicator color={C.orange} style={{ paddingVertical: 20 }} />
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
                      <Lightning
                        size={12}
                        color={isPositive ? C.orange : '#ef4444'}
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
                        { color: isPositive ? C.green : '#ef4444' },
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

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  tierProgress: {
    backgroundColor: C.card,
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
    color: '#FFFFFF',
  },
  tierPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: C.orange,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: C.orange,
  },
  tierSub: {
    fontSize: 11,
    color: C.textMuted,
  },
  streakCard: {
    backgroundColor: C.card,
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
    color: '#FFFFFF',
    flex: 1,
  },
  checkInBtn: {
    backgroundColor: C.orange,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  checkInText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: C.border,
  },
  streakValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 11,
    color: C.textMuted,
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
    backgroundColor: C.orange,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    color: '#FFFFFF',
    marginBottom: 10,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: C.orange,
    marginBottom: 10,
  },
  achievementList: {
    backgroundColor: C.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  achieveContent: {
    flex: 1,
    gap: 4,
  },
  achieveName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  achieveDone: {
    fontSize: 11,
    color: C.green,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: C.orange,
  },
  miniLabel: {
    fontSize: 10,
    color: C.textMuted,
    minWidth: 30,
  },
  achieveReward: {
    fontSize: 12,
    fontWeight: '700',
    color: C.orange,
  },
  transactionList: {
    backgroundColor: C.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  txIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txPositive: {
    backgroundColor: 'rgba(255,122,0,0.12)',
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
    color: '#FFFFFF',
  },
  txTime: {
    fontSize: 10,
    color: C.textMuted,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
});
