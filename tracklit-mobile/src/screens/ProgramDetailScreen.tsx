import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { UsersThree, Play } from 'phosphor-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Text } from '../components/ui/Text';
import { SkeletonBlock } from '@/components/Skeleton';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AssignAthletesModal } from '@/components/programs/AssignAthletesModal';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import themeStatic from '../utils/theme';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
type ProgramDetailRouteProp = RouteProp<RootStackParamList, 'ProgramDetail'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface ProgramSession {
  id: number;
  programId: number;
  title: string;
  description?: string;
  weekNumber?: number;
  dayNumber?: number;
  duration?: number;
  workoutType?: string;
  exercises?: string;
}

interface ProgramDetail {
  id: number;
  title: string;
  description?: string;
  userId: number;
  coachId?: number;
  coachName?: string;
  durationWeeks?: number;
  level?: string;
  category?: string;
  events?: string[];
  isPublic?: boolean;
  price?: number;
  sessions?: ProgramSession[];
  createdAt: string;
}

export const ProgramDetailScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ProgramDetailRouteProp>();
  const programId = route.params?.id;
  const { user, setUserAndPersist } = useAuth();
  const queryClient = useQueryClient();
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Fetch program details
  const programQuery = useQuery({
    queryKey: ['program', programId],
    queryFn: () => apiRequest<ProgramDetail>(`/api/programs/${programId}`),
    enabled: !!programId,
  });

  const program = programQuery.data;
  const isOwner = !!program && !!user?.id && program.userId === user.id;

  // Self-assign: adopt a program that isn't yours so it shows up in your Practice tab.
  // On success, set it as the active program and navigate to the Training tab so the user
  // lands directly on what they just started. Handles the idempotent "already started"
  // backend response as a soft success.
  const startProgramMutation = useMutation({
    mutationFn: async (pid: number) => {
      return apiRequest<{ id: number; programId: number; status: string }>(
        `/api/programs/${pid}/self-assign`,
        { method: 'POST', data: {} },
      );
    },
    onSuccess: async (assignment) => {
      // Make the newly-started program the active one.
      if (assignment && typeof assignment === 'object' && typeof assignment.id === 'number') {
        try {
          const updated = await apiRequest<any>('/api/user', {
            method: 'PATCH',
            data: { activeProgramSelection: `assigned-${assignment.id}` },
          });
          if (updated && typeof updated === 'object') {
            await setUserAndPersist(updated);
          }
        } catch (err) {
          // Non-critical; the user can pick it in the Practice picker instead.
          if (__DEV__) console.log('[start-program] active PATCH failed', err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['my-programs'] });
      queryClient.invalidateQueries({ queryKey: ['my-programs-home'] });
      queryClient.invalidateQueries({ queryKey: ['today-session'] });
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      Alert.alert(
        'Program Started',
        `"${program?.title || 'Program'}" is now in your Practice tab.`,
        [
          {
            text: 'Open Practice',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Training' } as never),
          },
        ],
      );
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to start program';
      // The backend returns 400 "You've already started this program" if a self-assignment
      // already exists for this (program, user) pair. Treat that as a soft success.
      if (msg === "You've already started this program") {
        Alert.alert(
          'Already in your Practice',
          `"${program?.title || 'This program'}" is already in your Practice tab.`,
          [
            {
              text: 'Open Practice',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Training' } as never),
            },
            { text: 'OK', style: 'cancel' },
          ],
        );
        return;
      }
      Alert.alert('Could not start program', msg);
    },
  });

  const handleStartProgram = () => {
    if (!program) return;
    startProgramMutation.mutate(program.id);
  };

  const getLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'destructive';
      default: return 'default';
    }
  };

  const formatDuration = (weeks?: number) => {
    if (!weeks) return 'Flexible duration';
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  };

  // Group sessions by week
  const sessionsByWeek = React.useMemo(() => {
    if (!program?.sessions) return {};
    
    const grouped: { [key: number]: ProgramSession[] } = {};
    program.sessions.forEach(session => {
      const week = session.weekNumber || 1;
      if (!grouped[week]) {
        grouped[week] = [];
      }
      grouped[week].push(session);
    });
    
    // Sort sessions within each week by day number
    Object.keys(grouped).forEach(week => {
      grouped[parseInt(week)].sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
    });
    
    return grouped;
  }, [program?.sessions]);

  const weekNumbers = Object.keys(sessionsByWeek).map(Number).sort((a, b) => a - b);

  if (programQuery.isLoading) {
    return (
      <LinearGradient
        colors={theme.gradient.background}
        locations={theme.gradient.locations}
        style={styles.container}
      >
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <SkeletonBlock />
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
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={20} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={48} color={theme.colors.textMuted} />
          <Text variant="body" color="muted" style={styles.errorText}>
            Unable to load program. Please try again.
          </Text>
          <Button variant="outline" onPress={() => programQuery.refetch()}>
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={20} color={theme.colors.foreground} />
        </TouchableOpacity>
        <Text variant="h4" weight="bold" color="foreground" style={styles.headerTitle} numberOfLines={1}>
          {program.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={programQuery.isFetching}
            onRefresh={() => programQuery.refetch()}
          />
        }
      >
        {/* Program Overview Card */}
        <Card style={styles.overviewCard}>
          <CardContent>
            <View style={styles.overviewHeader}>
              <View style={styles.overviewTitleRow}>
                <Text variant="h3" weight="bold" color="foreground" style={styles.programTitle}>
                  {program.title}
                </Text>
                <Badge variant={getLevelColor(program.level)} size="sm">
                  {program.level || 'All Levels'}
                </Badge>
              </View>
              
              {program.coachName && (
                <Text variant="body" color="muted" style={styles.coachName}>
                  by {program.coachName}
                </Text>
              )}
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <FontAwesome5 name="calendar" size={16} color={theme.colors.primary} solid />
                <Text variant="small" color="muted" style={styles.statText}>
                  {formatDuration(program.durationWeeks)}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <FontAwesome5 name="list" size={16} color={theme.colors.primary} solid />
                <Text variant="small" color="muted" style={styles.statText}>
                  {program.sessions?.length || 0} sessions
                </Text>
              </View>
              
              {program.category && (
                <View style={styles.statItem}>
                  <FontAwesome5 name="tag" size={16} color={theme.colors.primary} solid />
                  <Text variant="small" color="muted" style={styles.statText}>
                    {program.category}
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            {program.description && (
              <Text variant="body" color="muted" style={styles.description}>
                {program.description}
              </Text>
            )}

            {/* Events */}
            {program.events && program.events.length > 0 && (
              <View style={styles.eventsContainer}>
                {program.events.map((event, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {event}
                  </Badge>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        {isOwner ? (
          <View style={styles.actionRow}>
            <Button
              variant="default"
              size="lg"
              onPress={() => navigation.navigate('ProgramEditor', { id: program.id })}
              style={styles.actionButton}
            >
              Edit Program
            </Button>
            {user?.isCoach === true && (
              <Button
                variant="outline"
                size="lg"
                onPress={() => setShowAssignModal(true)}
                style={styles.actionButton}
              >
                {/* Button has no leftIcon prop, so compose icon + text as children */}
                <View style={styles.actionButtonContent}>
                  <UsersThree size={18} color={theme.colors.brandOrange} weight="fill" />
                  <Text variant="body" weight="medium" color="primary">
                    Assign to Athletes
                  </Text>
                </View>
              </Button>
            )}
          </View>
        ) : (
          <View style={styles.actionRow}>
            <Button
              variant="default"
              size="lg"
              onPress={handleStartProgram}
              disabled={startProgramMutation.isPending}
              style={styles.actionButton}
            >
              {/* Button has no leftIcon prop, so compose icon + text as children */}
              <View style={styles.actionButtonContent}>
                <Play size={18} color="#fff" weight="fill" />
                <Text variant="body" weight="medium" color="primary-foreground">
                  {startProgramMutation.isPending ? 'Starting…' : 'Start Program'}
                </Text>
              </View>
            </Button>
          </View>
        )}

        {/* Sessions by Week */}
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.sessionsTitle}>
          Training Schedule
        </Text>

        {weekNumbers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent>
              <View style={styles.emptyState}>
                <FontAwesome5 name="clipboard-list" size={32} color={theme.colors.textMuted} />
                <Text variant="body" color="muted" style={styles.emptyText}>
                  No sessions have been added to this program yet.
                </Text>
              </View>
            </CardContent>
          </Card>
        ) : (
          weekNumbers.map(weekNum => (
            <View key={weekNum} style={styles.weekContainer}>
              <View style={styles.weekHeader}>
                <View style={styles.weekBadge}>
                  <Text variant="small" weight="bold" color="primary">
                    Week {weekNum}
                  </Text>
                </View>
                <View style={styles.weekLine} />
              </View>

              {sessionsByWeek[weekNum].map((session) => (
                <Card key={session.id} style={styles.sessionCard}>
                  <CardContent>
                    <View style={styles.sessionHeader}>
                      <View style={styles.dayBadge}>
                        <Text variant="small" weight="semiBold" color="foreground">
                          Day {session.dayNumber || '?'}
                        </Text>
                      </View>
                      <Text variant="body" weight="semiBold" color="foreground" style={styles.sessionTitle}>
                        {session.title}
                      </Text>
                    </View>

                    {session.workoutType && (
                      <Badge variant="outline" size="sm" style={styles.workoutTypeBadge}>
                        {session.workoutType}
                      </Badge>
                    )}

                    {session.description && (
                      <Text variant="small" color="muted" style={styles.sessionDescription}>
                        {session.description}
                      </Text>
                    )}

                    {session.exercises && (
                      <View style={styles.exercisesContainer}>
                        <Text variant="small" color="muted" style={styles.exercisesLabel}>
                          Exercises:
                        </Text>
                        <Text variant="small" color="foreground" style={styles.exercisesText}>
                          {session.exercises}
                        </Text>
                      </View>
                    )}

                    {session.duration && (
                      <View style={styles.durationRow}>
                        <FontAwesome5 name="clock" size={12} color={theme.colors.textMuted} />
                        <Text variant="small" color="muted" style={styles.durationText}>
                          {session.duration} min
                        </Text>
                      </View>
                    )}
                  </CardContent>
                </Card>
              ))}
            </View>
          ))
        )}

        {/* Spacer for bottom nav */}
        <View style={{ height: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true, extra: 0 }) }} />
      </ScrollView>

      <AssignAthletesModal
        visible={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        program={program ? { id: program.id, title: program.title } : null}
      />
    </LinearGradient>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: themeStatic.spacing.lg,
    paddingVertical: themeStatic.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: themeStatic.spacing.md,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: themeStatic.spacing.lg,
    paddingTop: themeStatic.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: themeStatic.spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: themeStatic.spacing.xl,
  },
  errorText: {
    marginTop: themeStatic.spacing.md,
    marginBottom: themeStatic.spacing.lg,
    textAlign: 'center',
  },
  overviewCard: {
    marginBottom: themeStatic.spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: themeStatic.spacing.md,
    marginBottom: themeStatic.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeStatic.spacing.sm,
  },
  overviewHeader: {
    marginBottom: themeStatic.spacing.md,
  },
  overviewTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: themeStatic.spacing.xs,
  },
  programTitle: {
    flex: 1,
    marginRight: themeStatic.spacing.md,
  },
  coachName: {
    marginTop: themeStatic.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeStatic.spacing.lg,
    marginBottom: themeStatic.spacing.md,
    paddingTop: themeStatic.spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeStatic.spacing.sm,
  },
  statText: {
    marginLeft: themeStatic.spacing.xs,
  },
  description: {
    lineHeight: 22,
    marginTop: themeStatic.spacing.md,
  },
  eventsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeStatic.spacing.sm,
    marginTop: themeStatic.spacing.md,
  },
  sessionsTitle: {
    marginBottom: themeStatic.spacing.md,
  },
  emptyCard: {
    marginBottom: themeStatic.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: themeStatic.spacing.xl,
  },
  emptyText: {
    marginTop: themeStatic.spacing.md,
    textAlign: 'center',
  },
  weekContainer: {
    marginBottom: themeStatic.spacing.lg,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: themeStatic.spacing.md,
  },
  weekBadge: {
    backgroundColor: t.colors.primary + '20',
    paddingHorizontal: themeStatic.spacing.md,
    paddingVertical: themeStatic.spacing.xs,
    borderRadius: themeStatic.borderRadius.md,
  },
  weekLine: {
    flex: 1,
    height: 1,
    backgroundColor: t.colors.border,
    marginLeft: themeStatic.spacing.md,
  },
  sessionCard: {
    marginBottom: themeStatic.spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: themeStatic.spacing.sm,
  },
  dayBadge: {
    backgroundColor: t.colors.muted,
    paddingHorizontal: themeStatic.spacing.sm,
    paddingVertical: themeStatic.spacing.xs,
    borderRadius: themeStatic.borderRadius.sm,
    marginRight: themeStatic.spacing.sm,
  },
  sessionTitle: {
    flex: 1,
  },
  workoutTypeBadge: {
    alignSelf: 'flex-start',
    marginBottom: themeStatic.spacing.sm,
  },
  sessionDescription: {
    lineHeight: 20,
    marginBottom: themeStatic.spacing.sm,
  },
  exercisesContainer: {
    marginTop: themeStatic.spacing.sm,
  },
  exercisesLabel: {
    marginBottom: themeStatic.spacing.xs,
  },
  exercisesText: {
    lineHeight: 20,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: themeStatic.spacing.sm,
    gap: themeStatic.spacing.xs,
  },
  durationText: {
    marginLeft: themeStatic.spacing.xs,
  },
});

