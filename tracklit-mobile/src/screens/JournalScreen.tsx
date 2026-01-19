import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Slider from '@react-native-community/slider';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import theme from '@/utils/theme';
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

const parseContent = (content: any) => {
  if (!content) return {};
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
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

export const JournalScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const canUse = isAuthenticated && !isGuest;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formType, setFormType] = useState('manual');
  const [formMoodRating, setFormMoodRating] = useState(5);
  const [formIsPublic, setFormIsPublic] = useState(true);

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
            entry.notes?.toLowerCase().includes(term) ||
            entry.type?.toLowerCase().includes(term)
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
          type: formType.trim() || 'manual',
          isPublic: formIsPublic,
          content: {
            moodRating: formMoodRating,
          },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      Alert.alert('Create Failed', error.message || 'Unable to create entry.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: JournalEntry) =>
      apiRequest(`/api/journal/${payload.id}`, {
        method: 'PUT',
        data: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setIsEditOpen(false);
      setEditingEntry(null);
    },
    onError: (error: Error) => {
      Alert.alert('Update Failed', error.message || 'Unable to update entry.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: number) =>
      apiRequest(`/api/journal/${entryId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
    onError: (error: Error) => {
      Alert.alert('Delete Failed', error.message || 'Unable to delete entry.');
    },
  });

  const resetForm = () => {
    setFormTitle('');
    setFormNotes('');
    setFormType('manual');
    setFormMoodRating(5);
    setFormIsPublic(true);
  };

  const handleOpenCreate = () => {
    if (!canUse) {
      Alert.alert('Sign In Required', 'Please sign in to create journal entries.');
      return;
    }
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (entry: JournalEntry) => {
    const content = parseContent(entry.content);
    setEditingEntry({ ...entry, content });
    setFormTitle(entry.title || '');
    setFormNotes(entry.notes || '');
    setFormType(entry.type || 'manual');
    setFormMoodRating(content.moodRating ?? 5);
    setFormIsPublic(entry.isPublic ?? true);
    setIsEditOpen(true);
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
    const payload: JournalEntry = {
      ...editingEntry,
      title: formTitle.trim(),
      notes: formNotes.trim(),
      type: formType.trim() || 'manual',
      isPublic: formIsPublic,
      content: {
        ...(editingEntry.content || {}),
        moodRating: formMoodRating,
      },
    };
    updateMutation.mutate(payload);
  };

  const handleDelete = (entryId: number) => {
    Alert.alert('Delete Entry?', 'This will permanently remove the entry.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(entryId) },
    ]);
  };

  const renderMood = (value?: number) => {
    if (value === undefined || value === null) return null;
    const color =
      value <= 3 ? '#ef4444' : value <= 5 ? '#f59e0b' : '#22c55e';
    return (
      <View style={styles.moodRow}>
        <Text variant="small" color="muted" style={styles.moodLabel}>
          Mood
        </Text>
        <View style={[styles.moodBadge, { backgroundColor: color }]}>
          <Text variant="small" weight="bold" color="primary-foreground">
            {value}
          </Text>
        </View>
        <Text variant="small" color="muted">
          /10
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + theme.spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <FontAwesome5 name="arrow-left" size={20} color={theme.colors.foreground} solid />
            </TouchableOpacity>
            <Text variant="h2" weight="bold" color="foreground">
              Training Journal
            </Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.searchContainer}>
            <FontAwesome5 name="search" size={16} color={theme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search journal entries..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <View style={styles.actionRow}>
            <Button variant="default" size="md" onPress={handleOpenCreate} disabled={!canUse}>
              <FontAwesome5 name="plus" size={14} color="white" solid />
              <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                New Entry
              </Text>
            </Button>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortDirection((dir) => (dir === 'desc' ? 'asc' : 'desc'))}
            >
              <FontAwesome5 name="calendar" size={14} color={theme.colors.textMuted} solid />
              <Text variant="small" color="muted">
                {sortDirection === 'desc' ? 'Newest First' : 'Oldest First'}
              </Text>
            </TouchableOpacity>
          </View>

          {journalQuery.isLoading ? (
            <Text variant="body" color="muted" style={styles.emptyText}>
              Loading entries...
            </Text>
          ) : !canUse ? (
            <Text variant="body" color="muted" style={styles.emptyText}>
              Sign in to view your journal.
            </Text>
          ) : filteredEntries.length === 0 ? (
            <Text variant="body" color="muted" style={styles.emptyText}>
              {searchTerm ? 'No entries match your search.' : 'No journal entries found.'}
            </Text>
          ) : (
            <View style={styles.entriesList}>
              {filteredEntries.map((entry) => (
                <Card key={entry.id} style={styles.entryCard}>
                  <CardContent>
                    <View style={styles.entryHeader}>
                      <View style={styles.entryHeaderText}>
                        <Text variant="h4" weight="bold" color="foreground">
                          {entry.title}
                        </Text>
                        <Text variant="small" color="muted">
                          {formatDate(entry.createdAt)}
                        </Text>
                      </View>
                      <View style={styles.entryActions}>
                        <View style={styles.typeBadge}>
                          <Text variant="small" weight="semiBold" color="primary-foreground">
                            {entry.type}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleOpenEdit(entry)} style={styles.iconButton}>
                          <FontAwesome5 name="edit" size={14} color={theme.colors.foreground} solid />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(entry.id)} style={styles.iconButton}>
                          <FontAwesome5 name="trash" size={14} color={theme.colors.destructive} solid />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {renderMood(entry.content?.moodRating)}

                    {!!entry.notes && (
                      <Text variant="body" color="foreground" style={styles.notesText}>
                        {entry.notes}
                      </Text>
                    )}

                    {entry.content?.shortDistanceWorkout && (
                      <View style={styles.workoutSection}>
                        <Text variant="small" weight="semiBold" color="primary">
                          Short
                        </Text>
                        <Text variant="small" color="muted">
                          {entry.content.shortDistanceWorkout}
                        </Text>
                      </View>
                    )}
                    {entry.content?.mediumDistanceWorkout && (
                      <View style={styles.workoutSection}>
                        <Text variant="small" weight="semiBold" color="primary">
                          Medium
                        </Text>
                        <Text variant="small" color="muted">
                          {entry.content.mediumDistanceWorkout}
                        </Text>
                      </View>
                    )}
                    {entry.content?.longDistanceWorkout && (
                      <View style={styles.workoutSection}>
                        <Text variant="small" weight="semiBold" color="primary">
                          Long
                        </Text>
                        <Text variant="small" color="muted">
                          {entry.content.longDistanceWorkout}
                        </Text>
                      </View>
                    )}
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isCreateOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text variant="h3" weight="bold" color="foreground">
              New Entry
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              placeholderTextColor={theme.colors.textMuted}
              value={formTitle}
              onChangeText={setFormTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Notes"
              placeholderTextColor={theme.colors.textMuted}
              value={formNotes}
              onChangeText={setFormNotes}
              multiline
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Type (e.g., manual)"
              placeholderTextColor={theme.colors.textMuted}
              value={formType}
              onChangeText={setFormType}
            />
            <View style={styles.sliderGroup}>
              <Text variant="small" color="muted">
                Mood Rating: {formMoodRating}
              </Text>
              <Slider
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={formMoodRating}
                onValueChange={setFormMoodRating}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />
            </View>
            <View style={styles.modalActions}>
              <Button variant="outline" size="md" onPress={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button variant="default" size="md" onPress={handleSubmitCreate} loading={createMutation.isPending}>
                Save Entry
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text variant="h3" weight="bold" color="foreground">
              Edit Entry
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              placeholderTextColor={theme.colors.textMuted}
              value={formTitle}
              onChangeText={setFormTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Notes"
              placeholderTextColor={theme.colors.textMuted}
              value={formNotes}
              onChangeText={setFormNotes}
              multiline
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Type (e.g., manual)"
              placeholderTextColor={theme.colors.textMuted}
              value={formType}
              onChangeText={setFormType}
            />
            <View style={styles.sliderGroup}>
              <Text variant="small" color="muted">
                Mood Rating: {formMoodRating}
              </Text>
              <Slider
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={formMoodRating}
                onValueChange={setFormMoodRating}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />
            </View>
            <View style={styles.modalActions}>
              <Button variant="outline" size="md" onPress={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button variant="default" size="md" onPress={handleSubmitEdit} loading={updateMutation.isPending}>
                Save Changes
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.foreground,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
  },
  entriesList: {
    gap: theme.spacing.lg,
  },
  entryCard: {
    marginBottom: 0,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  entryHeaderText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  entryActions: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  typeBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  moodLabel: {
    minWidth: 40,
  },
  moodBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesText: {
    marginTop: theme.spacing.md,
    lineHeight: 20,
  },
  workoutSection: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  buttonText: {
    marginLeft: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.cardSolid,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.background,
  },
  modalTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sliderGroup: {
    gap: theme.spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
});

