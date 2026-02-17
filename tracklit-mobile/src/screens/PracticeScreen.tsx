import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
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
import { ProgramPickerModal } from '@/components/practice/ProgramPickerModal';
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

  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [showTargetTimes, setShowTargetTimes] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<PurchasedProgramItem | null>(null);
  const [daysToShow, setDaysToShow] = useState(7);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [workoutCards, setWorkoutCards] = useState<any[]>([]);

  const purchasedProgramsQuery = useQuery({
    queryKey: ['purchased-programs'],
    queryFn: () => apiRequest<PurchasedProgramItem[]>('/api/purchased-programs'),
    enabled: isAuthenticated && !isGuest,
  });

  const programs = purchasedProgramsQuery.data ?? [];
  const programIdsKey = useMemo(
    () => programs.map((assignment) => String(assignment.id)).join('|'),
    [programs]
  );

  const selectedProgramId = selectedProgram?.programId ?? null;
  const { programSessions, isLoading: isLoadingProgramSessions } = useProgramSessions(selectedProgramId);

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
  }, [programIdsKey, programs]);

  useEffect(() => {
    if (!programSessions || programSessions.length === 0) {
      setIsLoadingCards(false);
      setWorkoutCards((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    setIsLoadingCards(true);
    const today = new Date();
    const cards: any[] = [];

    for (let i = 0; i < daysToShow; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const sessionForDate = findSessionForDate(programSessions, date);

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
  }, [programSessions, daysToShow]);

  const handleSelectProgram = async (assignment: PurchasedProgramItem) => {
    setSelectedProgram(assignment);
    setDaysToShow(7);
    setWorkoutCards([]);
    setIsLoadingCards(true);
    await AsyncStorage.setItem(PROGRAM_SELECTION_KEY, String(assignment.id));
    await queryClient.invalidateQueries({
      queryKey: ['/api/programs', assignment.programId, 'sessions'],
    });
    setShowProgramPicker(false);
  };

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
          <Button
            variant="outline"
            onPress={() => setShowProgramPicker(true)}
            style={styles.programsButton}
          >
            <View style={styles.programsButtonContent}>
              <ClipboardText size={14} color={theme.colors.primaryForeground} weight="fill" />
              <Text variant="small" weight="medium" color="primary-foreground">
                Your Programs
              </Text>
            </View>
          </Button>
        </View>

        {selectedProgram ? (
          <View style={styles.contentContainer}>
            {selectedProgram.program?.isTextBased && selectedProgram.program?.textContent ? (
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
            ) : selectedProgram.program?.isUploadedProgram && selectedProgram.program?.programFileUrl ? (
              <Card style={styles.textProgramCard}>
                <CardContent>
                  <View style={styles.programHeaderRow}>
                    <Upload size={16} color={theme.colors.primary} weight="fill" />
                    <Text variant="small" weight="semiBold" color="foreground">
                      Program Document
                    </Text>
                  </View>
                  <View style={styles.programNote}>
                    <Text variant="small" color="muted">
                      Open the document on web to view the full program.
                    </Text>
                  </View>
                </CardContent>
              </Card>
            ) : (
              <View style={styles.cardsList}>
                {isLoadingCards || isLoadingProgramSessions ? (
                  <View style={styles.loadingState}>
                    <Text variant="body" color="muted">
                      Loading sessions...
                    </Text>
                  </View>
                ) : workoutCards.length > 0 ? (
                  <>
                    {workoutCards.map((card) => (
                      <WorkoutCard
                        key={card.id}
                        card={card}
                        programId={selectedProgramId}
                        onFinish={(date: string) => navigation.navigate('JournalEntry', { date })}
                      />
                    ))}
                    {selectedProgram.program?.importedFromSheet && (
                      <View style={styles.loadMoreContainer}>
                        <Button variant="default" onPress={() => setDaysToShow((prev) => prev + 7)}>
                          Load More Days
                        </Button>
                      </View>
                    )}
                  </>
                ) : (
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
                )}
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
            <Button variant="outline" onPress={() => setShowProgramPicker(true)} style={styles.emptyButton}>
              <Text variant="small" weight="medium" color="primary-foreground">
                View Available Programs
              </Text>
            </Button>
          </LinearGradient>
        )}
      </ScrollView>

      <ProgramPickerModal
        visible={showProgramPicker}
        onClose={() => setShowProgramPicker(false)}
        programs={purchasedProgramsQuery.data ?? []}
        selectedProgramId={selectedProgram?.id ?? null}
        onSelect={handleSelectProgram}
        isLoading={purchasedProgramsQuery.isLoading}
      />

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
  },
  programsButton: {
    alignSelf: 'flex-start',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  programsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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
