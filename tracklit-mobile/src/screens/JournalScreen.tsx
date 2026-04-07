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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
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
  Eye,
} from 'phosphor-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
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
type Visibility = 'private' | 'coach' | 'public';


const getVisibilityOptions = (themeColors: any) => [
  { key: 'private' as Visibility, label: 'Private', icon: null, color: themeColors.textMuted, desc: 'Only you' },
  { key: 'coach' as Visibility,   label: 'Coach',   icon: null, color: '#3b82f6',     desc: 'You + your coach' },
  { key: 'public' as Visibility,  label: 'Public',  icon: null, color: themeColors.success,    desc: 'Everyone' },
];

const visibilityToIsPublic = (v: Visibility) => v !== 'private';

const contentToVisibility = (content: any): Visibility => {
  if (!content) return 'private';
  const v = content.visibility;
  if (v === 'coach' || v === 'public') return v;
  if (content.isPublic === true) return 'public';
  return 'private';
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

const getMoodColor = (value: number, themeColors: any) => {
  if (value <= 3) return themeColors.destructive;
  if (value <= 6) return themeColors.warning;
  return themeColors.success;
};

const VisibilityIcon: React.FC<{ vis: Visibility; size: number; color?: string }> = ({ vis, size, color }) => {
  const { theme } = useThemedStyles(createStyles);
  if (vis === 'public') return <Globe size={size} color={color ?? theme.colors.success} weight="fill" />;
  if (vis === 'coach') return <Eye size={size} color={color ?? '#3b82f6'} weight="fill" />;
  return <Lock size={size} color={color ?? theme.colors.textMuted} weight="fill" />;
};

export const JournalScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
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
  const [formVisibility, setFormVisibility] = useState<Visibility>('private');

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
          isPublic: visibilityToIsPublic(formVisibility),
          content: { moodRating: formMoodRating, visibility: formVisibility },
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
    setFormVisibility('private');
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
    setFormVisibility(contentToVisibility(content));
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
      isPublic: visibilityToIsPublic(formVisibility),
      content: { ...(editingEntry.content || {}), moodRating: formMoodRating, visibility: formVisibility },
    });
  };

  const handleDelete = (entryId: number, title: string) => {
    Alert.alert('Delete Entry', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(entryId) },
    ]);
  };

  const moodColor = getMoodColor(formMoodRating, theme.colors);

  const VisibilitySelector: React.FC = () => (
    <View style={styles.visibilityWrap}>
      <Text style={styles.inputLabel}>Visibility</Text>
      <View style={styles.visibilityRow}>
        {getVisibilityOptions(theme.colors).map((opt) => {
          const isActive = formVisibility === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.visibilityBtn, isActive && { borderColor: opt.color, backgroundColor: `${opt.color}14` }]}
              onPress={() => setFormVisibility(opt.key)}
              activeOpacity={0.7}
            >
              <VisibilityIcon vis={opt.key} size={14} color={isActive ? opt.color : theme.colors.textMuted} />
              <Text style={[styles.visibilityBtnLabel, { color: isActive ? opt.color : theme.colors.textMuted }]}>
                {opt.label}
              </Text>
              <Text style={[styles.visibilityBtnDesc, { color: isActive ? opt.color : theme.colors.textMuted, opacity: 0.7 }]}>
                {opt.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
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
          <MagnifyingGlass size={15} color={theme.colors.textMuted} weight="bold" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            placeholderTextColor={theme.colors.textMuted}
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
            ? <SortDescending size={18} color={theme.colors.textSecondary} weight="bold" />
            : <SortAscending size={18} color={theme.colors.textSecondary} weight="bold" />
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
          <ActivityIndicator color={theme.colors.brandOrange} style={{ marginTop: 48 }} />
        ) : !canUse ? (
          <View style={styles.emptyState}>
            <Lock size={36} color={theme.colors.textMuted} weight="fill" />
            <Text style={styles.emptyText}>Sign in to view your journal</Text>
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <NotePencil size={36} color={theme.colors.textMuted} weight="fill" />
            <Text style={styles.emptyText}>
              {searchTerm ? 'No entries match your search.' : 'No journal entries yet. Tap + New Entry to get started.'}
            </Text>
          </View>
        ) : (
          filteredEntries.map((entry) => {
            const mood = entry.content?.moodRating;
            const isExpanded = expandedId === entry.id;
            const entryMoodColor = mood ? getMoodColor(mood, theme.colors) : null;
            const vis = contentToVisibility(entry.content);

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
                      <NotePencil size={14} color={theme.colors.brandOrange} weight="fill" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryTitle} numberOfLines={1}>{entry.title || 'Untitled'}</Text>
                      <View style={styles.entryMeta}>
                        <CalendarBlank size={10} color={theme.colors.textMuted} weight="bold" />
                        <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                        <VisibilityIcon vis={vis} size={10} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.entryTopRight}>
                    {mood !== undefined && mood !== null && (
                      <View style={[styles.moodBadge, { backgroundColor: `${entryMoodColor}22` }]}>
                        <Smiley size={10} color={entryMoodColor!} weight="fill" />
                        <Text style={[styles.moodBadgeText, { color: entryMoodColor! }]}>{mood}</Text>
                      </View>
                    )}
                    <CaretRight
                      size={12}
                      color={theme.colors.textMuted}
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
                        <PencilSimple size={13} color={theme.colors.brandOrange} weight="bold" />
                        <Text style={styles.actionBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDestructive]}
                        onPress={() => handleDelete(entry.id, entry.title)}
                        activeOpacity={0.7}
                      >
                        <Trash size={13} color={theme.colors.destructive} weight="bold" />
                        <Text style={[styles.actionBtnText, { color: theme.colors.destructive }]}>Delete</Text>
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
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => { setModalMode(null); setEditingEntry(null); }}
          />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {modalMode === 'create' ? 'New Journal Entry' : 'Edit Entry'}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Entry title..."
                placeholderTextColor={theme.colors.textMuted}
                value={formTitle}
                onChangeText={setFormTitle}
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Write your notes here..."
                placeholderTextColor={theme.colors.textMuted}
                value={formNotes}
                onChangeText={setFormNotes}
                multiline
                textAlignVertical="top"
                returnKeyType="done"
              />

              {/* Mood Slider */}
              <View style={styles.moodWrap}>
                <View style={styles.moodHeader}>
                  <Text style={styles.inputLabel}>Mood</Text>
                  <View style={[styles.moodValueBadge, { backgroundColor: `${moodColor}20` }]}>
                    <Smiley size={12} color={moodColor} weight="fill" />
                    <Text style={[styles.moodValueText, { color: moodColor }]}>{formMoodRating}/10</Text>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={formMoodRating}
                  onValueChange={(v) => setFormMoodRating(Math.round(v))}
                  minimumTrackTintColor={moodColor}
                  maximumTrackTintColor="rgba(255,255,255,0.12)"
                  thumbTintColor={Platform.OS === 'android' ? moodColor : undefined}
                />
                <View style={styles.moodLabels}>
                  <Text style={styles.moodLabelText}>Low</Text>
                  <Text style={styles.moodLabelText}>High</Text>
                </View>
              </View>

              <VisibilitySelector />
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.backgroundSolid },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  screenTitle: { fontSize: 22, fontWeight: '800', color: t.colors.textPrimary, letterSpacing: -0.5 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: t.colors.brandOrange,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: t.colors.textPrimary },

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
    backgroundColor: t.colors.overlaySubtle,
    borderWidth: 1,
    borderColor: t.colors.overlayLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, color: t.colors.textPrimary, fontSize: 13 },
  sortBtn: {
    width: 40,
    height: 40,
    backgroundColor: t.colors.overlaySubtle,
    borderWidth: 1,
    borderColor: t.colors.overlayLight,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: { paddingHorizontal: 20, gap: 10 },

  entryCard: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.colors.overlayLight,
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
    backgroundColor: t.colors.brandOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTitle: { fontSize: 14, fontWeight: '700', color: t.colors.textPrimary },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  entryDate: { fontSize: 10, color: t.colors.textMuted },
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
    borderTopColor: t.colors.overlayLight,
    padding: 14,
    gap: 12,
  },
  entryNotes: { fontSize: 13, color: t.colors.textSecondary, lineHeight: 20 },
  entryActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: t.colors.brandOrangeLight,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
  },
  actionBtnDestructive: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: t.colors.brandOrange },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: t.colors.textMuted, textAlign: 'center', maxWidth: 260, lineHeight: 20 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: t.colors.cardSolid,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.overlayMedium,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: t.colors.textPrimary, marginBottom: 20 },

  inputLabel: { fontSize: 11, fontWeight: '700', color: t.colors.textMuted, letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' },
  modalInput: {
    backgroundColor: t.colors.overlaySubtle,
    borderWidth: 1,
    borderColor: t.colors.overlayLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: t.colors.textPrimary,
    fontSize: 14,
    marginBottom: 16,
  },
  modalTextArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  moodWrap: { marginBottom: 16 },
  moodHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  moodValueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  moodValueText: { fontSize: 12, fontWeight: '700' },
  slider: { width: '100%', height: 40 },
  moodLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  moodLabelText: { fontSize: 10, color: t.colors.textMuted },

  visibilityWrap: { marginBottom: 20 },
  visibilityRow: { flexDirection: 'row', gap: 8 },
  visibilityBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.colors.overlayLight,
    backgroundColor: t.colors.overlaySubtle,
  },
  visibilityBtnLabel: { fontSize: 12, fontWeight: '700' },
  visibilityBtnDesc: { fontSize: 9, textAlign: 'center' },

  modalFooter: { flexDirection: 'row', gap: 10, paddingTop: 12, paddingBottom: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: t.colors.overlaySubtle,
    borderWidth: 1,
    borderColor: t.colors.overlayLight,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: t.colors.textSecondary },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: t.colors.brandOrange,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: t.colors.textPrimary },
});
