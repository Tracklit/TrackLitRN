import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CaretLeft,
  Smiley,
  NotePencil,
  ThumbsUp,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CoachAthleteDetail'>;

const PAGE_SIZE = 12;

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  cardAlt: '#181B27',
  orange: '#FF7A00',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.38)',
  green: '#22c55e',
  lime: '#84cc16',
  yellow: '#eab308',
  red: '#ef4444',
};

interface MoodEntry {
  id: number;
  userId: number;
  moodRating: number;
  date: string;
  notes?: string | null;
  createdAt: string;
}

interface JournalEntry {
  id: number;
  userId: number;
  title?: string | null;
  notes?: string | null;
  content?: string | null;
  isPublic?: boolean;
  date?: string | null;
  createdAt: string;
}

type TimelineItem =
  | { kind: 'mood'; data: MoodEntry; sortDate: number }
  | { kind: 'journal'; data: JournalEntry; sortDate: number };

const getMoodColor = (rating: number): string => {
  if (rating >= 8) return C.green;
  if (rating >= 6) return C.lime;
  if (rating >= 4) return C.yellow;
  return C.red;
};

const getMoodEmoji = (rating: number): string => {
  if (rating >= 9) return '😄';
  if (rating >= 7) return '🙂';
  if (rating >= 5) return '😐';
  if (rating >= 3) return '😕';
  return '😞';
};

const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
};

export const CoachAthleteDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { athleteId, athleteName, athleteUsername, athleteProfileImageUrl } = route.params;
  const { isAuthenticated } = useAuth();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const lastTapRef = useRef<Record<string, number>>({});

  const moodQuery = useQuery({
    queryKey: ['coach-athlete-moods', athleteId],
    queryFn: () => apiRequest<MoodEntry[]>(`/api/coaches/athletes/${athleteId}/mood-entries`),
    enabled: isAuthenticated,
  });

  const journalQuery = useQuery({
    queryKey: ['coach-athlete-journals', athleteId],
    queryFn: () => apiRequest<JournalEntry[]>(`/api/coaches/athletes/${athleteId}/journal-entries`),
    enabled: isAuthenticated,
  });

  const avgMood = useMemo(() => {
    const moods = moodQuery.data ?? [];
    if (!moods.length) return null;
    return moods.reduce((sum, m) => sum + m.moodRating, 0) / moods.length;
  }, [moodQuery.data]);

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    (moodQuery.data ?? []).forEach((m) => {
      items.push({ kind: 'mood', data: m, sortDate: new Date(m.date || m.createdAt).getTime() });
    });
    (journalQuery.data ?? []).forEach((j) => {
      items.push({ kind: 'journal', data: j, sortDate: new Date(j.createdAt).getTime() });
    });
    items.sort((a, b) => b.sortDate - a.sortDate);
    return items;
  }, [moodQuery.data, journalQuery.data]);

  const visibleTimeline = timeline.slice(0, visibleCount);
  const hasMore = visibleCount < timeline.length;
  const isLoading = moodQuery.isLoading || journalQuery.isLoading;

  const handleTap = useCallback((key: string) => {
    const now = Date.now();
    const last = lastTapRef.current[key] || 0;
    if (now - last < 350) {
      setLikedItems(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      lastTapRef.current[key] = 0;
    } else {
      lastTapRef.current[key] = now;
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <CaretLeft size={22} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {athleteName || `@${athleteUsername}`}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card with avg mood */}
        <View style={styles.profileCard}>
          <Avatar
            size="md"
            fallback={(athleteName || athleteUsername || 'U').slice(0, 2)}
            src={athleteProfileImageUrl || undefined}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{athleteName || `@${athleteUsername}`}</Text>
            <Text style={styles.profileUsername}>@{athleteUsername}</Text>
          </View>
          {avgMood !== null && (
            <View style={styles.avgMoodBadge}>
              <Text style={[styles.avgMoodValue, { color: getMoodColor(Math.round(avgMood)) }]}>
                {avgMood.toFixed(1)}
              </Text>
              <Text style={styles.avgMoodLabel}>avg mood</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>ACTIVITY TIMELINE</Text>
        <Text style={styles.doubleTapHint}>Double-tap any card to acknowledge</Text>

        {isLoading ? (
          <ActivityIndicator color={C.orange} style={{ marginTop: 32 }} />
        ) : timeline.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No activity recorded yet.</Text>
          </View>
        ) : (
          <>
            <View style={styles.timeline}>
              {visibleTimeline.map((item, idx) => {
                if (item.kind === 'mood') {
                  const m = item.data;
                  const key = `mood-${m.id}`;
                  const liked = likedItems.has(key);
                  const color = getMoodColor(m.moodRating);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.timelineItem}
                      activeOpacity={0.9}
                      onPress={() => handleTap(key)}
                    >
                      <View style={styles.timelineLeft}>
                        <View style={[styles.timelineDot, { backgroundColor: color }]} />
                        {idx < visibleTimeline.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={[styles.itemCard, styles.moodItemCard]}>
                        <View style={styles.itemCardRow}>
                          <View style={[styles.itemIcon, { backgroundColor: `${color}20` }]}>
                            <Smiley size={16} color={color} weight="fill" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.itemHeaderRow}>
                              <Text style={styles.itemKind}>Mood Check-In</Text>
                              <View style={styles.itemHeaderRight}>
                                <ThumbsUp
                                  size={13}
                                  color={liked ? C.orange : C.textMuted}
                                  weight={liked ? 'fill' : 'regular'}
                                />
                                <Text style={styles.itemDate}>{formatDate(m.date || m.createdAt)}</Text>
                              </View>
                            </View>
                            <View style={styles.moodRatingRow}>
                              <Text style={styles.moodEmoji}>{getMoodEmoji(m.moodRating)}</Text>
                              <Text style={[styles.moodRatingValue, { color }]}>{m.moodRating}/10</Text>
                              <View style={styles.moodRatingBar}>
                                <View style={[styles.moodRatingFill, { width: `${m.moodRating * 10}%` as any, backgroundColor: color }]} />
                              </View>
                            </View>
                            {!!m.notes && (
                              <Text style={styles.itemNote}>{m.notes}</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }

                const j = item.data;
                const key = `journal-${j.id}`;
                const liked = likedItems.has(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.timelineItem}
                    activeOpacity={0.9}
                    onPress={() => handleTap(key)}
                  >
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: C.orange }]} />
                      {idx < visibleTimeline.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={[styles.itemCard, styles.journalItemCard]}>
                      <View style={styles.itemCardRow}>
                        <View style={[styles.itemIcon, { backgroundColor: 'rgba(255,122,0,0.12)' }]}>
                          <NotePencil size={16} color={C.orange} weight="fill" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.itemHeaderRow}>
                            <Text style={styles.itemKind}>Journal Entry</Text>
                            <View style={styles.itemHeaderRight}>
                              <ThumbsUp
                                size={13}
                                color={liked ? C.orange : C.textMuted}
                                weight={liked ? 'fill' : 'regular'}
                              />
                              <Text style={styles.itemDate}>{formatDate(j.createdAt)}</Text>
                            </View>
                          </View>
                          {!!j.title && (
                            <Text style={styles.journalTitle}>{j.title}</Text>
                          )}
                          <Text style={styles.journalBody}>
                            {j.notes || j.content || 'No content'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {hasMore && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                activeOpacity={0.7}
                onPress={() => setVisibleCount(c => c + PAGE_SIZE)}
              >
                <Text style={styles.loadMoreText}>
                  Load {Math.min(PAGE_SIZE, timeline.length - visibleCount)} more · {timeline.length - visibleCount} remaining
                </Text>
              </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scroll: { padding: 20 },
  profileCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  profileName: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  profileUsername: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  avgMoodBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 54,
  },
  avgMoodValue: { fontSize: 20, fontWeight: '800' },
  avgMoodLabel: { fontSize: 9, color: C.textMuted, fontWeight: '600', marginTop: 1, letterSpacing: 0.5 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  doubleTapHint: {
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 14 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 14 },
  timelineLine: { flex: 1, width: 1.5, backgroundColor: C.border, marginTop: 3 },
  itemCard: { flex: 1, borderRadius: 12, marginBottom: 12, padding: 12 },
  moodItemCard: { backgroundColor: C.card },
  journalItemCard: { backgroundColor: C.card },
  itemCardRow: { flexDirection: 'row', gap: 10 },
  itemIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  itemKind: { fontSize: 11, fontWeight: '600', color: C.textSecondary },
  itemDate: { fontSize: 10, color: C.textMuted },
  moodRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  moodEmoji: { fontSize: 16 },
  moodRatingValue: { fontSize: 14, fontWeight: '700', minWidth: 32 },
  moodRatingBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  moodRatingFill: { height: '100%', borderRadius: 2 },
  itemNote: { fontSize: 12, color: C.textSecondary, marginTop: 4, lineHeight: 18 },
  journalTitle: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 4 },
  journalBody: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 13, color: C.textMuted, textAlign: 'center' },
  loadMoreBtn: {
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 10,
  },
  loadMoreText: { fontSize: 13, color: C.orange, fontWeight: '600' },
});
