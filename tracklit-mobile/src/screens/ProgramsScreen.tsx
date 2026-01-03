import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { Text } from '../components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getBottomNavOverlayHeight, getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '../utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface Program {
  id: number | string;
  title: string;
  description?: string;
  coachName?: string;
  coachId?: number;
  duration?: string;
  durationWeeks?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  difficulty?: string;
  events?: string[];
  price?: number;
  isPublic?: boolean;
  isPurchased?: boolean;
}

interface PurchasedProgramItem {
  id: number | string;
  programId: number | string;
  program: Program;
  isAssigned?: boolean;
  isCreated?: boolean;
  assignerName?: string;
  creatorName?: string;
}

interface WorkoutLibraryResponse {
  workouts: Array<{
    id: number | string;
    title: string;
    description?: string | null;
    category?: string | null;
    content?: any;
    createdAt?: string;
  }>;
  isLimited?: boolean;
  totalSaved?: number;
  maxFreeAllowed?: number;
}

export const ProgramsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const [activeTab, setActiveTab] = useState<'my-programs' | 'purchased' | 'workout-library'>(
    'my-programs'
  );
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const isGuest = userId === 'guest';
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });

  // Fetch user's programs
  const myProgramsQuery = useQuery({
    queryKey: ['user-programs'],
    queryFn: () => apiRequest<Program[]>('/api/programs'),
    enabled: isAuthenticated && !isGuest,
  });

  // Fetch purchased/assigned programs (web parity: /api/purchased-programs)
  const purchasedProgramsQuery = useQuery({
    queryKey: ['purchased-programs'],
    queryFn: () => apiRequest<PurchasedProgramItem[]>('/api/purchased-programs'),
    enabled: isAuthenticated && !isGuest,
  });

  // Fetch workout library (web parity: /api/workout-library)
  const workoutLibraryQuery = useQuery({
    queryKey: ['workout-library'],
    queryFn: () => apiRequest<WorkoutLibraryResponse>('/api/workout-library'),
    enabled: isAuthenticated && !isGuest,
  });

  const handleRefresh = () => {
    if (activeTab === 'my-programs') {
      myProgramsQuery.refetch();
    } else if (activeTab === 'purchased') {
      purchasedProgramsQuery.refetch();
    } else {
      workoutLibraryQuery.refetch();
    }
  };

  const handleContinueProgram = (program: Program) => {
    navigation.navigate('ProgramDetail', { id: program.id });
  };

  const handleViewDetails = (program: Program) => {
    navigation.navigate('ProgramDetail', { id: program.id });
  };

  const isRefreshing =
    myProgramsQuery.isFetching || purchasedProgramsQuery.isFetching || workoutLibraryQuery.isFetching;

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <ScreenHeader
          title="Programs"
          subtitle="Training programs & marketplace"
          containerStyle={styles.header}
        />

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-programs' && styles.activeTab]}
            onPress={() => setActiveTab('my-programs')}
            data-testid="tab-my-programs"
          >
            <Text 
              variant="body" 
              weight="medium"
              style={[
                styles.tabText,
                activeTab === 'my-programs' && styles.activeTabText
              ]}
            >
              My Programs
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'purchased' && styles.activeTab]}
            onPress={() => setActiveTab('purchased')}
            data-testid="tab-purchased-programs"
          >
            <Text 
              variant="body" 
              weight="medium"
              style={[
                styles.tabText,
                activeTab === 'purchased' && styles.activeTabText
              ]}
            >
              Purchased
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'workout-library' && styles.activeTab]}
            onPress={() => setActiveTab('workout-library')}
            data-testid="tab-workout-library"
          >
            <Text
              variant="body"
              weight="medium"
              style={[
                styles.tabText,
                activeTab === 'workout-library' && styles.activeTabText
              ]}
            >
              Workout Library
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'my-programs' ? (
          <MyProgramsTab
            programs={myProgramsQuery.data ?? []}
            isLoading={myProgramsQuery.isLoading}
            isError={myProgramsQuery.isError}
            isGuest={isGuest}
            onContinue={handleContinueProgram}
            onViewDetails={handleViewDetails}
          />
        ) : activeTab === 'purchased' ? (
          <PurchasedProgramsTab
            purchases={purchasedProgramsQuery.data ?? []}
            isLoading={purchasedProgramsQuery.isLoading}
            isError={purchasedProgramsQuery.isError}
            isGuest={isGuest}
            onContinue={handleContinueProgram}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <WorkoutLibraryTab
            library={workoutLibraryQuery.data}
            isLoading={workoutLibraryQuery.isLoading}
            isError={workoutLibraryQuery.isError}
            isGuest={isGuest}
          />
        )}
      </ScrollView>

      {isAuthenticated && !isGuest && activeTab === 'my-programs' && (
        <TouchableOpacity
          style={[styles.fab, { bottom: getBottomNavOverlayHeight(insets.bottom) + theme.spacing.lg }]}
          onPress={() => navigation.navigate('ProgramCreate')}
          accessibilityRole="button"
          accessibilityLabel="Create program"
        >
          <FontAwesome5 name="plus" size={18} color={theme.colors.primaryForeground} solid />
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

interface MyProgramsTabProps {
  programs: Program[];
  isLoading: boolean;
  isError: boolean;
  isGuest: boolean;
  onContinue: (program: Program) => void;
  onViewDetails: (program: Program) => void;
}

const MyProgramsTab: React.FC<MyProgramsTabProps> = ({ 
  programs, 
  isLoading, 
  isError, 
  isGuest,
  onContinue,
  onViewDetails,
}) => {
  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'destructive';
      default: return 'default';
    }
  };

  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="user-lock" size={48} color={theme.colors.textMuted} solid />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          Sign In Required
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Sign in to view your enrolled training programs.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Loading your programs...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="exclamation-circle" size={48} color={theme.colors.textMuted} solid />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Unable to load programs. Pull to refresh.
        </Text>
      </View>
    );
  }

  if (programs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="clipboard-list" size={48} color={theme.colors.textMuted} solid />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          No Programs Yet
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          You haven't created any training programs yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.programsContainer}>
      {programs.map((program) => (
        <Card key={program.id} style={styles.programCard}>
          <CardHeader style={styles.programHeader}>
            <View style={styles.programTitleRow}>
              <CardTitle style={styles.programTitle}>{program.title}</CardTitle>
              <Badge variant={getLevelColor(program.level || program.difficulty)} size="sm">
                {program.level || program.difficulty || 'All Levels'}
              </Badge>
            </View>
            <Text variant="small" color="muted">
              {program.coachName ? `by ${program.coachName}` : 'TrackLit Program'}
              {program.durationWeeks ? ` • ${program.durationWeeks} weeks` : program.duration ? ` • ${program.duration}` : ''}
            </Text>
          </CardHeader>
          
          <CardContent>
            {program.events && program.events.length > 0 && (
              <View style={styles.eventsContainer}>
                {program.events.map((event, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {event}
                  </Badge>
                ))}
              </View>
            )}
            
            <View style={styles.programActions}>
              <Button 
                variant="default" 
                size="sm" 
                style={styles.actionButton}
                onPress={() => onContinue(program)}
                data-testid={`button-continue-program-${program.id}`}
              >
                Continue Program
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onPress={() => onViewDetails(program)}
                data-testid={`button-view-program-${program.id}`}
              >
                View Details
              </Button>
            </View>
          </CardContent>
        </Card>
      ))}
    </View>
  );
};

interface PurchasedProgramsTabProps {
  purchases: PurchasedProgramItem[];
  isLoading: boolean;
  isError: boolean;
  isGuest: boolean;
  onContinue: (program: Program) => void;
  onViewDetails: (program: Program) => void;
}

const PurchasedProgramsTab: React.FC<PurchasedProgramsTabProps> = ({
  purchases,
  isLoading, 
  isError,
  isGuest,
  onContinue,
  onViewDetails,
}) => {
  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="user-lock" size={48} color={theme.colors.textMuted} solid />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          Sign In Required
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Sign in to view your purchased and assigned programs.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Loading purchased programs...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="exclamation-circle" size={48} color={theme.colors.textMuted} solid />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Unable to load purchased programs. Pull to refresh.
        </Text>
      </View>
    );
  }

  if (purchases.length === 0) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="shopping-bag" size={48} color={theme.colors.textMuted} solid />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          No Purchased Programs
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Purchases and coach assignments will show up here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.programsContainer}>
      {purchases.map((purchase) => (
        <Card key={purchase.id} style={styles.programCard}>
          <CardHeader style={styles.programHeader}>
            <View style={styles.programTitleRow}>
              <CardTitle style={styles.programTitle}>{purchase.program?.title}</CardTitle>
              {purchase.isAssigned ? (
                <Badge variant="secondary" size="sm">Assigned</Badge>
              ) : purchase.isCreated ? (
                <Badge variant="outline" size="sm">Created</Badge>
              ) : (
                <Badge variant="default" size="sm">Purchased</Badge>
              )}
            </View>
            <Text variant="small" color="muted">
              {purchase.isAssigned && purchase.assignerName ? `Coach: ${purchase.assignerName}` : 'TrackLit'}
            </Text>
          </CardHeader>
          
          <CardContent>
            {purchase.program?.price !== undefined && (purchase.program?.price ?? 0) > 0 && (
              <View style={styles.priceRow}>
                <Text variant="h3" weight="bold" color="primary">
                  ${purchase.program?.price}
                </Text>
                <Text variant="small" color="muted">
                  one-time payment
                </Text>
              </View>
            )}
            
            <View style={styles.programActions}>
              <Button 
                variant="default" 
                size="sm" 
                style={styles.actionButton}
                onPress={() => onContinue(purchase.program)}
                data-testid={`button-continue-purchased-program-${purchase.programId}`}
              >
                Continue
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onPress={() => onViewDetails(purchase.program)}
                data-testid={`button-view-purchased-program-${purchase.programId}`}
              >
                View Details
              </Button>
            </View>
          </CardContent>
        </Card>
      ))}
    </View>
  );
};

interface WorkoutLibraryTabProps {
  library?: WorkoutLibraryResponse;
  isLoading: boolean;
  isError: boolean;
  isGuest: boolean;
}

const WorkoutLibraryTab: React.FC<WorkoutLibraryTabProps> = ({ library, isLoading, isError, isGuest }) => {
  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="user-lock" size={48} color={theme.colors.textMuted} solid />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          Sign In Required
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Sign in to view your workout library.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Loading workout library...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="exclamation-circle" size={48} color={theme.colors.textMuted} solid />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Unable to load workout library. Pull to refresh.
        </Text>
      </View>
    );
  }

  const workouts = library?.workouts ?? [];
  if (workouts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="dumbbell" size={48} color={theme.colors.textMuted} solid />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          No workouts saved
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Save workouts from Practice to see them here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.programsContainer}>
      {workouts.map((workout) => (
        <Card key={workout.id} style={styles.programCard}>
          <CardHeader style={styles.programHeader}>
            <View style={styles.programTitleRow}>
              <CardTitle style={styles.programTitle}>{workout.title}</CardTitle>
              <Badge variant="outline" size="sm">
                {workout.category || 'Workout'}
              </Badge>
            </View>
            {!!workout.description && (
              <Text variant="small" color="muted">
                {workout.description}
              </Text>
            )}
          </CardHeader>
          <CardContent>
            <Text variant="small" color="muted">
              Saved workout (details coming next).
            </Text>
          </CardContent>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.muted,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.background,
  },
  tabText: {
    color: theme.colors.textMuted,
  },
  activeTabText: {
    color: theme.colors.foreground,
  },
  programsContainer: {
    gap: theme.spacing.md,
  },
  programCard: {
    marginBottom: theme.spacing.md,
  },
  programHeader: {
    paddingBottom: theme.spacing.sm,
  },
  programTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  programTitle: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  eventsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  programActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl * 2,
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
});
