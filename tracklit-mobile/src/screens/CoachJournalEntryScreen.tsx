import React from 'react';
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
  NotePencil,
  CaretRight,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CoachJournalEntry'>;

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  cardAlt: '#181B27',
  orange: '#FF7A00',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.38)',
};

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

const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'EEEE, dd MMMM yyyy');
  } catch {
    return dateStr;
  }
};

const formatShortDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
};

export const CoachJournalEntryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { entryId, athleteId, athleteName, athleteUsername } = route.params;
  const { isAuthenticated } = useAuth();

  const allEntriesQuery = useQuery({
    queryKey: ['coach-athlete-journals', athleteId],
    queryFn: () => apiRequest<JournalEntry[]>(`/api/coaches/athletes/${athleteId}/journal-entries`),
    enabled: isAuthenticated,
  });

  const allEntries = allEntriesQuery.data ?? [];
  const currentEntry = allEntries.find((e) => e.id === entryId) ?? null;
  const otherEntries = allEntries.filter((e) => e.id !== entryId);

  const isLoading = allEntriesQuery.isLoading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <CaretLeft size={22} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal Entry</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.orange} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {currentEntry ? (
            <View style={styles.mainCard}>
              <View style={styles.mainCardHeader}>
                <View style={styles.entryIconWrap}>
                  <NotePencil size={18} color={C.orange} weight="fill" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryDate}>{formatDate(currentEntry.createdAt)}</Text>
                  <Text style={styles.entryAuthor}>
                    {athleteName || `@${athleteUsername}`}
                  </Text>
                </View>
              </View>

              {!!currentEntry.title && (
                <Text style={styles.entryTitle}>{currentEntry.title}</Text>
              )}

              <Text style={styles.entryBody}>
                {currentEntry.notes || currentEntry.content || 'No content.'}
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Entry not found.</Text>
            </View>
          )}

          {otherEntries.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>EARLIER ENTRIES</Text>
              <View style={styles.earlierList}>
                {otherEntries.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.earlierCard}
                    activeOpacity={0.75}
                    onPress={() =>
                      navigation.replace('CoachJournalEntry', {
                        entryId: entry.id,
                        athleteId,
                        athleteName,
                        athleteUsername,
                      })
                    }
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.earlierDate}>{formatShortDate(entry.createdAt)}</Text>
                      {!!entry.title && (
                        <Text style={styles.earlierTitle} numberOfLines={1}>{entry.title}</Text>
                      )}
                      <Text style={styles.earlierPreview} numberOfLines={2}>
                        {entry.notes || entry.content || 'No content'}
                      </Text>
                    </View>
                    <CaretRight size={13} color={C.textMuted} weight="bold" />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  scroll: { padding: 20 },
  mainCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
  },
  mainCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  entryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,122,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDate: { fontSize: 12, color: C.textMuted, marginBottom: 2 },
  entryAuthor: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  entryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 12,
    lineHeight: 24,
  },
  entryBody: {
    fontSize: 15,
    color: C.textSecondary,
    lineHeight: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  earlierList: { gap: 10 },
  earlierCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  earlierDate: { fontSize: 11, color: C.textMuted, marginBottom: 3 },
  earlierTitle: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 3 },
  earlierPreview: { fontSize: 12, color: C.textSecondary, lineHeight: 17 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 13, color: C.textMuted },
});
