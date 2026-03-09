import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Platform,
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
  Vibration,
} from 'react-native';
import { LongPressGestureHandler, State as GHState } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CalendarBlank,
  FloppyDisk,
  Moon,
  Eye,
  CopySimple,
  ArrowsDownUp,
} from 'phosphor-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, parseISO, parse, isValid, addDays, getDay } from 'date-fns';

import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import { SkeletonProgramList } from '@/components/Skeleton';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { env } from '@/config/env';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';
import { goBackOrNavigateToTab } from '@/navigation/appNavigation';

type ProgramEditorRouteProp = RouteProp<RootStackParamList, 'ProgramEditor'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0E0F14',
  surface: '#161823',
  card: '#1C1F2B',
  orange: '#FF7A00',
  orangeLight: '#FF9D00',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C0FF',
  textMuted: '#8A90B5',
  border: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',
  rest: 'rgba(255,122,0,0.12)',
  restBorder: 'rgba(255,122,0,0.3)',
  today: 'rgba(99,102,241,0.15)',
  todayBorder: 'rgba(99,102,241,0.4)',
};

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

export const ProgramEditorScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ProgramEditorRouteProp>();
  const programId = route.params?.id;
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sessionsByDay, setSessionsByDay] = useState<Record<number, ProgramSession>>({});
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [draftSession, setDraftSession] = useState<ProgramSession | null>(null);
  const [dragSourceDay, setDragSourceDay] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragSourceRef = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  const programQuery = useQuery({
    queryKey: ['program', programId],
    queryFn: () => apiRequest<ProgramDetail>(`/api/programs/${programId}`),
    enabled: !!programId,
  });

  const program = programQuery.data;
  const isOwner = !!program && !!user?.id && String(program.userId) === String(user.id);
  const isUploadedProgram = program?.isUploadedProgram === true;

  const populateFromProgram = useCallback((prog: ProgramDetail) => {
    setTitle(prog.title ?? '');
    setDescription(prog.description ?? '');
    setCategory(prog.category ?? '');

    const sessions = prog.sessions ?? [];
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
  }, []);

  useEffect(() => {
    hasInitialized.current = false;
  }, [programId]);

  useEffect(() => {
    if (!program || hasInitialized.current) return;
    hasInitialized.current = true;
    populateFromProgram(program);
  }, [program, populateFromProgram]);

  const totalDays = useMemo(() => {
    const d = program?.duration;
    const baseDays = typeof d === 'number' && d > 0 ? d : 7;
    const maxSessionDay = Object.keys(sessionsByDay).length > 0
      ? Math.max(...Object.keys(sessionsByDay).map(Number))
      : 0;
    return Math.max(baseDays, maxSessionDay);
  }, [program, sessionsByDay]);

  const startDayOfWeek = getDay(startDate);

  const totalCalendarSlots = startDayOfWeek + totalDays;
  const totalWeeks = Math.max(1, Math.ceil(totalCalendarSlots / 7));

  const todayISO = format(new Date(), 'yyyy-MM-dd');

  const invalidateProgramQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['program', programId] });
    queryClient.invalidateQueries({ queryKey: ['program-sessions', String(programId)] });
    queryClient.invalidateQueries({ queryKey: ['user-programs'] });
    queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
    queryClient.invalidateQueries({ queryKey: ['today-session'] });
  }, [programId]);

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new RNAnimated.Value(0)).current;

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    RNAnimated.sequence([
      RNAnimated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      RNAnimated.delay(2000),
      RNAnimated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  }, [toastOpacity]);

  const buildSessionPayload = useCallback(() => {
    return Object.keys(sessionsByDay).map((dayKey) => {
      const dayNumber = Number(dayKey);
      const session = sessionsByDay[dayNumber];
      const dateValue = formatISODate(addDays(startDate, dayNumber - 1));
      const cleaned: ProgramSession = {
        dayNumber,
        date: dateValue,
        title: session.title ?? null,
        description: session.description ?? null,
        preActivation1: session.preActivation1 ?? null,
        preActivation2: session.preActivation2 ?? null,
        shortDistanceWorkout: session.shortDistanceWorkout ?? null,
        mediumDistanceWorkout: session.mediumDistanceWorkout ?? null,
        longDistanceWorkout: session.longDistanceWorkout ?? null,
        extraSession: session.extraSession ?? null,
        notes: session.notes ?? null,
        isRestDay: session.isRestDay ?? false,
      };
      if (session.id != null) {
        cleaned.id = session.id;
      }
      return cleaned;
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

  const handleSaveAll = useCallback(async (silent = false) => {
    if (isUploadedProgram) return;
    setIsSaving(true);
    try {
      const payloadSessions = buildSessionPayload();
      console.warn('[ProgramEditor] Save started:', {
        programId,
        isOwner,
        sessionCount: payloadSessions.length,
        sample: payloadSessions.slice(0, 3).map((s) => ({
          id: s.id,
          dayNumber: s.dayNumber,
          date: s.date,
          title: s.title,
        })),
      });

      if (isOwner) {
        try {
          await apiRequest(`/api/programs/${programId}`, {
            method: 'PUT',
            data: {
              title: title.trim(),
              description: description.trim(),
              category: category.trim(),
              duration: totalDays,
            },
          });
          console.warn('[ProgramEditor] Program metadata saved');
        } catch (metaErr: any) {
          console.warn('[ProgramEditor] Program metadata save failed:', metaErr?.message);
        }
      }

      if (payloadSessions.length > 0) {
        let sessionsSaved = false;

        try {
          await apiRequest(`/api/programs/${programId}/sessions/batch`, {
            method: 'PUT',
            data: { sessions: payloadSessions },
          });
          console.warn('[ProgramEditor] Batch PUT succeeded');
          sessionsSaved = true;
        } catch (batchPutErr: any) {
          console.warn('[ProgramEditor] Batch PUT failed:', batchPutErr?.message);
        }

        if (!sessionsSaved) {
          try {
            await apiRequest(`/api/programs/${programId}/sessions/batch`, {
              method: 'POST',
              data: { sessions: payloadSessions },
            });
            console.warn('[ProgramEditor] Batch POST succeeded');
            sessionsSaved = true;
          } catch (batchPostErr: any) {
            console.warn('[ProgramEditor] Batch POST failed:', batchPostErr?.message);
          }
        }

        if (!sessionsSaved) {
          console.warn('[ProgramEditor] Trying individual session saves...');
          const results = await Promise.allSettled(
            payloadSessions.map((session) => {
              const { id, ...sessionData } = session;
              if (id != null) {
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
          const failures = results.filter((r) => r.status === 'rejected');
          const succeeded = results.length - failures.length;
          console.warn('[ProgramEditor] Individual save results:', {
            total: results.length,
            succeeded,
            failed: failures.length,
            errors: failures.slice(0, 3).map((f: any) => f.reason?.message),
          });
          if (succeeded > 0) {
            sessionsSaved = true;
          }
          if (failures.length === results.length) {
            if (!silent) {
              Alert.alert('Save failed', 'Unable to save sessions. The server may not support this operation.');
            }
            return;
          }
        }

        if (sessionsSaved) {
          console.warn('[ProgramEditor] Sessions saved successfully');
        }
      }

      invalidateProgramQueries();
      if (!silent) {
        showToast('Sessions saved successfully');
      }
    } catch (err: any) {
      console.warn('[ProgramEditor] Save failed:', err?.message);
      if (!silent) {
        Alert.alert('Save failed', err?.message || 'Unable to save program changes.');
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    isOwner,
    isUploadedProgram,
    programId,
    title,
    description,
    category,
    totalDays,
    buildSessionPayload,
    invalidateProgramQueries,
    showToast,
  ]);

  const handleOpenDay = useCallback((dayNumber: number) => {
    const existing = sessionsByDay[dayNumber] ?? { dayNumber };
    setDraftSession({ ...existing });
    setEditingDay(dayNumber);
  }, [sessionsByDay]);

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

  const handleDuplicateWeek = (weekIndex: number) => {
    const sourceDays: { offset: number; session: ProgramSession }[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const slotIndex = weekIndex * 7 + dayIndex;
      const dayNumber = slotIndex - startDayOfWeek + 1;
      if (dayNumber >= 1 && dayNumber <= totalDays && sessionsByDay[dayNumber]) {
        sourceDays.push({ offset: dayIndex, session: sessionsByDay[dayNumber] });
      }
    }
    if (sourceDays.length === 0) {
      Alert.alert('Empty week', 'This week has no sessions to duplicate.');
      return;
    }
    const nextWeekIndex = weekIndex + 1;
    setSessionsByDay((prev) => {
      const next = { ...prev };
      for (const { offset, session } of sourceDays) {
        const targetSlot = nextWeekIndex * 7 + offset;
        const targetDay = targetSlot - startDayOfWeek + 1;
        if (targetDay >= 1) {
          const { id, programId: _pid, ...rest } = session;
          next[targetDay] = { ...rest, dayNumber: targetDay };
        }
      }
      return next;
    });
    Alert.alert('Week duplicated', `Week ${weekIndex + 1} sessions copied to week ${weekIndex + 2}.`);
  };

  const performSwap = useCallback((sourceDay: number, targetDay: number) => {
    setSessionsByDay((prev) => {
      const next = { ...prev };
      const sourceSession = prev[sourceDay];
      const targetSession = prev[targetDay];

      if (sourceSession && targetSession) {
        next[targetDay] = { ...sourceSession, dayNumber: targetDay };
        next[sourceDay] = { ...targetSession, dayNumber: sourceDay };
      } else if (sourceSession) {
        next[targetDay] = { ...sourceSession, dayNumber: targetDay };
        delete next[sourceDay];
      } else if (targetSession) {
        next[sourceDay] = { ...targetSession, dayNumber: sourceDay };
        delete next[targetDay];
      }

      return next;
    });
  }, []);

  const handleDragStart = useCallback((dayNumber: number) => {
    Vibration.vibrate(50);
    dragSourceRef.current = dayNumber;
    setDragSourceDay(dayNumber);
    setIsDragging(true);
  }, []);

  const handleCellTap = useCallback((dayNumber: number) => {
    if (isDragging && dragSourceRef.current !== null) {
      if (dayNumber !== dragSourceRef.current) {
        performSwap(dragSourceRef.current, dayNumber);
      }
      dragSourceRef.current = null;
      setDragSourceDay(null);
      setIsDragging(false);
    } else {
      handleOpenDay(dayNumber);
    }
  }, [isDragging, performSwap, handleOpenDay]);

  const handleCancelDrag = useCallback(() => {
    dragSourceRef.current = null;
    setDragSourceDay(null);
    setIsDragging(false);
  }, []);

  const handleViewOnWeb = async () => {
    if (!programId) return;
    if (program?.programFileUrl) {
      await WebBrowser.openBrowserAsync(program.programFileUrl);
    } else {
      await WebBrowser.openBrowserAsync(`${env.API_BASE_URL}/programs/${programId}`);
    }
  };

  const handleBack = useCallback(() => {
    const finishBackNavigation = () => goBackOrNavigateToTab(navigation, 'Programs');

    const sessions = buildSessionPayload();
    if (sessions.length > 0 && !isUploadedProgram) {
      handleSaveAll(true).finally(finishBackNavigation);
      return;
    }

    finishBackNavigation();
  }, [buildSessionPayload, handleSaveAll, isUploadedProgram, navigation]);


  if (programQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View
          style={[styles.loadingContainer, { paddingTop: insets.top }]}
          testID="program-editor-loading"
        >
          <SkeletonProgramList count={3} />
        </View>
      </View>
    );
  }

  if (programQuery.isError || !program) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={C.textPrimary} weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Program Editor</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Unable to load program.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => programQuery.refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const editingDayDate = editingDay ? format(addDays(startDate, editingDay - 1), 'EEE, MMM d') : '';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Program Editor</Text>
        <View style={styles.headerActions}>
          {isUploadedProgram ? (
            <TouchableOpacity
              style={styles.webBtn}
              onPress={handleViewOnWeb}
              accessibilityRole="button"
              accessibilityLabel="View on web"
            >
              <Eye size={16} color={C.textPrimary} weight="fill" />
              <Text style={styles.webBtnText}>View on web</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.saveBtn} onPress={() => handleSaveAll(false)} disabled={isSaving} activeOpacity={0.8}>
              <LinearGradient
                colors={[C.orange, C.orangeLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <FloppyDisk size={14} color="white" weight="fill" />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAwareScreenScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={80}
        scrollEnabled={!isDragging}
      >
        <View style={styles.detailsCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Program Details</Text>
            {(!isOwner || isUploadedProgram) && (
              <View style={styles.readOnlyBadge}>
                <Text style={styles.readOnlyText}>Read only</Text>
              </View>
            )}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Program title"
              placeholderTextColor={C.textMuted}
              editable={isOwner && !isUploadedProgram}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Program description"
              placeholderTextColor={C.textMuted}
              multiline
              editable={isOwner && !isUploadedProgram}
            />
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaColumn}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. sprint"
                placeholderTextColor={C.textMuted}
                editable={isOwner && !isUploadedProgram}
              />
            </View>
            <View style={styles.metaColumn}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{format(startDate, 'MMM d, yyyy')}</Text>
                <CalendarBlank size={14} color={C.textMuted} weight="fill" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sessionsCard}>
          <View style={styles.sessionsHeader}>
            <Text style={styles.sectionTitle}>Sessions</Text>
            <Text style={styles.sessionCount}>{totalDays} days · {totalWeeks} weeks</Text>
          </View>

          {isDragging && dragSourceDay !== null && (
            <View style={styles.swapBanner}>
              <ArrowsDownUp size={14} color={C.orange} weight="bold" />
              <Text style={styles.swapBannerText}>
                Dragging Day {dragSourceDay} — drop on another day to swap
              </Text>
            </View>
          )}

          <Text style={styles.swapHint}>Long-press a day to select it, then tap another day to swap</Text>

          <View style={styles.dayHeaderRow}>
            {DAY_LABELS.map((label) => (
              <View key={label} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{label}</Text>
              </View>
            ))}
          </View>

          {isDragging && (
            <View style={styles.dragBanner}>
              <ArrowsDownUp size={14} color={C.orange} weight="fill" />
              <Text style={styles.dragBannerText}>
                Day {dragSourceDay} selected — tap target day to swap
              </Text>
              <TouchableOpacity onPress={handleCancelDrag} style={styles.dragCancelBtn}>
                <Text style={styles.dragCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View>
          {Array.from({ length: totalWeeks }).map((_, weekIndex) => (
            <View key={`week-${weekIndex}`}>
              <View style={styles.weekRow}>
                {Array.from({ length: 7 }).map((__, dayIndex) => {
                  const slotIndex = weekIndex * 7 + dayIndex;
                  const dayNumber = slotIndex - startDayOfWeek + 1;

                  if (dayNumber < 1 || dayNumber > totalDays) {
                    return <View key={`empty-${slotIndex}`} style={styles.emptyCell} />;
                  }

                  const session = sessionsByDay[dayNumber];
                  const dayDate = addDays(startDate, dayNumber - 1);
                  const dayDateISO = formatISODate(dayDate);
                  const isToday = dayDateISO === todayISO;
                  const isRest = session?.isRestDay;
                  const hasContent = !!session && !isRest;

                  const isDragSource = dragSourceDay === dayNumber;

                  return (
                    <LongPressGestureHandler
                      key={`day-${dayNumber}`}
                      onHandlerStateChange={(e) => {
                        if (e.nativeEvent.state === GHState.ACTIVE) {
                          handleDragStart(dayNumber);
                        }
                      }}
                      minDurationMs={300}
                    >
                    <TouchableOpacity
                      style={[
                        styles.dayCell,
                        isRest && styles.restCell,
                        isToday && styles.todayCell,
                        isDragSource && styles.dragSourceCell,
                      ]}
                      onPress={() => handleCellTap(dayNumber)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cellHeader}>
                        <Text style={[styles.dateLabel, isToday && styles.todayDateLabel]}>
                          {format(dayDate, 'MMM d')}
                        </Text>
                        {isDragSource && (
                          <ArrowsDownUp size={10} color={C.orange} weight="bold" />
                        )}
                      </View>
                      {isRest ? (
                        <>
                          <Moon size={12} color={C.orange} weight="fill" style={{ marginTop: 2 }} />
                          <Text style={styles.cellSummary}>Rest day</Text>
                        </>
                      ) : null}
                      {hasContent ? (
                        <View style={styles.cellContent}>
                          {session?.title && (
                            <Text style={styles.cellTitle} numberOfLines={1}>
                              {session.title}
                            </Text>
                          )}
                          {session?.preActivation1 && (
                            <Text style={styles.cellField} numberOfLines={1}>
                              PA1: {session.preActivation1}
                            </Text>
                          )}
                          {session?.preActivation2 && (
                            <Text style={styles.cellField} numberOfLines={1}>
                              PA2: {session.preActivation2}
                            </Text>
                          )}
                          {session?.shortDistanceWorkout && (
                            <Text style={styles.cellField} numberOfLines={1}>
                              60/100: {session.shortDistanceWorkout}
                            </Text>
                          )}
                          {session?.mediumDistanceWorkout && (
                            <Text style={styles.cellField} numberOfLines={1}>
                              200: {session.mediumDistanceWorkout}
                            </Text>
                          )}
                          {session?.longDistanceWorkout && (
                            <Text style={styles.cellField} numberOfLines={1}>
                              400: {session.longDistanceWorkout}
                            </Text>
                          )}
                          {session?.extraSession && (
                            <Text style={styles.cellField} numberOfLines={1}>
                              Extra: {session.extraSession}
                            </Text>
                          )}
                          {session?.notes && (
                            <Text style={[styles.cellField, styles.cellNotes]} numberOfLines={1}>
                              {session.notes}
                            </Text>
                          )}
                        </View>
                      ) : (
                        <Text style={styles.cellSummary}>
                          {isRest ? '' : 'Add session'}
                        </Text>
                      )}
                    </TouchableOpacity>
                    </LongPressGestureHandler>
                  );
                })}
              </View>
              <TouchableOpacity
                style={styles.duplicateWeekBtn}
                onPress={() => handleDuplicateWeek(weekIndex)}
                activeOpacity={0.7}
              >
                <CopySimple size={12} color={C.textMuted} weight="fill" />
                <Text style={styles.duplicateWeekText}>Duplicate Week {weekIndex + 1}</Text>
              </TouchableOpacity>
            </View>
          ))}
          </View>
        </View>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Day {editingDay}</Text>
              <Text style={styles.modalSubtitle}>{editingDayDate}</Text>
            </View>
            <KeyboardAwareScreenScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              extraScrollHeight={80}
            >
              <View style={styles.modalFormContent}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Rest Day</Text>
                  <Switch
                    value={!!draftSession?.isRestDay}
                    onValueChange={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), isRestDay: value }))}
                    trackColor={{ false: C.glass, true: C.orange }}
                    thumbColor={draftSession?.isRestDay ? C.orangeLight : '#666'}
                  />
                </View>

                {!draftSession?.isRestDay && (
                  <>
                    <View style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Title</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={draftSession?.title ?? ''}
                        onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), title: value }))}
                        placeholder="Session title"
                        placeholderTextColor={C.textMuted}
                      />
                    </View>
                    <View style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Pre-Activation 1</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={draftSession?.preActivation1 ?? ''}
                        onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), preActivation1: value }))}
                        placeholder="Drills, activation"
                        placeholderTextColor={C.textMuted}
                      />
                    </View>
                    <View style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Pre-Activation 2</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={draftSession?.preActivation2 ?? ''}
                        onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), preActivation2: value }))}
                        placeholder="More activation work"
                        placeholderTextColor={C.textMuted}
                      />
                    </View>
                    <View style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Short Distance</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={draftSession?.shortDistanceWorkout ?? ''}
                        onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), shortDistanceWorkout: value }))}
                        placeholder="60/100m"
                        placeholderTextColor={C.textMuted}
                      />
                    </View>
                    <View style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Medium Distance</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={draftSession?.mediumDistanceWorkout ?? ''}
                        onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), mediumDistanceWorkout: value }))}
                        placeholder="200m"
                        placeholderTextColor={C.textMuted}
                      />
                    </View>
                    <View style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Long Distance</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={draftSession?.longDistanceWorkout ?? ''}
                        onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), longDistanceWorkout: value }))}
                        placeholder="400m"
                        placeholderTextColor={C.textMuted}
                      />
                    </View>
                    <View style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Extra Session</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={draftSession?.extraSession ?? ''}
                        onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), extraSession: value }))}
                        placeholder="Optional extras"
                        placeholderTextColor={C.textMuted}
                      />
                    </View>
                    <View style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Notes</Text>
                      <TextInput
                        style={[styles.modalInput, styles.textArea]}
                        value={draftSession?.notes ?? ''}
                        onChangeText={(value) => setDraftSession((prev) => ({ ...(prev ?? {}), notes: value }))}
                        placeholder="Session notes"
                        placeholderTextColor={C.textMuted}
                        multiline
                      />
                    </View>
                  </>
                )}
              </View>
            </KeyboardAwareScreenScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingDay(null)} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveDayBtn} onPress={handleSaveDay} activeOpacity={0.8}>
                <LinearGradient
                  colors={[C.orange, C.orangeLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveDayBtnGradient}
                >
                  <Text style={styles.saveDayBtnText}>Save Day</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {toastMessage && (
        <RNAnimated.View style={[styles.toastContainer, { opacity: toastOpacity }]} pointerEvents="none">
          <View style={styles.toast}>
            <FloppyDisk size={14} color="white" weight="fill" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </RNAnimated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  headerActions: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  saveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
  webBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  webBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },
  readOnlyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,122,0,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
  },
  readOnlyText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.orange,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.textMuted,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    gap: 16,
  },
  detailsCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
  },
  input: {
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.textPrimary,
    backgroundColor: C.glass,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaColumn: {
    flex: 1,
    gap: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.glass,
  },
  dateText: {
    fontSize: 14,
    color: C.textPrimary,
  },
  sessionsCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 16,
    gap: 12,
  },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayHeaderCell: {
    width: '13%',
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },
  dragBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,122,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  dragBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.orange,
    flex: 1,
  },
  dragCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dragCancelText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textSecondary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dayCell: {
    width: '13%',
    minHeight: 100,
    padding: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  restCell: {
    backgroundColor: C.rest,
    borderColor: C.restBorder,
  },
  todayCell: {
    backgroundColor: C.today,
    borderColor: C.todayBorder,
    borderWidth: 1,
  },
  dragSourceCell: {
    borderColor: C.orange,
    borderWidth: 2,
    backgroundColor: 'rgba(255,122,0,0.15)',
    opacity: 0.6,
  },
  emptyCell: {
    width: '13%',
  },
  cellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: C.textMuted,
  },
  todayDateLabel: {
    color: '#818CF8',
    fontWeight: '700',
  },
  cellContent: {
    gap: 1,
    flex: 1,
  },
  cellTitle: {
    fontSize: 7,
    fontWeight: '700',
    color: C.textPrimary,
    lineHeight: 10,
  },
  cellField: {
    fontSize: 6,
    color: C.textSecondary,
    lineHeight: 9,
  },
  cellNotes: {
    fontStyle: 'italic',
    color: C.textMuted,
  },
  cellSummary: {
    fontSize: 8,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 11,
    marginTop: 4,
  },
  swapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,122,0,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  swapBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: C.orange,
  },
  swapCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  swapHint: {
    fontSize: 10,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  duplicateWeekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  duplicateWeekText: {
    fontSize: 11,
    fontWeight: '500',
    color: C.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 20,
    gap: 12,
    maxHeight: '90%',
  },
  modalHeader: {
    gap: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: C.textMuted,
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalFormContent: {
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.glass,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
  },
  modalInputGroup: {
    gap: 4,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
  },
  modalInput: {
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.textPrimary,
    backgroundColor: C.glass,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
  },
  saveDayBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveDayBtnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveDayBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.92)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
});
