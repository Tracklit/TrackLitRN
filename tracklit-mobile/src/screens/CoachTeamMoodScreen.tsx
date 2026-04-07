import React from 'react';
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
import { useQuery } from '@tanstack/react-query';
import {
  CaretLeft,
  Smiley,
  CaretRight,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { MiniSparkline } from '@/components/MiniSparkline';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { RootStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

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
  overall: { avgMood: string | null; entryCount: number };
  timeRange: number;
}

interface CoachAthlete {
  id: number;
  username: string;
  name?: string | null;
  profileImageUrl?: string | null;
}

const getMoodColor = (avg: number | null, mutedColor: string): string => {
  if (avg === null) return mutedColor;
  if (avg >= 8) return '#22c55e';
  if (avg >= 6) return '#84cc16';
  if (avg >= 4) return '#eab308';
  return '#ef4444';
};

const getMoodLabel = (avg: number | null): string => {
  if (avg === null) return 'No data';
  if (avg >= 8) return 'Excellent';
  if (avg >= 6) return 'Good';
  if (avg >= 4) return 'Moderate';
  return 'Low';
};

export const CoachTeamMoodScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const { styles, theme } = useThemedStyles(createStyles);

  const moodStatsQuery = useQuery({
    queryKey: ['coach-mood-stats'],
    queryFn: () => apiRequest<MoodStats>('/api/coaches/mood-stats?timeRange=7'),
    enabled: isAuthenticated && !isGuest,
  });

  const athletesQuery = useQuery({
    queryKey: ['coach-athletes'],
    queryFn: () => apiRequest<CoachAthlete[]>('/api/coach/athletes'),
    enabled: isAuthenticated && !isGuest,
  });

  const athletes = athletesQuery.data ?? [];
  const moodStats = moodStatsQuery.data;
  const overallAvg = moodStats?.overall?.avgMood ? parseFloat(moodStats.overall.avgMood) : null;

  const athleteProfileMap = React.useMemo(() => {
    const map: Record<number, CoachAthlete> = {};
    athletes.forEach(a => { map[a.id] = a; });
    return map;
  }, [athletes]);

  const isLoading = moodStatsQuery.isLoading || athletesQuery.isLoading;

  const MoodBar: React.FC<{ avg: number | null }> = ({ avg }) => {
    const color = getMoodColor(avg, theme.colors.textMuted);
    const pct = avg !== null ? (avg / 10) * 100 : 0;
    return (
      <View style={styles.moodBarTrack}>
        <View style={[styles.moodBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <CaretLeft size={22} color={theme.colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Mood</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.overallCard}>
          <View style={styles.overallLeft}>
            <View style={[styles.overallIcon, { backgroundColor: `${getMoodColor(overallAvg, theme.colors.textMuted)}22` }]}>
              <Smiley size={22} color={getMoodColor(overallAvg, theme.colors.textMuted)} weight="fill" />
            </View>
            <View>
              <Text style={styles.overallLabel}>7-Day Team Average</Text>
              <Text style={styles.overallSub}>{athletes.length} athletes tracked</Text>
            </View>
          </View>
          <View style={styles.overallRight}>
            <Text style={[styles.overallValue, { color: getMoodColor(overallAvg, theme.colors.textMuted) }]}>
              {overallAvg !== null ? overallAvg.toFixed(1) : '\u2014'}
            </Text>
            <Text style={[styles.overallMoodLabel, { color: getMoodColor(overallAvg, theme.colors.textMuted) }]}>
              {getMoodLabel(overallAvg)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>ATHLETE MOOD BOARDS</Text>

        {isLoading ? (
          <ActivityIndicator color={theme.colors.brandOrange} style={{ marginTop: 32 }} />
        ) : (moodStats?.athletes ?? []).length === 0 ? (
          <View style={styles.empty}>
            <Smiley size={36} color={theme.colors.textMuted} weight="fill" />
            <Text style={styles.emptyText}>No mood data yet. Athletes will appear here once they log moods.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {(moodStats?.athletes ?? []).map((stat) => {
              const avg = stat.avgMood ? parseFloat(stat.avgMood) : null;
              const color = getMoodColor(avg, theme.colors.textMuted);
              const profile = athleteProfileMap[stat.athleteId];
              return (
                <TouchableOpacity
                  key={stat.athleteId}
                  style={styles.athleteCard}
                  activeOpacity={0.75}
                  onPress={() =>
                    navigation.navigate('CoachAthleteDetail', {
                      athleteId: stat.athleteId,
                      athleteName: stat.athleteName,
                      athleteUsername: stat.athleteUsername,
                      athleteProfileImageUrl: profile?.profileImageUrl ?? null,
                    })
                  }
                >
                  <View style={styles.athleteLeft}>
                    <Avatar
                      size="sm"
                      fallback={(stat.athleteName || stat.athleteUsername || 'U').slice(0, 2)}
                      src={profile?.profileImageUrl || undefined}
                    />
                    <View style={styles.athleteInfo}>
                      <Text style={styles.athleteName} numberOfLines={1}>
                        {stat.athleteName || `@${stat.athleteUsername}`}
                      </Text>
                      <Text style={styles.athleteUsername}>@{stat.athleteUsername}</Text>
                    </View>
                  </View>

                  <View style={styles.athleteRight}>
                    <View style={styles.moodScoreRow}>
                      <Text style={[styles.moodScore, { color }]}>
                        {avg !== null ? avg.toFixed(1) : '\u2014'}
                      </Text>
                      <Text style={[styles.moodTag, { color }]}>
                        {getMoodLabel(avg)}
                      </Text>
                    </View>
                    {stat.dailyTrend?.length >= 2 ? (
                      <MiniSparkline
                        data={stat.dailyTrend.map(d => d.avg)}
                        width={80}
                        height={20}
                        strokeWidth={2}
                        showDots
                      />
                    ) : (
                      <MoodBar avg={avg} />
                    )}
                    <Text style={styles.entryCount}>{stat.entryCount} entries</Text>
                  </View>

                  <CaretRight size={14} color={theme.colors.textMuted} weight="bold" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              );
            })}
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.overlayLight,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  scroll: { padding: 20, gap: 0 },
  overallCard: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  overallLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  overallIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overallLabel: { fontSize: 13, fontWeight: '600', color: t.colors.textPrimary },
  overallSub: { fontSize: 11, color: t.colors.textMuted, marginTop: 2 },
  overallRight: { alignItems: 'flex-end' },
  overallValue: { fontSize: 28, fontWeight: '800' },
  overallMoodLabel: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: t.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  list: { gap: 10 },
  athleteCard: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  athleteLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  athleteInfo: { flex: 1 },
  athleteName: { fontSize: 14, fontWeight: '600', color: t.colors.textPrimary },
  athleteUsername: { fontSize: 11, color: t.colors.textMuted, marginTop: 1 },
  athleteRight: { alignItems: 'flex-end', gap: 4, minWidth: 90 },
  moodScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  moodScore: { fontSize: 20, fontWeight: '800' },
  moodTag: { fontSize: 10, fontWeight: '600' },
  moodBarTrack: {
    width: 80,
    height: 4,
    backgroundColor: t.colors.overlayLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  moodBarFill: { height: '100%', borderRadius: 2 },
  entryCount: { fontSize: 10, color: t.colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 13, color: t.colors.textMuted, textAlign: 'center', maxWidth: 260 },
});
