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
  const [daysToShow, setDaysToShow] = useState(7);
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
  const { programSessions, isLoading: isLoadingProgramSessions } = useProgramSessions(selectedProgramId);

  useEffect(() => {
    if (!programs.length) {
      setSelectedProgram(null);
      return;
    }

    let isCancelled = false;
    const loadSelection = async () => {
      const savedId = await AsyncStorage.getItem(PROGRAM_SELECTION_KEY);
      console.warn('[Practice] Loading selection. savedId:', savedId, 'programs:', programs.map(p => ({
        purchaseId: p.id,
        programId: p.programId,
        title: p.program?.title,
      })));
      const matched = programs.find((assignment) => String(assignment.id) === savedId);
      const nextProgram = matched ?? programs[0];
      console.warn('[Practice] Resolved program:', {
        matchedByStorage: !!matched,
        purchaseId: nextProgram.id,
        programId: nextProgram.programId,
        title: nextProgram.program?.title,
      });
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

    const today = new Date();
    const cards: any[] = [];

    const sessionsToUse = programSessions ?? [];
    console.warn('[Practice] Building cards:', {
      programTitle: selectedProgram.program?.title,
      programId: selectedProgram.programId,
      sessionCount: sessionsToUse.length,
      sampleDates: sessionsToUse.slice(0, 3).map((s: any) => ({ date: s.date, dayNumber: s.dayNumber, title: s.title })),
    });

    let startDate: Date | null = null;
    if (sessionsToUse.length > 0) {
      const MONTH_MAP: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
      const dateKeys = sessionsToUse
        .map((s: any) => s.date)
        .filter(Boolean)
        .map((d: string) => {
          const isoMatch = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (isoMatch) return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
          const shortMatch = d.match(/^([A-Za-z]{3})-(\d{1,2})$/);
          if (shortMatch) {
            const mon = shortMatch[1][0].toUpperCase() + shortMatch[1].slice(1).toLowerCase();
            const monthIdx = MONTH_MAP[mon];
            if (monthIdx !== undefined) return new Date(new Date().getFullYear(), monthIdx, parseInt(shortMatch[2]));
          }
          return null;
        })
        .filter(Boolean) as Date[];
      if (dateKeys.length > 0) {
        dateKeys.sort((a, b) => a.getTime() - b.getTime());
        startDate = dateKeys[0];
      }
    }

    for (let i = 0; i < daysToShow; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      let sessionForDate = findSessionForDate(sessionsToUse, date);

      if (!sessionForDate && startDate && sessionsToUse.length > 0) {
        const daysSinceStart = Math.round((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (daysSinceStart >= 1) {
          sessionForDate = sessionsToUse.find((s: any) => s.dayNumber === daysSinceStart) || null;
        }
      }

      cards.push({
        id: `${date.getTime()}-${i}`,
        date,
        dateString: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        sessionData: sessionForDate,
        isToday: i === 0,
      });
    }

    setWorkoutCards(cards);
    setIsLoadingCards(false);
  }, [selectedProgram, programSessions, isLoadingProgramSessions, daysToShow]);

  const handleSelectProgram = async (assignment: PurchasedProgramItem) => {
    console.warn('[Practice] Selected program:', {
      purchaseId: assignment.id,
      programId: assignment.programId,
      title: assignment.program?.title,
    });
    setSelectedProgram(assignment);
    setDaysToShow(7);
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
                  <WorkoutCard
                    key={card.id}
                    card={card}
                    programId={selectedProgramId}
                    onFinish={(date: string) => navigation.navigate('JournalEntry', { date })}
                  />
                ))}
                <View style={styles.loadMoreContainer}>
                  <Button variant="default" onPress={() => setDaysToShow((prev) => prev + 7)}>
                    Load More Days
                  </Button>
                </View>
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

const formatSessionDateKey = (date: Date) => {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month}-${day}`;
};

const normalizeSessionDateKey = (rawDate?: string | null) => {
  if (!rawDate) return null;

  const trimmed = rawDate.trim();
  if (!trimmed) return null;

  const shortFormatMatch = trimmed.match(/^([A-Za-z]{3})-(\d{1,2})$/);
  if (shortFormatMatch) {
    const [, month, day] = shortFormatMatch;
    const normalizedMonth = month[0].toUpperCase() + month.slice(1).toLowerCase();
    return `${normalizedMonth}-${parseInt(day, 10)}`;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const parsed = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return formatSessionDateKey(parsed);
  }

  const parsedDate = new Date(trimmed);
  if (!Number.isNaN(parsedDate.getTime())) {
    return formatSessionDateKey(parsedDate);
  }

  return null;
};

const findSessionForDate = (sessions: any[], targetDate: Date) => {
  if (!sessions || sessions.length === 0) return null;
  const targetDateString = formatSessionDateKey(targetDate);
  return sessions.find((session) => normalizeSessionDateKey(session?.date) === targetDateString) || null;
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

const WorkoutCard = ({
  card,
  programId,
  onFinish,
}: {
  card: any;
  programId: number | string | null;
  onFinish: (date: string) => void;
}) => {
  const sessionId = card.sessionData?.id;
  const dayNumber = card.sessionData?.dayNumber;
  const { data } = useGymData(programId, dayNumber, sessionId);
  const gymData = data?.gymData ?? [];
  const finishDate = card.date ? card.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  return (
    <LinearGradient
      colors={theme.gradients.webPurple.colors}
      start={theme.gradients.webPurple.start}
      end={theme.gradients.webPurple.end}
      style={[styles.workoutCard, card.isToday && styles.workoutCardToday]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <Text variant="small" weight="medium" color="primary-foreground">
            {card.dayOfWeek}
          </Text>
          {card.isToday && (
            <View style={styles.todayBadge}>
              <Text variant="small" weight="semiBold" color="foreground">
                Today
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cardHeaderRight}>
          <TouchableOpacity style={styles.finishButton} onPress={() => onFinish(finishDate)}>
            <Text variant="small" color="primary-foreground">
              Finish
            </Text>
          </TouchableOpacity>
          <Text variant="small" color="primary-foreground" style={styles.dateText}>
            {card.dateString}
          </Text>
        </View>
      </View>

      <WorkoutCardContent sessionData={card.sessionData} gymData={gymData} />
    </LinearGradient>
  );
};

const WorkoutCardContent = ({ sessionData, gymData }: { sessionData: any; gymData: string[] }) => {
  if (!sessionData) {
    return (
      <View style={styles.restDay}>
        <Text variant="small" weight="medium" color="primary-foreground">
          Rest Day
        </Text>
        <Text variant="caption" color="primary-foreground" style={styles.restDayText}>
          Take time to recover and prepare for your next training session.
        </Text>
      </View>
    );
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

  const sections = [
    { label: 'Pre-Activation', value: sessionData.preActivation1 },
    { label: '60m/100m Sprint', value: sessionData.shortDistanceWorkout },
    { label: '200m Sprint', value: sessionData.mediumDistanceWorkout },
    { label: '400m Sprint', value: sessionData.longDistanceWorkout },
    { label: 'Extra Session', value: sessionData.extraSession },
  ];

  return (
    <View style={styles.cardSections}>
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
          {gymData.map((exercise, index) => (
            <Text key={`${exercise}-${index}`} variant="small" color="primary-foreground" style={styles.sectionText}>
              {exercise}
            </Text>
          ))}
        </View>
      )}
      {sections.map((section) =>
        !hasGymData && section.value ? (
          <View key={section.label} style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                {section.label === 'Pre-Activation'
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
  loadMoreContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
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
    ...theme.shadows.md,
  },
  workoutCardToday: {
    borderWidth: 2,
    borderColor: '#facc15',
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
    backgroundColor: '#facc15',
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
