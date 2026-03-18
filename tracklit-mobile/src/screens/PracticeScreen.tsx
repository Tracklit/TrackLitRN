import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Animated,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
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
  CaretDown,
  Link,
  XCircle,
} from 'phosphor-react-native';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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
import { MainScreenHeader } from '@/components/MainScreenHeader';
import { getScreenContentBottomPadding, getBottomNavOverlayHeight } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import { useProgramSessions } from '@/hooks/use-program-sessions';
import { TargetTimesDrawer } from '@/components/practice/TargetTimesDrawer';
import { SkeletonSessionList } from '@/components/Skeleton';
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


interface PracticeScreenProps {
  hideHeader?: boolean;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ hideHeader = false }) => {
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

    const sessionsByDay: Record<number, any> = {};
    const sessionsByDateKey: Record<string, any> = {};
    const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    sessionsToUse.forEach((session: any) => {
      if (session.dayNumber != null) {
        sessionsByDay[session.dayNumber] = session;
      }
      const parsed = parseSessionDateForCard(session.date);
      if (parsed) {
        const key = `${MONTH_ABBR[parsed.getMonth()]}-${parsed.getDate()}`;
        sessionsByDateKey[key] = session;
      }
    });

    let programStartDate: Date | null = null;
    const datesFromSessions = sessionsToUse
      .map((s: any) => parseSessionDateForCard(s.date))
      .filter(Boolean) as Date[];
    if (datesFromSessions.length > 0) {
      datesFromSessions.sort((a, b) => a.getTime() - b.getTime());
      programStartDate = datesFromSessions[0];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const FORWARD_DAYS = 60;
    const totalDays = Math.max(programDuration, 1);

    const cards: any[] = [];
    for (let offset = 0; offset < FORWARD_DAYS; offset++) {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + offset);

      let dayNum: number | null = null;
      if (programStartDate) {
        const diff = Math.round((dayDate.getTime() - programStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (diff >= 1 && diff <= totalDays) {
          dayNum = diff;
        }
      }

      const dateKey = `${MONTH_ABBR[dayDate.getMonth()]}-${dayDate.getDate()}`;
      const session = sessionsByDateKey[dateKey] ?? (dayNum != null ? sessionsByDay[dayNum] || null : null);

      const dateString = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
      const dayStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
      const isToday = dayStr === todayStr;

      if (session && dayNum == null) {
        dayNum = session.dayNumber ?? null;
      }

      cards.push({
        id: `cal-${offset}`,
        dayNumber: dayNum,
        date: dayDate,
        dateString,
        dayOfWeek,
        sessionData: session,
        isToday,
        index: offset,
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

  const unassignProgramMutation = useMutation({
    mutationFn: async (purchaseId: number | string) => {
      await apiRequest(`/api/purchased-programs/${purchaseId}`, { method: 'DELETE' });
    },
    onSuccess: async () => {
      await AsyncStorage.removeItem(PROGRAM_SELECTION_KEY);
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs-home'] });
      queryClient.invalidateQueries({ queryKey: ['today-session'] });
    },
  });

  const handleUnassignProgram = () => {
    if (!selectedProgram) return;
    const title = selectedProgram.program?.title || 'this program';
    Alert.alert(
      'Unassign Program',
      `Remove "${title}" from your practice?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            unassignProgramMutation.mutate(selectedProgram.id, {
              onError: (err: any) => Alert.alert('Error', err?.message || 'Failed to remove program.'),
            });
          },
        },
      ]
    );
  };

  const EXPANDED_H = 92;
  const COLLAPSED_H = 50;
  const COLLAPSE_RANGE = 50;

  const scrollY = useRef(new Animated.Value(0)).current;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownAnimH = useRef(new Animated.Value(0)).current;

  const sortedPrograms = useMemo(() => {
    return [...programs].sort((a, b) =>
      (a.program?.title || '').toLowerCase().localeCompare((b.program?.title || '').toLowerCase())
    );
  }, [programs]);

  useEffect(() => {
    Animated.timing(dropdownAnimH, {
      toValue: dropdownOpen ? Math.min(sortedPrograms.length * 64 + 16, 280) : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [dropdownOpen, sortedPrograms.length]);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [EXPANDED_H, COLLAPSED_H],
    extrapolate: 'clamp',
  });

  const expandedOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE * 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const selectedTitle = selectedProgram?.program?.title ?? null;

  return (
      <LinearGradient
        colors={theme.gradient.background}
        locations={theme.gradient.locations}
        style={styles.container}
      >
        {!hideHeader && <MainScreenHeader />}

        {/* Sticky collapsible program header */}
        <View style={styles.stickyHeaderWrap}>
          <Animated.View style={[styles.stickyHeader, { height: headerHeight }]}>
            {/* Expanded-only label row */}
            <Animated.View style={[styles.expandedRow, { opacity: expandedOpacity }]} pointerEvents="none">
              <Text style={styles.activeProgramLabel}>ACTIVE PROGRAM</Text>
              {selectedTitle && <Text style={styles.tapToChange}>Tap to change</Text>}
            </Animated.View>

            {/* Button row — always visible */}
            <View style={styles.programTriggerRow}>
              <TouchableOpacity
                style={[styles.programTrigger, { flex: 1 }]}
                onPress={() => setDropdownOpen((o) => !o)}
                activeOpacity={0.75}
              >
                <View style={[styles.programTriggerIcon, selectedTitle && styles.programTriggerIconActive]}>
                  <Link size={14} color={selectedTitle ? '#FF7A00' : 'rgba(255,255,255,0.45)'} weight="fill" />
                </View>
                <Text style={styles.programTriggerName} numberOfLines={1}>
                  {selectedTitle ?? 'Select a program…'}
                </Text>
                <CaretDown
                  size={13}
                  color="rgba(255,255,255,0.45)"
                  weight="fill"
                  style={{ transform: [{ rotate: dropdownOpen ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              {selectedProgram && (
                <TouchableOpacity
                  style={styles.unassignBtn}
                  onPress={handleUnassignProgram}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <XCircle size={20} color="rgba(255,255,255,0.4)" weight="fill" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Inline dropdown panel */}
          <Animated.View style={[styles.dropdownPanel, { maxHeight: dropdownAnimH }]}>
            <ScrollView
              style={styles.dropdownScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {purchasedProgramsQuery.isLoading ? (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>Loading programs…</Text>
                </View>
              ) : sortedPrograms.length > 0 ? (
                sortedPrograms.map((assignment, idx) => {
                  const isSelected = String(selectedProgram?.id) === String(assignment.id);
                  return (
                    <TouchableOpacity
                      key={`${assignment.id}-${idx}`}
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                      onPress={() => { handleSelectProgram(assignment); setDropdownOpen(false); }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.dropdownItemIcon, isSelected && styles.dropdownItemIconSelected]}>
                        <ClipboardText size={13} color={isSelected ? '#FF7A00' : 'rgba(255,255,255,0.6)'} weight="fill" />
                      </View>
                      <View style={styles.dropdownItemText}>
                        <Text style={styles.dropdownItemTitle} numberOfLines={1}>{assignment.program?.title ?? 'Unnamed'}</Text>
                        <Text style={styles.dropdownItemSub} numberOfLines={1}>
                          {assignment.program?.category ?? 'Training Program'}
                        </Text>
                      </View>
                      {isSelected && <CheckCircle size={16} color="#FF7A00" weight="fill" />}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>No programs available</Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: contentBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshControl={
            <RefreshControl
              tintColor="#fff"
              refreshing={isRefreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <InlineRefreshHeader visible={isRefreshing} />

          {selectedProgram ? (
            <View style={styles.contentContainer}>
              {selectedProgram.program?.isTextBased && selectedProgram.program?.textContent ? (
                <View style={styles.textProgramFullContainer}>
                  <View style={styles.textProgramHeader}>
                    <ClipboardText size={18} color="#FF7A00" weight="fill" />
                    <Text variant="body" weight="bold" color="foreground">
                      {selectedProgram.program?.title || 'Program Content'}
                    </Text>
                  </View>
                  <ScrollView style={styles.textProgramScrollArea} showsVerticalScrollIndicator={true}>
                    <Text variant="small" color="foreground" style={styles.monoText}>
                      {selectedProgram.program.textContent}
                    </Text>
                  </ScrollView>
                </View>
              ) : selectedProgram.program?.isUploadedProgram && selectedProgram.program?.programFileUrl ? (
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
                        <Text variant="small" weight="semiBold" color="foreground" numberOfLines={1}>
                          {selectedProgram.program?.title || 'Assigned Program'}
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
              ) : (
                <>
              {(isLoadingCards || isLoadingProgramSessions) && (
                <View style={styles.cardsList}>
                  <SkeletonSessionList count={4} />
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

              {!isLoadingCards && !isLoadingProgramSessions && programSessions.length === 0 && (
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
                </>
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
                No program assigned
              </Text>
              <Text variant="caption" color="primary-foreground" style={styles.emptyText}>
                Assign a Program or Create a Program to start tracking your training.
              </Text>
              <Button variant="outline" onPress={() => navigation.navigate('ProgramCreate')} style={styles.emptyButton}>
                <Text variant="small" weight="medium" color="primary-foreground">
                  Create a Program
                </Text>
              </Button>
            </LinearGradient>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.targetTimesButton, { top: '65%' }]}
          onPress={() => setShowTargetTimes(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#FF7A00', '#FF9A3C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.targetTimesButtonInner}
          >
            <Timer size={16} color="white" weight="fill" />
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

  const headerLabel = card.dayOfWeek || '';

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

  const isDayXPattern = (str?: string | null) =>
    !!str && /^Day\s*\d*\s*(Training|Session)?\s*$/i.test(str.trim());

  const sessionTitle =
    sessionData.title &&
    !isDayXPattern(sessionData.title) &&
    sessionData.title !== 'Training Session' &&
    sessionData.title !== 'Rest Day'
      ? sessionData.title
      : null;

  const hasNoWorkoutFields =
    !sessionData.preActivation1 &&
    !sessionData.preActivation2 &&
    !sessionData.shortDistanceWorkout &&
    !sessionData.mediumDistanceWorkout &&
    !sessionData.longDistanceWorkout &&
    !sessionData.extraSession;

  const isSimple =
    sessionData.isSimpleTemplate ||
    !!sessionData.sessionText ||
    (hasNoWorkoutFields && !!sessionData.description && !isDayXPattern(sessionData.description));

  const simpleText = sessionData.sessionText || (isSimple ? sessionData.description : null);

  const sessionDescription =
    !isSimple &&
    sessionData.description &&
    !isDayXPattern(sessionData.description) &&
    sessionData.description !== 'Training Session'
      ? sessionData.description
      : null;

  const contentSections = isSimple
    ? [{ label: 'Session', value: simpleText }]
    : [
        { label: 'PA1', value: sessionData.preActivation1 },
        { label: 'PA2', value: sessionData.preActivation2 },
        { label: '60/100', value: sessionData.shortDistanceWorkout },
        { label: '200', value: sessionData.mediumDistanceWorkout },
        { label: '400', value: sessionData.longDistanceWorkout },
        { label: 'Extra', value: sessionData.extraSession },
      ];

  const hasAnyContent =
    hasGymData ||
    contentSections.some((s) => !!s.value) ||
    sessionTitle ||
    sessionDescription ||
    sessionData.notes;

  return (
    <View style={styles.cardSections}>
      {sessionTitle && (
        <Text variant="body" weight="bold" color="primary-foreground" style={{ marginBottom: 6 }}>
          {sessionTitle}
        </Text>
      )}
      {sessionDescription && (
        <Text variant="small" color="primary-foreground" style={styles.sessionDescription}>
          {sessionDescription}
        </Text>
      )}
      <View style={styles.solidBlock}>
        {hasGymData && (
          <View style={styles.solidBlockRow}>
            <Text style={styles.solidBlockLabel}>{gymNumber ? `Gym ${gymNumber}` : 'Gym'}</Text>
            <Text style={styles.solidBlockValue}>{gymData.join(', ')}</Text>
          </View>
        )}
        {contentSections.map((section) =>
          section.value ? (
            <View key={section.label} style={styles.solidBlockRow}>
              <Text style={styles.solidBlockLabel}>{section.label}</Text>
              <Text style={styles.solidBlockValue}>
                {String(section.value).replace(/^"|"$/g, '')}
              </Text>
            </View>
          ) : null
        )}
        {sessionData.notes && (
          <View style={styles.solidBlockRow}>
            <Text style={styles.solidBlockLabel}>Notes</Text>
            <Text style={styles.solidBlockValue}>{sessionData.notes}</Text>
          </View>
        )}
      </View>
      {!hasAnyContent && (
        <View style={styles.sessionPlaceholder}>
          <Text variant="small" weight="medium" color="primary-foreground">
            Scheduled Session
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
  stickyHeaderWrap: {
    zIndex: 30,
    backgroundColor: '#0E0F14',
  },
  stickyHeader: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activeProgramLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tapToChange: {
    fontSize: 10,
    color: 'rgba(255,122,0,0.55)',
    fontWeight: '500',
  },
  programTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unassignBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  programTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  programTriggerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programTriggerIconActive: {
    backgroundColor: 'rgba(255,122,0,0.12)',
  },
  programTriggerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dropdownPanel: {
    overflow: 'hidden',
    backgroundColor: '#13151E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  dropdownScroll: {
    paddingVertical: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 0,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(255,122,0,0.08)',
  },
  dropdownItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemIconSelected: {
    backgroundColor: 'rgba(255,122,0,0.18)',
  },
  dropdownItemText: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  dropdownEmpty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
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
  textProgramFullContainer: {
    flex: 1,
    backgroundColor: '#1C1F2B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  textProgramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  textProgramScrollArea: {
    flex: 1,
    padding: 16,
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
    lineHeight: 20,
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
    gap: 4,
  },
  solidBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  solidBlockRow: {
    flexDirection: 'row',
    gap: 8,
  },
  solidBlockLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    width: 50,
    flexShrink: 0,
    paddingTop: 1,
  },
  solidBlockValue: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    flex: 1,
  },
  sessionDescription: {
    opacity: 0.85,
    marginBottom: 4,
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
    right: 0,
    width: 43,
    height: 64,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    zIndex: 200,
    elevation: 20,
    shadowColor: '#FF7A00',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: -2, height: 0 },
  },
  targetTimesButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
});
