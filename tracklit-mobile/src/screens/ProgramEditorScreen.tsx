import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Linking,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, parseISO, parse, isValid, addDays } from 'date-fns';

import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { env } from '@/config/env';
import theme from '@/utils/theme';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';

type ProgramEditorRouteProp = RouteProp<RootStackParamList, 'ProgramEditor'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface ProgramSession {
  id?: number;
  programId?: number;
  dayNumber?: number;
  date?: string | null;
  title?: string | null;
  description?: string | null;
  preActivation1?: string | null;
  preActivation2?: string | null;
  shortDistanceWorkout?: string | null;
  mediumDistanceWorkout?: string | null;
  longDistanceWorkout?: string | null;
  extraSession?: string | null;
  notes?: string | null;
  isRestDay?: boolean | null;
}

interface ProgramDetail {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  level?: string | null;
  duration: number;
  isUploadedProgram?: boolean;
  programFileUrl?: string | null;
  isTextBased?: boolean;
  textContent?: string | null;
  userId: number;
  sessions?: ProgramSession[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseSessionDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const isoCandidate = parseISO(value);
  if (isValid(isoCandidate)) return isoCandidate;
  const shortCandidate = parse(value, 'MMM-d', new Date());
  return isValid(shortCandidate) ? shortCandidate : null;
};

const formatISODate = (date: Date) => format(date, 'yyyy-MM-dd');

const getSummary = (session?: ProgramSession) => {
  if (!session) return 'Add session';
  if (session.isRestDay) return 'Rest day';
  return (
    session.shortDistanceWorkout ||
    session.mediumDistanceWorkout ||
    session.longDistanceWorkout ||
    session.preActivation1 ||
    session.title ||
    'Edit session'
  );
};

export const ProgramEditorScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ProgramEditorRouteProp>();
  const programId = route.params?.id;
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [duration, setDuration] = useState('28');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sessionsByDay, setSessionsByDay] = useState<Record<number, ProgramSession>>({});
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [draftSession, setDraftSession] = useState<ProgramSession | null>(null);

  const programQuery = useQuery({
    queryKey: ['program', programId],
    queryFn: () => apiRequest<ProgramDetail>(`/api/programs/${programId}`),
    enabled: !!programId,
  });

  const program = programQuery.data;
  const isOwner = !!program && !!user?.id && program.userId === user.id;
  const isUploadedProgram = program?.isUploadedProgram === true;

  useEffect(() => {
    if (!program) return;
    setTitle(program.title ?? '');
    setDescription(program.description ?? '');
    setCategory(program.category ?? '');
    setLevel(program.level ?? '');
    setDuration(String(program.duration ?? 28));

    const sessions = program.sessions ?? [];
    const earliest = sessions
      .map((session) => parseSessionDate(session.date ?? undefined))
      .filter((value): value is Date => !!value)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    setStartDate(earliest ?? new Date());

    const nextSessions: Record<number, ProgramSession> = {};
    sessions.forEach((session) => {
      if (session.dayNumber) {
        nextSessions[session.dayNumber] = session;
      }
    });
    setSessionsByDay(nextSessions);
  }, [program]);

  const totalDays = useMemo(() => {
    const parsed = parseInt(duration, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [duration]);
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

  const invalidateProgramQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['program', programId] });
    queryClient.invalidateQueries({ queryKey: ['/api/programs', programId, 'sessions'] });
    queryClient.invalidateQueries({ queryKey: ['user-programs'] });
    queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
  }, [programId]);

  const updateProgramMutation = useMutation({
    mutationFn: async () => {
      if (!programId) return;
      return apiRequest(`/api/programs/${programId}`, {
        method: 'PUT',
        data: {
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          level: level.trim(),
          duration: totalDays,
        },
      });
    },
  });

  const buildSessionPayload = useCallback(() => {
    return Object.keys(sessionsByDay).map((dayKey) => {
      const dayNumber = Number(dayKey);
      const session = sessionsByDay[dayNumber];
      const dateValue = formatISODate(addDays(startDate, dayNumber - 1));
      return {
        ...session,
        dayNumber,
        date: dateValue,
      };
    }).filter((session) => {
      if (session.isRestDay) return true;
      return Boolean(
        session.title ||
        session.description ||
        session.preActivation1 ||
        session.preActivation2 ||
        session.shortDistanceWorkout ||
        session.mediumDistanceWorkout ||
        session.longDistanceWorkout ||
        session.extraSession ||
        session.notes
      );
    });
  }, [sessionsByDay, startDate]);

  const batchSaveMutation = useMutation({
    mutationFn: async (payloadSessions: ProgramSession[]) => {
      if (!programId || payloadSessions.length === 0) return;
      return apiRequest(`/api/programs/${programId}/sessions/batch`, {
        method: 'PUT',
        data: {
          sessions: payloadSessions,
        },
      });
    },
    onSuccess: () => {
      invalidateProgramQueries();
    },
  });

  const saveSessionsIndividually = useCallback(
    async (payloadSessions: ProgramSession[]) => {
      if (!programId || payloadSessions.length === 0) return;

      await Promise.all(
        payloadSessions.map((session) => {
          const { id, ...sessionData } = session;
          if (typeof id === 'number') {
            return apiRequest(`/api/programs/${programId}/sessions/${id}`, {
              method: 'PUT',
              data: sessionData,
            });
          }

          return apiRequest(`/api/programs/${programId}/sessions`, {
            method: 'POST',
            data: sessionData,
          });
        })
      );
    },
    [programId]
  );

  const handleSaveAll = useCallback(async () => {
    if (!isOwner || isUploadedProgram) return;
    try {
      await updateProgramMutation.mutateAsync();
      const payloadSessions = buildSessionPayload();
      if (payloadSessions.length > 0) {
        try {
          await batchSaveMutation.mutateAsync(payloadSessions);
        } catch (error: any) {
          const status = error?.status;
          const message = String(error?.message || '');
          const isKnownBatchRouteIssue =
            status === 400 && /invalid id parameters/i.test(message);

          if (!isKnownBatchRouteIssue) {
            throw error;
          }

          await saveSessionsIndividually(payloadSessions);
          invalidateProgramQueries();
        }
      }

      Alert.alert('Saved', 'Program changes were saved successfully.');
    } catch (error: any) {
      Alert.alert('Save failed', error?.message || 'Unable to save program changes.');
    }
  }, [
    isOwner,
    isUploadedProgram,
    updateProgramMutation,
    buildSessionPayload,
    batchSaveMutation,
    saveSessionsIndividually,
    invalidateProgramQueries,
  ]);

  const handleOpenDay = (dayNumber: number) => {
    if (!isOwner || isUploadedProgram) return;
    const existing = sessionsByDay[dayNumber] ?? { dayNumber };
    setDraftSession({ ...existing });
    setEditingDay(dayNumber);
  };

  const handleSaveDay = () => {
    if (editingDay === null || !draftSession) return;
    setSessionsByDay((prev) => ({
      ...prev,
      [editingDay]: {
        ...prev[editingDay],
        ...draftSession,
        dayNumber: editingDay,
      },
    }));
    setEditingDay(null);
    setDraftSession(null);
  };

  const handleViewOnWeb = () => {
    if (!programId) return;
    const url = program?.programFileUrl || `${env.API_BASE_URL}/programs/${programId}`;
    Linking.openURL(url).catch(() => undefined);
  };

  if (programQuery.isLoading) {
    return (
      <LinearGradient
        colors={theme.gradient.background}
        locations={theme.gradient.locations}
        style={styles.container}
      >
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color="muted" style={styles.loadingText}>
            Loading program...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (programQuery.isError || !program) {
    return (
      <LinearGradient
        colors={theme.gradient.background}
        locations={theme.gradient.locations}
        style={styles.container}
      >
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <Text variant="body" color="muted">
            Unable to load program.
          </Text>
          <Button variant="outline" size="sm" onPress={() => programQuery.refetch()}>
            Retry
          </Button>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
        </TouchableOpacity>
        <Text variant="h4" weight="bold" color="foreground" style={styles.headerTitle} numberOfLines={1}>
          Program Editor
        </Text>
        <View style={styles.headerActions}>
          {!isUploadedProgram && (
            <Button variant="default" size="sm" onPress={handleSaveAll} loading={updateProgramMutation.isPending || batchSaveMutation.isPending}>
              Save
            </Button>
          )}
        </View>
      </View>

      <KeyboardAwareScreenScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={80}
      >
        <Card style={styles.metaCard}>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
          </CardHeader>
          <CardContent style={styles.metaContent}>
            <View style={styles.inputGroup}>
              <Text variant="small" color="muted">Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Program title"
                placeholderTextColor={theme.colors.textMuted}
                editable={isOwner && !isUploadedProgram}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text variant="small" color="muted">Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Program description"
                placeholderTextColor={theme.colors.textMuted}
                multiline
                editable={isOwner && !isUploadedProgram}
              />
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaColumn}>
                <Text variant="small" color="muted">Category</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="e.g. sprint"
                  placeholderTextColor={theme.colors.textMuted}
                  editable={isOwner && !isUploadedProgram}
                />
              </View>
              <View style={styles.metaColumn}>
                <Text variant="small" color="muted">Level</Text>
                <TextInput
                  style={styles.input}
                  value={level}
                  onChangeText={setLevel}
                  placeholder="e.g. intermediate"
                  placeholderTextColor={theme.colors.textMuted}
                  editable={isOwner && !isUploadedProgram}
                />
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaColumn}>
                <Text variant="small" color="muted">Start Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                  disabled={!isOwner || isUploadedProgram}
                >
                  <Text variant="small" color="foreground">
                    {format(startDate, 'yyyy-MM-dd')}
                  </Text>
                  <FontAwesome5 name="calendar" size={12} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.metaColumn}>
                <Text variant="small" color="muted">Duration (days)</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                  editable={isOwner && !isUploadedProgram}
                />
              </View>
            </View>
            {isUploadedProgram && (
              <Button variant="outline" size="sm" onPress={handleViewOnWeb}>
                View on web
              </Button>
            )}
          </CardContent>
        </Card>

        <Card style={styles.gridCard}>
          <CardHeader style={styles.gridHeader}>
            <CardTitle>Sessions</CardTitle>
            {!isOwner && (
              <Badge variant="outline" size="sm">Read only</Badge>
            )}
          </CardHeader>
          <CardContent>
            <View style={styles.dayHeaderRow}>
              {DAY_LABELS.map((label) => (
                <Text key={label} variant="small" color="muted" style={styles.dayHeaderText}>
                  {label}
                </Text>
              ))}
            </View>
            {Array.from({ length: totalWeeks }).map((_, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekRow}>
                {Array.from({ length: 7 }).map((__, dayIndex) => {
                  const dayNumber = weekIndex * 7 + dayIndex + 1;
                  if (dayNumber > totalDays) {
                    return <View key={`empty-${dayNumber}`} style={styles.emptyCell} />;
                  }
                  const session = sessionsByDay[dayNumber];
                  const dayDate = addDays(startDate, dayNumber - 1);
                  return (
                    <TouchableOpacity
                      key={`day-${dayNumber}`}
                      style={[styles.dayCell, session?.isRestDay && styles.restCell]}
                      onPress={() => handleOpenDay(dayNumber)}
                      disabled={!isOwner || isUploadedProgram}
                    >
                      <Text variant="caption" color="muted" style={styles.dateLabel}>
                        {format(dayDate, 'MMM d')}
                      </Text>
                      <Text variant="small" color="foreground" numberOfLines={3}>
                        {getSummary(session)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </CardContent>
        </Card>
      </KeyboardAwareScreenScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selected) setStartDate(selected);
          }}
        />
      )}

      <Modal visible={editingDay !== null} transparent animationType="slide" onRequestClose={() => setEditingDay(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text variant="h4" weight="semiBold" color="foreground">
              Day {editingDay}
            </Text>
            <KeyboardAwareScreenScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              extraScrollHeight={80}
            >
              <View style={styles.modalFormContent}>
                <View style={styles.inputGroup}>
                  <Text variant="small" color="muted">Title</Text>
                  <TextInput
                    style={styles.input}
                    value={draftSession?.title ?? ''}
                    onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), title: value }))}
                    placeholder="Session title"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text variant="small" color="foreground">Rest day</Text>
                  <Switch
                    value={!!draftSession?.isRestDay}
                    onValueChange={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), isRestDay: value }))}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text variant="small" color="muted">Pre-Activation 1</Text>
                  <TextInput
                    style={styles.input}
                    value={draftSession?.preActivation1 ?? ''}
                    onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), preActivation1: value }))}
                    placeholder="Drills, activation"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text variant="small" color="muted">Pre-Activation 2</Text>
                  <TextInput
                    style={styles.input}
                    value={draftSession?.preActivation2 ?? ''}
                    onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), preActivation2: value }))}
                    placeholder="More activation work"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text variant="small" color="muted">Short Distance</Text>
                  <TextInput
                    style={styles.input}
                    value={draftSession?.shortDistanceWorkout ?? ''}
                    onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), shortDistanceWorkout: value }))}
                    placeholder="60/100m"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text variant="small" color="muted">Medium Distance</Text>
                  <TextInput
                    style={styles.input}
                    value={draftSession?.mediumDistanceWorkout ?? ''}
                    onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), mediumDistanceWorkout: value }))}
                    placeholder="200m"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text variant="small" color="muted">Long Distance</Text>
                  <TextInput
                    style={styles.input}
                    value={draftSession?.longDistanceWorkout ?? ''}
                    onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), longDistanceWorkout: value }))}
                    placeholder="400m"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text variant="small" color="muted">Extra Session</Text>
                  <TextInput
                    style={styles.input}
                    value={draftSession?.extraSession ?? ''}
                    onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), extraSession: value }))}
                    placeholder="Optional extras"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text variant="small" color="muted">Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={draftSession?.notes ?? ''}
                    onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), notes: value }))}
                    placeholder="Session notes"
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                  />
                </View>
              </View>
            </KeyboardAwareScreenScrollView>
            <View style={styles.modalActions}>
              <Button variant="outline" size="sm" onPress={() => setEditingDay(null)}>
                Cancel
              </Button>
              <Button variant="default" size="sm" onPress={handleSaveDay}>
                Save day
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
    gap: theme.spacing.lg,
  },
  metaCard: {
    borderRadius: theme.borderRadius.lg,
  },
  metaContent: {
    gap: theme.spacing.md,
  },
  inputGroup: {
    gap: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metaColumn: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
  },
  gridCard: {
    borderRadius: theme.borderRadius.lg,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  dayHeaderText: {
    width: '13%',
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  dayCell: {
    width: '13%',
    minHeight: 90,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  restCell: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  emptyCell: {
    width: '13%',
  },
  dateLabel: {
    marginBottom: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    maxHeight: '90%',
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalFormContent: {
    gap: theme.spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
});
