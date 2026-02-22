import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { DocumentViewer } from '@/components/DocumentViewer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ClipboardText,
  Upload,
  CircleIcon as Circle,
  CheckCircle,
  Timer,
} from 'phosphor-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { InlineRefreshHeader } from '@/components/refresh/InlineRefreshHeader';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { getScreenContentBottomPadding, getBottomNavOverlayHeight } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import { ProgramPickerDropdown } from '@/components/practice/ProgramPickerModal';
import { useProgramSessions } from '@/hooks/use-program-sessions';
import { TargetTimesDrawer } from '@/components/practice/TargetTimesDrawer';
import type { RootStackParamList } from '@/navigation/types';
import { PROGRAM_SELECTION_KEY } from '@/utils/programSelection';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface Program {
  id: number | string;
  title: string;
  description?: string;
  category?: string;
  duration?: string;
  isTextBased?: boolean;
  textContent?: string;
  isUploadedProgram?: boolean;
  programFileUrl?: string;
  importedFromSheet?: boolean;
}

interface PurchasedProgramItem {
  id: number | string;
  programId: number | string;
  program: Program;
  assignerName?: string;
}


export const PracticeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const isGuest = user?.id === 'guest';
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });

  const [showTargetTimes, setShowTargetTimes] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<PurchasedProgramItem | null>(null);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [workoutCards, setWorkoutCards] = useState<any[]>([]);
  const [docViewerUrl, setDocViewerUrl] = useState<string | null>(null);
  const [docAutoOpened, setDocAutoOpened] = useState(false);

  const purchasedProgramsQuery = useQuery({
    queryKey: ['purchased-programs'],
    queryFn: () => apiRequest<PurchasedProgramItem[]>('/api/purchased-programs'),
    enabled: isAuthenticated && !isGuest,
  });

  const programs = purchasedProgramsQuery.data ?? [];
  const programIdsKey = useMemo(
    () => programs.map((assignment) => `${assignment.id}:${assignment.programId}:${assignment.program?.title || ''}`).join('|'),
    [programs]
  );

  const selectedProgramId = selectedProgram?.programId ? String(selectedProgram.programId) : null;
  const { programSessions, programDuration, isLoading: isLoadingProgramSessions, refetch: refetchSessions } = useProgramSessions(selectedProgramId);

  useEffect(() => {
    if (!programs.length) {
      setSelectedProgram(null);
      return;
    }

    let isCancelled = false;
    const loadSelection = async () => {
      const savedId = await AsyncStorage.getItem(PROGRAM_SELECTION_KEY);
      const matched = programs.find((assignment) => String(assignment.id) === savedId);
      const nextProgram = matched ?? programs[0];
      if (!isCancelled) {
        setSelectedProgram((previous) => {
          if (previous && String(previous.id) === String(nextProgram.id)) {
            return previous;
          }
          return nextProgram;
        });
      }
      if (!matched) {
        await AsyncStorage.setItem(PROGRAM_SELECTION_KEY, String(nextProgram.id));
      }
    };

    loadSelection();
    return () => {
      isCancelled = true;
    };
  }, [programIdsKey]);

  useEffect(() => {
    if (!selectedProgram) {
      setIsLoadingCards(false);
      setWorkoutCards([]);
      return;
    }

    if (isLoadingProgramSessions) {
      setIsLoadingCards(true);
      return;
    }

    const sessionsToUse = programSessions ?? [];
    const totalDays = Math.max(programDuration, 1);

    const sessionsByDay: Record<number, any> = {};
    sessionsToUse.forEach((session: any) => {
      if (session.dayNumber != null) {
        sessionsByDay[session.dayNumber] = session;
      }
    });

    let startDate: Date | null = null;
    const datesFromSessions = sessionsToUse
      .map((s: any) => parseSessionDateForCard(s.date))
      .filter(Boolean) as Date[];
    if (datesFromSessions.length > 0) {
      datesFromSessions.sort((a, b) => a.getTime() - b.getTime());
      startDate = datesFromSessions[0];
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const cards: any[] = [];
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const session = sessionsByDay[dayNum] || null;

      let dayDate: Date | null = null;
      if (session?.date) {
        dayDate = parseSessionDateForCard(session.date);
      }
      if (!dayDate && startDate) {
        dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + dayNum - 1);
      }

      const dateString = dayDate
        ? dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      const dayOfWeek = dayDate
        ? dayDate.toLocaleDateString('en-US', { weekday: 'long' })
        : '';

      let isToday = false;
      if (dayDate) {
        const dayStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
        isToday = dayStr === todayStr;
      }

      cards.push({
        id: `day-${dayNum}`,
        dayNumber: dayNum,
        date: dayDate || today,
        dateString,
        dayOfWeek,
        sessionData: session,
        isToday,
        index: dayNum - 1,
      });
    }

    setWorkoutCards(cards);
    setIsLoadingCards(false);
  }, [selectedProgram, programSessions, programDuration, isLoadingProgramSessions]);

  const handleSelectProgram = async (assignment: PurchasedProgramItem) => {
    setSelectedProgram(assignment);
    setWorkoutCards([]);
    setIsLoadingCards(true);
    setDocViewerUrl(null);
    setDocAutoOpened(false);
    await AsyncStorage.setItem(PROGRAM_SELECTION_KEY, String(assignment.id));
    await queryClient.invalidateQueries({
      queryKey: ['program-sessions', String(assignment.programId)],
    });
  };

  useEffect(() => {
    if (
      selectedProgram?.program?.isUploadedProgram &&
      selectedProgram?.program?.programFileUrl &&
      !docAutoOpened
    ) {
      setDocViewerUrl(selectedProgram.program.programFileUrl);
      setDocAutoOpened(true);
    }
  }, [selectedProgram, docAutoOpened]);

  const { isRefreshing, onRefresh } = usePullToRefresh(async () => {
    await Promise.all([queryClient.invalidateQueries(), refreshUser()]);
  });

  return (
      <LinearGradient
        colors={theme.gradient.background}
        locations={theme.gradient.locations}
        style={styles.container}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top, paddingBottom: contentBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              tintColor="#fff"
              refreshing={isRefreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <InlineRefreshHeader visible={isRefreshing} />

          <View style={styles.programsRow}>
            <ProgramPickerDropdown
              programs={purchasedProgramsQuery.data ?? []}
              selectedProgramId={selectedProgram?.id ?? null}
              onSelect={handleSelectProgram}
              isLoading={purchasedProgramsQuery.isLoading}
            />
          </View>

          {selectedProgram ? (
            <View style={styles.contentContainer}>
              {selectedProgram.program?.isTextBased && selectedProgram.program?.textContent && (
                <Card style={styles.textProgramCard}>
                  <CardContent>
                    <View style={styles.programHeaderRow}>
                      <ClipboardText size={16} color={theme.colors.primary} weight="fill" />
                      <Text variant="small" weight="semiBold" color="foreground">
                        Program Content
                      </Text>
                    </View>
                    <View style={styles.textProgramContent}>
                      <Text variant="small" color="foreground" style={styles.monoText}>
                        {selectedProgram.program.textContent}
                      </Text>
                    </View>
                    <View style={styles.programNote}>
                      <Text variant="small" color="muted">
                        This is a text-based program. Scroll through the content above to find your sessions.
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              )}

              {selectedProgram.program?.isUploadedProgram && selectedProgram.program?.programFileUrl && (
                docViewerUrl ? (
                  <DocumentViewer
                    url={docViewerUrl}
                    title={selectedProgram.program?.title || 'Program Document'}
                    onClose={() => setDocViewerUrl(null)}
                  />
                ) : (
                  <Card style={styles.collapsedDocCard}>
                    <CardContent style={styles.collapsedDocContent}>
                      <View style={styles.collapsedDocLeft}>
                        <Upload size={16} color={theme.colors.primary} weight="fill" />
                        <Text variant="small" weight="semiBold" color="foreground">
                          Assigned Program
                        </Text>
                      </View>
                      <Button
                        variant="default"
                        size="sm"
                        onPress={() => setDocViewerUrl(selectedProgram.program.programFileUrl!)}
                        style={styles.collapsedDocOpenBtn}
                      >
                        <Text variant="small" weight="bold" color="primary-foreground">
                          Open
                        </Text>
                      </Button>
                    </CardContent>
                  </Card>
                )
              )}

              {(isLoadingCards || isLoadingProgramSessions) && (
                <View style={styles.cardsList}>
                  <View style={styles.loadingState}>
                    <Text variant="body" color="muted">Loading sessions...</Text>
                  </View>
                </View>
              )}

              {!isLoadingCards && !isLoadingProgramSessions && workoutCards.length > 0 && (
                <View style={styles.cardsList}>
                  {workoutCards.map((card) => (
                    <SessionCard
                      key={card.id}
                      card={card}
                      programId={selectedProgramId}
                      onFinish={(date: string) => navigation.navigate('JournalEntry', { date })}
                    />
                  ))}
                </View>
              )}

              {!isLoadingCards && !isLoadingProgramSessions && programSessions.length === 0
                && !selectedProgram.program?.isTextBased
                && !selectedProgram.program?.isUploadedProgram && (
                <View style={styles.cardsList}>
                  <LinearGradient
                    colors={['#1e40af', '#c084fc']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyGradientCard}
                  >
                    <Text variant="small" weight="semiBold" color="primary-foreground" style={styles.emptyTitle}>
                      No workout sessions available
                    </Text>
                    <Text variant="caption" color="primary-foreground" style={styles.emptyText}>
                      Check back later or contact your coach for program updates.
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          ) : (
            <LinearGradient
              colors={['#1e40af', '#c084fc']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyGradientCard}
            >
              <Text variant="small" weight="semiBold" color="primary-foreground" style={styles.emptyTitle}>
                No training program assigned
              </Text>
              <Text variant="caption" color="primary-foreground" style={styles.emptyText}>
                Contact your coach to get a program assigned to your account.
              </Text>
              <Button variant="outline" onPress={() => navigation.navigate('Programs' as any)} style={styles.emptyButton}>
                <Text variant="small" weight="medium" color="primary-foreground">
                  View Available Programs
                </Text>
              </Button>
            </LinearGradient>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.targetTimesButton, { bottom: getBottomNavOverlayHeight(insets.bottom) + theme.spacing.lg }]}
          onPress={() => setShowTargetTimes(true)}
        >
          <LinearGradient
            colors={theme.gradients.webPurple.colors}
            start={theme.gradients.webPurple.start}
            end={theme.gradients.webPurple.end}
            style={styles.targetTimesButtonInner}
          >
            <Timer size={20} color="white" weight="fill" />
            <Text variant="small" weight="bold" color="primary-foreground">
              %
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TargetTimesDrawer visible={showTargetTimes} onClose={() => setShowTargetTimes(false)} />

      </LinearGradient>
  );
};

const MONTH_MAP: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

const parseSessionDateForCard = (rawDate?: string | null): Date | null => {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  const shortMatch = trimmed.match(/^([A-Za-z]{3})-(\d{1,2})$/);
  if (shortMatch) {
    const mon = shortMatch[1][0].toUpperCase() + shortMatch[1].slice(1).toLowerCase();
    const monthIdx = MONTH_MAP[mon];
    if (monthIdx !== undefined) return new Date(new Date().getFullYear(), monthIdx, parseInt(shortMatch[2]));
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const useGymData = (programId: number | string | null, dayNumber?: number, sessionId?: number) => {
  return useQuery({
    queryKey: ['gym-data', programId, dayNumber, sessionId],
    queryFn: async () => {
      if (sessionId) {
        return apiRequest<{ gymData: string[] }>(`/api/sessions/${sessionId}/gym-data`);
      }
      if (programId && dayNumber) {
        return apiRequest<{ gymData: string[] }>(`/api/programs/${programId}/days/${dayNumber}/gym-data`);
      }
      return { gymData: [] };
    },
    enabled: !!(sessionId || (programId && dayNumber)),
  });
};

const SessionCard = ({
  card,
  programId,
  onFinish,
}: {
  card: any;
  programId: number | string | null;
  onFinish: (date: string) => void;
}) => {
  const sessionId = card.sessionData?.id;
  const dayNumber = card.sessionData?.dayNumber || card.dayNumber;
  const { data } = useGymData(programId, dayNumber, sessionId);
  const gymData = data?.gymData ?? [];
  const finishDate = card.date ? card.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const hasSession = !!card.sessionData;
  const isRestDay = card.sessionData?.isRestDay;

  const headerLabel = card.dayOfWeek
    ? `${card.dayOfWeek} · Day ${card.dayNumber}`
    : `Day ${card.dayNumber}`;

  if (!hasSession) {
    return (
      <View style={styles.emptyDayCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Text variant="small" weight="medium" color="muted">
              {headerLabel}
            </Text>
          </View>
          {card.dateString ? (
            <Text variant="small" color="muted" style={styles.dateText}>
              {card.dateString}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  if (isRestDay) {
    return (
      <View style={styles.restDayCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Text variant="small" weight="medium" color="muted">
              {headerLabel}
            </Text>
          </View>
          {card.dateString ? (
            <Text variant="small" color="muted" style={styles.dateText}>
              {card.dateString}
            </Text>
          ) : null}
        </View>
        <View style={styles.restDay}>
          <Text variant="body" weight="semiBold" color="muted">Rest Day</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.workoutCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <Text variant="small" weight="medium" color="foreground">
            {headerLabel}
          </Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <TouchableOpacity style={styles.finishButton} onPress={() => onFinish(finishDate)}>
            <Text variant="small" color="primary">
              Finish
            </Text>
          </TouchableOpacity>
          {card.dateString ? (
            <Text variant="small" color="muted" style={styles.dateText}>
              {card.dateString}
            </Text>
          ) : null}
        </View>
      </View>

      <WorkoutCardContent sessionData={card.sessionData} gymData={gymData} />
    </View>
  );
};

const WorkoutCardContent = ({ sessionData, gymData }: { sessionData: any; gymData: string[] }) => {
  if (!sessionData) {
    return null;
  }

  const extractGymNumber = () => {
    const fields = [
      sessionData.shortDistanceWorkout,
      sessionData.mediumDistanceWorkout,
      sessionData.longDistanceWorkout,
      sessionData.preActivation1,
      sessionData.preActivation2,
      sessionData.extraSession,
    ];
    for (const field of fields) {
      if (field && typeof field === 'string') {
        const match = field.match(/Gym\s*(\d+)/i);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
    return null;
  };

  const gymNumber = extractGymNumber();
  const hasGymData = gymData.length > 0;

  const sessionTitle = sessionData.title && sessionData.title !== 'Day Training' ? sessionData.title : null;
  const sessionDescription = sessionData.description && sessionData.description !== 'Training Session' ? sessionData.description : null;

  const contentSections = [
    { label: 'Pre-Activation 1', value: sessionData.preActivation1, icon: 'check' },
    { label: 'Pre-Activation 2', value: sessionData.preActivation2, icon: 'check' },
    { label: '60m/100m Sprint', value: sessionData.shortDistanceWorkout, icon: 'circle' },
    { label: '200m Sprint', value: sessionData.mediumDistanceWorkout, icon: 'circle' },
    { label: '400m Sprint', value: sessionData.longDistanceWorkout, icon: 'circle' },
    { label: 'Extra Session', value: sessionData.extraSession, icon: 'circle' },
  ];

  const hasAnyContent = hasGymData || contentSections.some((s) => !!s.value) || sessionTitle || sessionData.notes;

  return (
    <View style={styles.cardSections}>
      {sessionTitle && (
        <View style={styles.sessionTitleRow}>
          <ClipboardText size={14} color="white" weight="fill" />
          <Text variant="body" weight="bold" color="primary-foreground">
            {sessionTitle}
          </Text>
        </View>
      )}
      {sessionDescription && (
        <Text variant="small" color="primary-foreground" style={styles.sessionDescription}>
          {sessionDescription}
        </Text>
      )}
      {hasGymData && (
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Circle size={10} color="white" weight="fill" />
            </View>
            <Text variant="small" weight="semiBold" color="primary-foreground" style={styles.sectionTitle}>
              {gymNumber ? `Gym ${gymNumber}` : 'Gym Exercises'}
            </Text>
          </View>
          {gymData.map((exercise, idx) => (
            <Text key={`${exercise}-${idx}`} variant="small" color="primary-foreground" style={styles.sectionText}>
              {exercise}
            </Text>
          ))}
        </View>
      )}
      {contentSections.map((section) =>
        section.value ? (
          <View key={section.label} style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                {section.icon === 'check'
                  ? <CheckCircle size={10} color="white" weight="fill" />
                  : <Circle size={10} color="white" weight="fill" />
                }
              </View>
              <Text variant="small" weight="semiBold" color="primary-foreground" style={styles.sectionTitle}>
                {section.label}
              </Text>
            </View>
            <Text variant="small" color="primary-foreground" style={styles.sectionText}>
              {String(section.value).replace(/^"|"$/g, '')}
            </Text>
          </View>
        ) : null
      )}
      {sessionData.notes && (
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <ClipboardText size={10} color="white" weight="fill" />
            </View>
            <Text variant="small" weight="semiBold" color="primary-foreground" style={styles.sectionTitle}>
              Notes
            </Text>
          </View>
          <Text variant="small" color="primary-foreground" style={styles.sectionText}>
            {sessionData.notes}
          </Text>
        </View>
      )}
      {!hasAnyContent && (
        <View style={styles.sessionPlaceholder}>
          <Text variant="small" weight="medium" color="primary-foreground">
            Day {sessionData.dayNumber || '—'} Session
          </Text>
          <Text variant="caption" color="primary-foreground" style={{ opacity: 0.7, marginTop: 4 }}>
            No workout details added yet
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
  },
  programsRow: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    zIndex: 10,
  },
  contentContainer: {
    marginTop: theme.spacing.md,
  },
  textProgramCard: {
    borderRadius: theme.borderRadius.webCard,
    borderWidth: 1,
    borderColor: theme.colors.webCardBorder,
    marginBottom: theme.spacing.lg,
  },
  programHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  textProgramContent: {
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    maxHeight: 320,
  },
  programNote: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  monoText: {
    fontFamily: 'Courier',
  },
  cardsList: {
    gap: theme.spacing.lg,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyGradientCard: {
    marginTop: theme.spacing.xl,
    borderRadius: 12,
    padding: theme.spacing.xl,
    minHeight: 120,
    gap: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  emptyTitle: {
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
  emptyButton: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
  },
  workoutCard: {
    padding: theme.spacing.xl,
    borderRadius: 12,
    backgroundColor: '#1C1F2B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...theme.shadows.md,
  },
  emptyDayCard: {
    padding: theme.spacing.xl,
    borderRadius: 12,
    backgroundColor: '#161823',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 60,
  },
  restDayCard: {
    padding: theme.spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.15)',
    backgroundColor: 'rgba(255,122,0,0.04)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  todayBadge: {
    backgroundColor: '#FF7A00',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
  },
  finishButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dateText: {
    opacity: 0.8,
  },
  cardSections: {
    gap: theme.spacing.sm,
  },
  cardSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sectionIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
  },
  sectionText: {
    lineHeight: 18,
    opacity: 0.85,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sessionDescription: {
    opacity: 0.85,
    marginBottom: theme.spacing.xs,
  },
  sessionPlaceholder: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  restDay: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  restDayText: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    opacity: 0.8,
  },
  openDocButton: {
    marginTop: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  collapsedDocCard: {
    borderRadius: theme.borderRadius.lg,
  },
  collapsedDocContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  collapsedDocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  collapsedDocOpenBtn: {
    paddingHorizontal: theme.spacing.lg,
  },
  targetTimesButton: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xl * 2,
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  targetTimesButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 16,
  },
});
