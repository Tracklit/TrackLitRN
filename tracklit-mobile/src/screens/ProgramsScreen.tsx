import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MagnifyingGlass,
  Funnel,
  CaretDown,
  SquaresFour,
  List,
  Check,
  Plus,
  User,
  LockSimple,
  WarningCircle,
  ClipboardText,
  ShoppingBag,
  Barbell,
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Text } from '../components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { InlineRefreshHeader } from '@/components/refresh/InlineRefreshHeader';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import type { RootStackParamList } from '@/navigation/types';
import { getBottomNavOverlayHeight, getScreenContentBottomPadding } from '@/utils/layoutPadding';
import { PROGRAM_SELECTION_KEY } from '@/utils/programSelection';
import theme from '../utils/theme';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'sprint' | 'distance' | 'strength'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const { user, isAuthenticated, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const isGuest = userId === 'guest';
  const isCoach = user?.isCoach === true;
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

  const { isRefreshing, onRefresh } = usePullToRefresh(async () => {
    await Promise.all([queryClient.invalidateQueries(), refreshUser()]);
  });

  const handleContinueProgram = (program: Program) => {
    navigation.navigate('ProgramEditor', { id: program.id });
  };

  const handleContinuePurchasedProgram = async (purchase: PurchasedProgramItem) => {
    await AsyncStorage.setItem(PROGRAM_SELECTION_KEY, String(purchase.id));
    navigation.navigate('MainTabs', { screen: 'Practice' } as never);
  };

  const handleViewDetails = (program: Program) => {
    navigation.navigate('ProgramDetail', { id: program.id });
  };

  const handleCreateAction = () => {
    if (isCoach) {
      navigation.navigate('ProgramCreate');
      return;
    }
    setShowCreateMenu(true);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesQuery = (value?: string | null) =>
    !normalizedQuery || (value ?? '').toLowerCase().includes(normalizedQuery);

  const matchesCategory = (program: Program) => {
    if (filterCategory === 'all') return true;
    const category = ((program as any)?.category ?? '').toString().toLowerCase();
    return category.includes(filterCategory);
  };

  const filteredMyPrograms = (myProgramsQuery.data ?? []).filter((program) => {
    return (
      matchesQuery(program.title) ||
      matchesQuery(program.description) ||
      matchesCategory(program)
    );
  });

  const filteredPurchasedPrograms = (purchasedProgramsQuery.data ?? []).filter((purchase) => {
    const program = purchase.program;
    if (!program) return false;
    return (
      matchesQuery(program.title) ||
      matchesQuery(program.description) ||
      matchesCategory(program)
    );
  });

  const filteredWorkouts = (workoutLibraryQuery.data?.workouts ?? []).filter((workout) => {
    return matchesQuery(workout.title) || matchesQuery(workout.description ?? undefined);
  });

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <KeyboardAwareScreenScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={80}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <InlineRefreshHeader visible={isRefreshing} />

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <MagnifyingGlass size={14} color="rgba(255,255,255,0.6)" weight="fill" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search programs..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Funnel size={14} color="white" weight="fill" />
            <Text variant="caption" weight="medium" color="primary-foreground" style={styles.filterText}>
              Filter
            </Text>
            <CaretDown size={10} color="white" weight="fill" />
          </TouchableOpacity>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'cards' && styles.viewToggleActive]}
              onPress={() => setViewMode('cards')}
            >
              <SquaresFour
                size={14}
                color={viewMode === 'cards' ? theme.colors.webPurpleStart : 'rgba(255,255,255,0.6)'}
                weight="fill"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleActive]}
              onPress={() => setViewMode('list')}
            >
              <List
                size={14}
                color={viewMode === 'list' ? theme.colors.webPurpleStart : 'rgba(255,255,255,0.6)'}
                weight="fill"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <LinearGradient
          colors={['rgba(91, 33, 182, 0.3)', 'rgba(124, 58, 237, 0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tabs}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-programs' && styles.activeTab]}
            onPress={() => setActiveTab('my-programs')}
            data-testid="tab-my-programs"
          >
            <Text
              variant="small"
              weight="medium"
              style={[styles.tabText, activeTab === 'my-programs' && styles.activeTabText]}
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
              variant="small"
              weight="medium"
              style={[styles.tabText, activeTab === 'purchased' && styles.activeTabText]}
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
              variant="small"
              weight="medium"
              style={[styles.tabText, activeTab === 'workout-library' && styles.activeTabText]}
            >
              Workout Library
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Content */}
        {activeTab === 'my-programs' ? (
          <MyProgramsTab
            programs={filteredMyPrograms}
            isLoading={myProgramsQuery.isLoading}
            isError={myProgramsQuery.isError}
            isGuest={isGuest}
            onContinue={handleContinueProgram}
            onViewDetails={handleViewDetails}
            viewMode={viewMode}
          />
        ) : activeTab === 'purchased' ? (
          <PurchasedProgramsTab
            purchases={filteredPurchasedPrograms}
            isLoading={purchasedProgramsQuery.isLoading}
            isError={purchasedProgramsQuery.isError}
            isGuest={isGuest}
            onContinue={handleContinuePurchasedProgram}
            onViewDetails={handleViewDetails}
            viewMode={viewMode}
          />
        ) : (
          <WorkoutLibraryTab
            library={workoutLibraryQuery.data}
            isLoading={workoutLibraryQuery.isLoading}
            isError={workoutLibraryQuery.isError}
            isGuest={isGuest}
            filteredWorkouts={filteredWorkouts}
          />
        )}
      </KeyboardAwareScreenScrollView>

      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity style={styles.filterOverlay} onPress={() => setShowFilterModal(false)}>
          <View style={styles.filterModal}>
            {(['all', 'sprint', 'distance', 'strength'] as const).map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.filterOption}
                onPress={() => {
                  setFilterCategory(category);
                  setShowFilterModal(false);
                }}
              >
                <Text
                  variant="body"
                  weight={filterCategory === category ? 'semiBold' : 'regular'}
                  color={filterCategory === category ? 'foreground' : 'muted'}
                >
                  {category === 'all'
                    ? 'All Programs'
                    : `${category.charAt(0).toUpperCase()}${category.slice(1)} Programs`}
                </Text>
                {filterCategory === category && (
                  <Check size={12} color={theme.colors.primary} weight="bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {isAuthenticated && !isGuest && activeTab === 'my-programs' && (
        <TouchableOpacity
          style={[styles.fab, { bottom: getBottomNavOverlayHeight(insets.bottom) + theme.spacing.lg }]}
          onPress={handleCreateAction}
          accessibilityRole="button"
          accessibilityLabel="Create program"
        >
          <LinearGradient
            colors={theme.gradients.webPurple.colors}
            start={theme.gradients.webPurple.start}
            end={theme.gradients.webPurple.end}
            style={styles.fabGradient}
          >
            <Plus size={22} color="white" weight="bold" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <Modal
        visible={showCreateMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateMenu(false)}
      >
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setShowCreateMenu(false)} activeOpacity={1}>
          <View style={styles.createMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowCreateMenu(false);
                navigation.navigate('ProgramCreate');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrapper}>
                <Plus size={16} color="white" weight="bold" />
              </View>
              <Text variant="small" weight="medium" color="primary-foreground">
                Create a Program
              </Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowCreateMenu(false);
                navigation.navigate('Coaches');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrapper}>
                <User size={16} color="white" weight="fill" />
              </View>
              <Text variant="small" weight="medium" color="primary-foreground">
                Find a Coach
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  viewMode: 'cards' | 'list';
}

const MyProgramsTab: React.FC<MyProgramsTabProps> = ({ 
  programs, 
  isLoading, 
  isError, 
  isGuest,
  onContinue,
  onViewDetails,
  viewMode,
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
        <LockSimple size={48} color={theme.colors.textMuted} weight="fill" />
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
        <WarningCircle size={48} color={theme.colors.textMuted} weight="fill" />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Unable to load programs. Pull to refresh.
        </Text>
      </View>
    );
  }

  if (programs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <ClipboardText size={48} color={theme.colors.textMuted} weight="fill" />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          No Programs Yet
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          You haven't created any training programs yet.
        </Text>
      </View>
    );
  }

  return viewMode === 'list' ? (
    <View style={styles.listContainer}>
      {programs.map((program) => (
        <ProgramListItem
          key={program.id}
          program={program}
          onContinue={() => onContinue(program)}
          onViewDetails={() => onViewDetails(program)}
        />
      ))}
    </View>
  ) : (
    <View style={styles.programsContainer}>
      {programs.map((program) => (
        <ProgramCardItem
          key={program.id}
          program={program}
          levelBadge={getLevelColor(program.level || program.difficulty)}
          onContinue={() => onContinue(program)}
          onViewDetails={() => onViewDetails(program)}
        />
      ))}
    </View>
  );
};

interface PurchasedProgramsTabProps {
  purchases: PurchasedProgramItem[];
  isLoading: boolean;
  isError: boolean;
  isGuest: boolean;
  onContinue: (purchase: PurchasedProgramItem) => void;
  onViewDetails: (program: Program) => void;
  viewMode: 'cards' | 'list';
}

const PurchasedProgramsTab: React.FC<PurchasedProgramsTabProps> = ({
  purchases,
  isLoading, 
  isError,
  isGuest,
  onContinue,
  onViewDetails,
  viewMode,
}) => {
  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <LockSimple size={48} color={theme.colors.textMuted} weight="fill" />
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
        <WarningCircle size={48} color={theme.colors.textMuted} weight="fill" />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Unable to load purchased programs. Pull to refresh.
        </Text>
      </View>
    );
  }

  if (purchases.length === 0) {
    return (
      <View style={styles.emptyState}>
        <ShoppingBag size={48} color={theme.colors.textMuted} weight="fill" />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          No Purchased Programs
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Purchases and coach assignments will show up here.
        </Text>
      </View>
    );
  }

  return viewMode === 'list' ? (
    <View style={styles.listContainer}>
      {purchases.map((purchase) => (
        <ProgramListItem
          key={purchase.id}
          program={purchase.program}
          badgeLabel={
            purchase.isAssigned ? 'Assigned' : purchase.isCreated ? 'Created' : 'Purchased'
          }
          onContinue={() => onContinue(purchase)}
          onViewDetails={() => onViewDetails(purchase.program)}
        />
      ))}
    </View>
  ) : (
    <View style={styles.programsContainer}>
      {purchases.map((purchase) => (
        <ProgramCardItem
          key={purchase.id}
          program={purchase.program}
          badgeLabel={
            purchase.isAssigned ? 'Assigned' : purchase.isCreated ? 'Created' : 'Purchased'
          }
          badgeVariant={purchase.isAssigned ? 'secondary' : purchase.isCreated ? 'outline' : 'default'}
          subtitle={
            purchase.isAssigned && purchase.assignerName
              ? `Coach: ${purchase.assignerName}`
              : 'TrackLit'
          }
          onContinue={() => onContinue(purchase)}
          onViewDetails={() => onViewDetails(purchase.program)}
          price={purchase.program?.price}
        />
      ))}
    </View>
  );
};

interface WorkoutLibraryTabProps {
  library?: WorkoutLibraryResponse;
  isLoading: boolean;
  isError: boolean;
  isGuest: boolean;
  filteredWorkouts: WorkoutLibraryResponse['workouts'];
}

const WorkoutLibraryTab: React.FC<WorkoutLibraryTabProps> = ({ library, isLoading, isError, isGuest, filteredWorkouts }) => {
  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <LockSimple size={48} color={theme.colors.textMuted} weight="fill" />
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
        <WarningCircle size={48} color={theme.colors.textMuted} weight="fill" />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Unable to load workout library. Pull to refresh.
        </Text>
      </View>
    );
  }

  const workouts = filteredWorkouts ?? [];
  if (workouts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Barbell size={48} color={theme.colors.textMuted} weight="fill" />
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

interface ProgramCardItemProps {
  program: Program;
  levelBadge?: 'success' | 'warning' | 'destructive' | 'default';
  badgeLabel?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline';
  subtitle?: string;
  price?: number;
  onContinue: () => void;
  onViewDetails: () => void;
}

const ProgramCardItem: React.FC<ProgramCardItemProps> = ({
  program,
  levelBadge,
  badgeLabel,
  badgeVariant = 'default',
  subtitle,
  price,
  onContinue,
  onViewDetails,
}) => {
  return (
    <Card style={styles.programCard}>
      <CardHeader style={styles.programHeader}>
        <View style={styles.programTitleRow}>
          <CardTitle style={styles.programTitle}>{program.title}</CardTitle>
          {badgeLabel && (
            <Badge variant={badgeVariant} size="sm">
              {badgeLabel}
            </Badge>
          )}
        </View>
        <Text variant="small" color="muted">
          {subtitle ?? (program.coachName ? `by ${program.coachName}` : 'TrackLit Program')}
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

        {!!price && price > 0 && (
          <View style={styles.priceRow}>
            <Text variant="h3" weight="bold" color="primary">
              ${price}
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
            onPress={onContinue}
            data-testid={`button-continue-program-${program.id}`}
          >
            Continue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={onViewDetails}
            data-testid={`button-view-program-${program.id}`}
          >
            View Details
          </Button>
        </View>
      </CardContent>
    </Card>
  );
};

interface ProgramListItemProps {
  program: Program;
  badgeLabel?: string;
  onContinue: () => void;
  onViewDetails: () => void;
}

const ProgramListItem: React.FC<ProgramListItemProps> = ({
  program,
  badgeLabel,
  onContinue,
  onViewDetails,
}) => {
  return (
    <Card style={styles.listCard}>
      <CardContent style={styles.listContent}>
        <View style={styles.listMain}>
          <View style={styles.listTitleRow}>
            <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
              {program.title}
            </Text>
            {badgeLabel && (
              <Badge variant="secondary" size="sm">
                {badgeLabel}
              </Badge>
            )}
          </View>
          <Text variant="small" color="muted" numberOfLines={1}>
            {program.description || 'No description'}
          </Text>
        </View>
        <View style={styles.listActions}>
          <TouchableOpacity onPress={onViewDetails}>
            <Text variant="small" color="muted">
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onContinue}>
            <Text variant="small" color="primary">
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  searchInputWrapper: {
    flex: 1,
    minWidth: 160,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.foreground,
    fontSize: theme.typography.sizes.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  filterText: {
    marginHorizontal: theme.spacing.xs,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingHorizontal: theme.spacing.sm,
    height: '100%',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewToggleActive: {
    backgroundColor: theme.colors.foreground,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.foreground,
  },
  tabText: {
    color: 'rgba(255,255,255,0.85)',
  },
  activeTabText: {
    color: theme.colors.webPurpleStart,
  },
  programsContainer: {
    gap: theme.spacing.lg,
  },
  listContainer: {
    gap: theme.spacing.sm,
  },
  programCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.webCardBorder,
    marginBottom: 0,
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
  listCard: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.webCard,
    borderWidth: 1,
    borderColor: theme.colors.webCardBorder,
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  listMain: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  listActions: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
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
    right: theme.spacing.xl + theme.spacing.sm,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  filterModal: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: theme.spacing.xl + theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  createMenu: {
    width: 220,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
    paddingVertical: theme.spacing.md,
    marginBottom: 72,
    ...theme.shadows.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  menuIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: theme.spacing.lg,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
});
