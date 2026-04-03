import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MagnifyingGlass,
  Plus,
  SortAscending,
  SortDescending,
  NotePencil,
  Trash,
  PencilSimple,
  Smiley,
  Globe,
  Lock,
  CalendarBlank,
  CaretRight,
} from 'phosphor-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';

interface JournalEntry {
  id: number;
  userId: number;
  title: string;
  notes: string;
  type: string;
  content: any;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

type SortDirection = 'asc' | 'desc';

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  cardAlt: '#181B27',
  orange: '#FF7A00',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.38)',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  inputBg: 'rgba(255,255,255,0.05)',
  modalBg: '#151821',
};

const parseContent = (content: any) => {
  if (!content) return {};
  if (typeof content === 'string') {
    try { return JSON.parse(content); } catch { return {}; }
  }
  if (typeof content === 'object') return content;
  return {};
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const getMoodColor = (value: number) => {
  if (value <= 3) return C.red;
  if (value <= 5) return C.yellow;
  return C.green;
};

export const JournalScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const canUse = isAuthenticated && !isGuest;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formMoodRating, setFormMoodRating] = useState(7);
  const [formIsPublic, setFormIsPublic] = useState(true);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    queryClient.invalidateQueries({ queryKey: ['journal-home'] });
    queryClient.invalidateQueries({ queryKey: ['coach-journal-entries'] });
    queryClient.invalidateQueries({ queryKey: ['coach-journal-home'] });
  }, []);

  const journalQuery = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => apiRequest<JournalEntry[]>('/api/journal'),
    enabled: canUse,
  });

  const normalizedEntries = useMemo(() => {
    const entries = journalQuery.data ?? [];
    return entries.map((entry) => ({
      ...entry,
      content: parseContent(entry.content),
    }));
  }, [journalQuery.data]);

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const results = term
      ? normalizedEntries.filter(
          (entry) =>
            entry.title?.toLowerCase().includes(term) ||
            entry.notes?.toLowerCase().includes(term)
        )
      : normalizedEntries;
    return results.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [normalizedEntries, searchTerm, sortDirection]);

  const createMutation = useMutation({
    mutationFn: async () =>
      apiRequest('/api/journal', {
        method: 'POST',
        data: {
          title: formTitle.trim(),
          notes: formNotes.trim(),
          type: 'manual',
          isPublic: formIsPublic,
          content: { moodRating: formMoodRating },
        },
      }),
    onSuccess: () => { invalidateAll(); setModalMode(null); resetForm(); },
    onError: (error: Error) => Alert.alert('Error', error.message || 'Unable to create entry.'),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: JournalEntry) =>
      apiRequest(`/api/journal/${payload.id}`, { method: 'PUT', data: payload }),
    onSuccess: () => { invalidateAll(); setModalMode(null); setEditingEntry(null); },
    onError: (error: Error) => Alert.alert('Error', error.message || 'Unable to update entry.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: number) =>
      apiRequest(`/api/journal/${entryId}`, { method: 'DELETE' }),
    onSuccess: () => invalidateAll(),
    onError: (error: Error) => Alert.alert('Error', error.message || 'Unable to delete entry.'),
  });

  const resetForm = () => {
    setFormTitle('');
    setFormNotes('');
    setFormMoodRating(7);
    setFormIsPublic(true);
  };

  const handleOpenCreate = () => {
    if (!canUse) {
      Alert.alert('Sign In Required', 'Please sign in to create journal entries.');
      return;
    }
    resetForm();
    setModalMode('create');
  };

  const handleOpenEdit = (entry: JournalEntry) => {
    const content = parseContent(entry.content);
    setEditingEntry({ ...entry, content });
    setFormTitle(entry.title || '');
    setFormNotes(entry.notes || '');
    setFormMoodRating(content.moodRating ?? 7);
    setFormIsPublic(entry.isPublic ?? true);
    setModalMode('edit');
  };

  const handleSubmitCreate = () => {
    if (!formTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your journal entry.');
      return;
    }
    createMutation.mutate();
  };

  const handleSubmitEdit = () => {
    if (!editingEntry) return;
    if (!formTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your journal entry.');
      return;
    }
    updateMutation.mutate({
      ...editingEntry,
      title: formTitle.trim(),
      notes: formNotes.trim(),
      type: editingEntry.type || 'manual',
      isPublic: formIsPublic,
      content: { ...(editingEntry.content || {}), moodRating: formMoodRating },
    });
  };

  const handleDelete = (entryId: number, title: string) => {
    Alert.alert('Delete Entry', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(entryId) },
    ]);
  };

  const MoodPicker: React.FC = () => (
    <View style={styles.moodPicker}>
      <Text style={styles.moodPickerLabel}>Mood: {formMoodRating}/10</Text>
      <View style={styles.moodDots}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
          <TouchableOpacity
            key={v}
            style={[
              styles.moodDot,
              { backgroundColor: v <= formMoodRating ? getMoodColor(formMoodRating) : 'rgba(255,255,255,0.08)' },
            ]}
            onPress={() => setFormMoodRating(v)}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Training Journal</Text>
        <TouchableOpacity style={styles.newBtn} onPress={handleOpenCreate} activeOpacity={0.8}>
          <Plus size={16} color="#fff" weight="bold" />
          <Text style={styles.newBtnText}>New Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Search + Sort */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MagnifyingGlass size={15} color={C.textMuted} weight="bold" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            placeholderTextColor={C.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'))}
          activeOpacity={0.7}
        >
          {sortDirection === 'desc'
            ? <SortDescending size={18} color={C.textSecondary} weight="bold" />
            : <SortAscending size={18} color={C.textSecondary} weight="bold" />
          }
        </TouchableOpacity>
      </View>

      {/* Entry list */}
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {journalQuery.isLoading ? (
          <ActivityIndicator color={C.orange} style={{ marginTop: 48 }} />
        ) : !canUse ? (
          <View style={styles.emptyState}>
            <Lock size={36} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>Sign in to view your journal</Text>
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <NotePencil size={36} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>
              {searchTerm ? 'No entries match your search.' : 'No journal entries yet. Tap + New Entry to get started.'}
            </Text>
          </View>
        ) : (
          filteredEntries.map((entry) => {
            const mood = entry.content?.moodRating;
            const isExpanded = expandedId === entry.id;
            const moodColor = mood ? getMoodColor(mood) : null;

            return (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                activeOpacity={0.85}
                onPress={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <View style={styles.entryTop}>
                  <View style={styles.entryTopLeft}>
                    <View style={styles.entryIconWrap}>
                      <NotePencil size={14} color={C.orange} weight="fill" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryTitle} numberOfLines={1}>{entry.title || 'Untitled'}</Text>
                      <View style={styles.entryMeta}>
                        <CalendarBlank size={10} color={C.textMuted} weight="bold" />
                        <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                        {entry.isPublic
                          ? <Globe size={10} color={C.textMuted} weight="bold" />
                          : <Lock size={10} color={C.textMuted} weight="bold" />
                        }
                      </View>
                    </View>
                  </View>
                  <View style={styles.entryTopRight}>
                    {mood !== undefined && mood !== null && (
                      <View style={[styles.moodBadge, { backgroundColor: `${moodColor}22` }]}>
                        <Smiley size={10} color={moodColor!} weight="fill" />
                        <Text style={[styles.moodBadgeText, { color: moodColor! }]}>{mood}</Text>
                      </View>
                    )}
                    <CaretRight
                      size={12}
                      color={C.textMuted}
                      weight="bold"
                      style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                    />
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.entryExpanded}>
                    {!!entry.notes && (
                      <Text style={styles.entryNotes}>{entry.notes}</Text>
                    )}
                    <View style={styles.entryActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleOpenEdit(entry)}
                        activeOpacity={0.7}
                      >
                        <PencilSimple size={13} color={C.orange} weight="bold" />
                        <Text style={styles.actionBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDestructive]}
                        onPress={() => handleDelete(entry.id, entry.title)}
                        activeOpacity={0.7}
                      >
                        <Trash size={13} color={C.red} weight="bold" />
                        <Text style={[styles.actionBtnText, { color: C.red }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Create / Edit Modal */}
      <Modal
        visible={modalMode !== null}
        animationType="slide"
        transparent
        onRequestClose={() => { setModalMode(null); setEditingEntry(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {modalMode === 'create' ? 'New Journal Entry' : 'Edit Entry'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Entry title..."
                placeholderTextColor={C.textMuted}
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Write your notes here..."
                placeholderTextColor={C.textMuted}
                value={formNotes}
                onChangeText={setFormNotes}
                multiline
                textAlignVertical="top"
              />

              <MoodPicker />

              <View style={styles.publicRow}>
                <View style={styles.publicLeft}>
                  {formIsPublic
                    ? <Globe size={14} color={C.orange} weight="fill" />
                    : <Lock size={14} color={C.textMuted} weight="fill" />
                  }
                  <Text style={styles.publicLabel}>
                    {formIsPublic ? 'Public — visible to your coach' : 'Private'}
                  </Text>
                </View>
                <Switch
                  value={formIsPublic}
                  onValueChange={setFormIsPublic}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(255,122,0,0.5)' }}
                  thumbColor={formIsPublic ? C.orange : 'rgba(255,255,255,0.4)'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setModalMode(null); setEditingEntry(null); }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={modalMode === 'create' ? handleSubmitCreate : handleSubmitEdit}
                activeOpacity={0.8}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {modalMode === 'create' ? 'Save Entry' : 'Save Changes'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  screenTitle: { fontSize: 22, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.orange,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: 13 },
  sortBtn: {
    width: 40,
    height: 40,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: { paddingHorizontal: 20, gap: 10 },

  entryCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  entryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  entryTopLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,122,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  entryDate: { fontSize: 10, color: C.textMuted },
  entryTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  moodBadgeText: { fontSize: 11, fontWeight: '700' },

  entryExpanded: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: 14,
    gap: 12,
  },
  entryNotes: { fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  entryActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,122,0,0.10)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
  },
  actionBtnDestructive: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: C.orange },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: C.textMuted, textAlign: 'center', maxWidth: 260, lineHeight: 20 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.modalBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.textPrimary, marginBottom: 20 },

  inputLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' },
  modalInput: {
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.textPrimary,
    fontSize: 14,
    marginBottom: 16,
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  moodPicker: { marginBottom: 16 },
  moodPickerLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  moodDots: { flexDirection: 'row', gap: 6 },
  moodDot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },

  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  publicLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  publicLabel: { fontSize: 13, color: C.textSecondary },

  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.orange,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
