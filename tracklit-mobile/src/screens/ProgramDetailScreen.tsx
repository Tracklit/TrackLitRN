import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { Text } from '../components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import theme from '../utils/theme';

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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ProgramDetailRouteProp>();
  const { user } = useAuth();
  const programId = route.params?.id;

  // Fetch program details
  const programQuery = useQuery({
    queryKey: ['program', programId],
    queryFn: () => apiRequest<ProgramDetail>(`/api/programs/${programId}`),
    enabled: !!programId,
  });

  const program = programQuery.data;

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
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.loadingContainer}>
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
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
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
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
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
        <View style={{ height: theme.layout.bottomNavHeight + insets.bottom + theme.spacing.xl }} />
      </ScrollView>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorText: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  overviewCard: {
    marginBottom: theme.spacing.xl,
  },
  overviewHeader: {
    marginBottom: theme.spacing.md,
  },
  overviewTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  programTitle: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  coachName: {
    marginTop: theme.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statText: {
    marginLeft: theme.spacing.xs,
  },
  description: {
    lineHeight: 22,
    marginTop: theme.spacing.md,
  },
  eventsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  sessionsTitle: {
    marginBottom: theme.spacing.md,
  },
  emptyCard: {
    marginBottom: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  weekContainer: {
    marginBottom: theme.spacing.lg,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  weekBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  weekLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md,
  },
  sessionCard: {
    marginBottom: theme.spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  dayBadge: {
    backgroundColor: theme.colors.muted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  sessionTitle: {
    flex: 1,
  },
  workoutTypeBadge: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  sessionDescription: {
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  exercisesContainer: {
    marginTop: theme.spacing.sm,
  },
  exercisesLabel: {
    marginBottom: theme.spacing.xs,
  },
  exercisesText: {
    lineHeight: 20,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  durationText: {
    marginLeft: theme.spacing.xs,
  },
});

