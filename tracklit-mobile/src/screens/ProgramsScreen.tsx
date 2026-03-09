import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from '@/components/LinearGradient';
import theme from '@/utils/theme';
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
  Trash,
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { Text } from '../components/ui/Text';
import { SkeletonProgramList } from '@/components/Skeleton';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { InlineRefreshHeader } from '@/components/refresh/InlineRefreshHeader';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import type { RootStackParamList } from '@/navigation/types';
import { getBottomNavOverlayHeight, getScreenContentBottomPadding } from '@/utils/layoutPadding';
import { PROGRAM_SELECTION_KEY } from '@/utils/programSelection';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';

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
  tabBg: 'rgba(255,255,255,0.04)',
  tabActive: 'rgba(255,122,0,0.15)',
};

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

  const myProgramsQuery = useQuery({
    queryKey: ['user-programs'],
    queryFn: () => apiRequest<Program[]>('/api/programs'),
    enabled: isAuthenticated && !isGuest,
  });

  const purchasedProgramsQuery = useQuery({
    queryKey: ['purchased-programs'],
    queryFn: () => apiRequest<PurchasedProgramItem[]>('/api/purchased-programs'),
    enabled: isAuthenticated && !isGuest,
  });

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

  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: number | string) => {
      await apiRequest(`/api/programs/${programId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs-home'] });
      queryClient.invalidateQueries({ queryKey: ['today-session'] });
    },
  });

  const unassignProgramMutation = useMutation({
    mutationFn: async (purchaseId: number | string) => {
      await apiRequest(`/api/purchased-programs/${purchaseId}`, { method: 'DELETE' });
    },
    onSuccess: async () => {
      const storedId = await AsyncStorage.getItem(PROGRAM_SELECTION_KEY);
      if (storedId) {
        await AsyncStorage.removeItem(PROGRAM_SELECTION_KEY);
      }
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs-home'] });
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['today-session'] });
    },
  });

  const handleDeleteProgram = (program: Program) => {
    Alert.alert(
      'Delete Program',
      `Are you sure you want to delete "${program.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProgramMutation.mutate(program.id, {
              onSuccess: () => Alert.alert('Deleted', `"${program.title}" has been deleted.`),
              onError: (err: any) => Alert.alert('Error', err?.message || 'Failed to delete program.'),
            });
          },
        },
      ]
    );
  };

  const handleUnassignProgram = (purchase: PurchasedProgramItem) => {
    const title = purchase.program?.title || 'this program';
    Alert.alert(
      'Remove Program',
      `Are you sure you want to remove "${title}" from your assigned programs?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            unassignProgramMutation.mutate(purchase.id, {
              onSuccess: () => Alert.alert('Removed', `"${title}" has been removed.`),
              onError: (err: any) => Alert.alert('Error', err?.message || 'Failed to remove program.'),
            });
          },
        },
      ]
    );
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
            <MagnifyingGlass size={14} color={C.textMuted} weight="fill" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search programs..."
              placeholderTextColor={C.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Funnel size={14} color={C.textPrimary} weight="fill" />
            <Text style={styles.filterText}>Filter</Text>
            <CaretDown size={10} color={C.textPrimary} weight="fill" />
          </TouchableOpacity>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'cards' && styles.viewToggleActive]}
              onPress={() => setViewMode('cards')}
              accessibilityRole="button"
              accessibilityLabel="Card view"
            >
              <SquaresFour
                size={14}
                color={viewMode === 'cards' ? C.orange : C.textMuted}
                weight="fill"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleActive]}
              onPress={() => setViewMode('list')}
              accessibilityRole="button"
              accessibilityLabel="List view"
            >
              <List
                size={14}
                color={viewMode === 'list' ? C.orange : C.textMuted}
                weight="fill"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          {([
            { key: 'my-programs', label: 'My Programs' },
            { key: 'purchased', label: 'Purchased' },
            { key: 'workout-library', label: 'Library' },
          ] as const).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'my-programs' ? (
          <MyProgramsTab
            programs={filteredMyPrograms}
            isLoading={myProgramsQuery.isLoading}
            isError={myProgramsQuery.isError}
            isGuest={isGuest}
            onContinue={handleContinueProgram}
            onDelete={handleDeleteProgram}
            viewMode={viewMode}
          />
        ) : activeTab === 'purchased' ? (
          <PurchasedProgramsTab
            purchases={filteredPurchasedPrograms}
            isLoading={purchasedProgramsQuery.isLoading}
            isError={purchasedProgramsQuery.isError}
            isGuest={isGuest}
            onContinue={handleContinuePurchasedProgram}
            onRemove={handleUnassignProgram}
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
                <Text style={[styles.filterOptionText, filterCategory === category && styles.filterOptionActive]}>
                  {category === 'all'
                    ? 'All Programs'
                    : `${category.charAt(0).toUpperCase()}${category.slice(1)} Programs`}
                </Text>
                {filterCategory === category && (
                  <Check size={12} color={C.orange} weight="bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {isAuthenticated && !isGuest && activeTab === 'my-programs' && (
        <TouchableOpacity
          style={[styles.fab, { bottom: getBottomNavOverlayHeight(insets.bottom) + 16 }]}
          onPress={handleCreateAction}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Create program"
        >
          <LinearGradient
            colors={[C.orange, C.orangeLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
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
              <Text style={styles.menuItemText}>Create a Program</Text>
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
              <Text style={styles.menuItemText}>Find a Coach</Text>
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
  onDelete: (program: Program) => void;
  viewMode: 'cards' | 'list';
}

const MyProgramsTab: React.FC<MyProgramsTabProps> = ({
  programs,
  isLoading,
  isError,
  isGuest,
  onContinue,
  onDelete,
  viewMode,
}) => {
  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <LockSimple size={48} color={C.textMuted} weight="fill" />
        <Text style={styles.emptyTitle}>Sign In Required</Text>
        <Text style={styles.emptyDescription}>Sign in to view your enrolled training programs.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <SkeletonProgramList count={3} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyState}>
        <WarningCircle size={48} color={C.textMuted} weight="fill" />
        <Text style={styles.emptyDescription}>Unable to load programs. Pull to refresh.</Text>
      </View>
    );
  }

  if (programs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <ClipboardText size={48} color={C.textMuted} weight="fill" />
        <Text style={styles.emptyTitle}>No Programs Yet</Text>
        <Text style={styles.emptyDescription}>You haven't created any training programs yet.</Text>
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
          onDelete={() => onDelete(program)}
          buttonLabel="Edit Program"
        />
      ))}
    </View>
  ) : (
    <View style={styles.programsContainer}>
      {programs.map((program) => (
        <ProgramCardItem
          key={program.id}
          program={program}
          onContinue={() => onContinue(program)}
          onDelete={() => onDelete(program)}
          buttonLabel="Edit Program"
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
  onRemove: (purchase: PurchasedProgramItem) => void;
  viewMode: 'cards' | 'list';
}

const PurchasedProgramsTab: React.FC<PurchasedProgramsTabProps> = ({
  purchases,
  isLoading,
  isError,
  isGuest,
  onContinue,
  onRemove,
  viewMode,
}) => {
  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <LockSimple size={48} color={C.textMuted} weight="fill" />
        <Text style={styles.emptyTitle}>Sign In Required</Text>
        <Text style={styles.emptyDescription}>Sign in to view your purchased and assigned programs.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <SkeletonProgramList count={3} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyState}>
        <WarningCircle size={48} color={C.textMuted} weight="fill" />
        <Text style={styles.emptyDescription}>Unable to load purchased programs. Pull to refresh.</Text>
      </View>
    );
  }

  if (purchases.length === 0) {
    return (
      <View style={styles.emptyState}>
        <ShoppingBag size={48} color={C.textMuted} weight="fill" />
        <Text style={styles.emptyTitle}>No Purchased Programs</Text>
        <Text style={styles.emptyDescription}>Purchases and coach assignments will show up here.</Text>
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
          onDelete={() => onRemove(purchase)}
          buttonLabel="Assign"
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
          subtitle={
            purchase.isAssigned && purchase.assignerName
              ? `Coach: ${purchase.assignerName}`
              : 'TrackLit'
          }
          onContinue={() => onContinue(purchase)}
          onDelete={() => onRemove(purchase)}
          price={purchase.program?.price}
          buttonLabel="Assign"
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
        <LockSimple size={48} color={C.textMuted} weight="fill" />
        <Text style={styles.emptyTitle}>Sign In Required</Text>
        <Text style={styles.emptyDescription}>Sign in to view your workout library.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <SkeletonProgramList count={3} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyState}>
        <WarningCircle size={48} color={C.textMuted} weight="fill" />
        <Text style={styles.emptyDescription}>Unable to load workout library. Pull to refresh.</Text>
      </View>
    );
  }

  const workouts = filteredWorkouts ?? library?.workouts ?? [];

  if (workouts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Barbell size={48} color={C.textMuted} weight="fill" />
        <Text style={styles.emptyTitle}>No workouts saved</Text>
        <Text style={styles.emptyDescription}>Save workouts from Practice to see them here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.programsContainer}>
      {workouts.map((workout) => (
        <View key={workout.id} style={styles.programCard}>
          <View style={styles.programCardInner}>
            <View style={styles.programTitleRow}>
              <Text style={styles.programTitleText} numberOfLines={1}>{workout.title}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{workout.category || 'Workout'}</Text>
              </View>
            </View>
            {!!workout.description && (
              <Text style={styles.programSubtext} numberOfLines={2}>{workout.description}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

interface ProgramCardItemProps {
  program: Program;
  badgeLabel?: string;
  subtitle?: string;
  price?: number;
  onContinue: () => void;
  onDelete?: () => void;
  buttonLabel?: string;
}

const ProgramCardItem: React.FC<ProgramCardItemProps> = ({
  program,
  badgeLabel,
  subtitle,
  price,
  onContinue,
  onDelete,
  buttonLabel = 'Continue',
}) => {
  return (
    <View style={styles.programCard}>
      <View style={styles.programCardInner}>
        <View style={styles.programTitleRow}>
          <Text style={[styles.programTitleText, { flex: 1 }]} numberOfLines={1}>{program.title}</Text>
          {badgeLabel && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} activeOpacity={0.7}>
              <Trash size={18} color="#ef4444" weight="fill" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.programSubtext} numberOfLines={1}>
          {subtitle ?? (program.coachName ? `by ${program.coachName}` : 'TrackLit Program')}
          {program.durationWeeks ? ` · ${program.durationWeeks} weeks` : program.duration ? ` · ${program.duration}` : ''}
        </Text>

        {program.events && program.events.length > 0 && (
          <View style={styles.eventsContainer}>
            {program.events.map((event, index) => (
              <View key={index} style={styles.eventBadge}>
                <Text style={styles.eventBadgeText}>{event}</Text>
              </View>
            ))}
          </View>
        )}

        {!!price && price > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>${price}</Text>
            <Text style={styles.programSubtext}>one-time</Text>
          </View>
        )}

        <View style={styles.programActions}>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={onContinue} activeOpacity={0.8}>
            <LinearGradient
              colors={[C.orange, C.orangeLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionBtnGradient}
            >
              <Text style={styles.actionBtnPrimaryText}>{buttonLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

interface ProgramListItemProps {
  program: Program;
  badgeLabel?: string;
  onContinue: () => void;
  onDelete?: () => void;
  buttonLabel?: string;
}

const ProgramListItem: React.FC<ProgramListItemProps> = ({
  program,
  badgeLabel,
  onContinue,
  onDelete,
  buttonLabel = 'Continue',
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.listCard}>
      <TouchableOpacity
        style={styles.listContent}
        activeOpacity={0.8}
        onPress={() => setExpanded((prev) => !prev)}
      >
        <View style={styles.listMain}>
          <View style={styles.listTitleRow}>
            <Text style={[styles.listTitleText, { flex: 1 }]} numberOfLines={1}>{program.title}</Text>
            {badgeLabel && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeLabel}</Text>
              </View>
            )}
            <CaretDown
              size={14}
              color={C.textMuted}
              weight="bold"
              style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }], marginLeft: 6 }}
            />
          </View>
          <Text style={styles.programSubtext} numberOfLines={expanded ? undefined : 1}>
            {program.description || 'No description'}
          </Text>
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.listExpandedActions}>
          <TouchableOpacity style={styles.listExpandedBtn} onPress={onContinue} activeOpacity={0.8}>
            <Text style={styles.listActionPrimary}>{buttonLabel}</Text>
          </TouchableOpacity>
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.listExpandedDeleteBtn} activeOpacity={0.7}>
              <Trash size={14} color="#ef4444" weight="fill" />
              <Text style={styles.listDeleteText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  deleteBtn: {
    padding: 6,
    marginLeft: 8,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 20,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flex: 1,
    minWidth: 160,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 13,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    gap: 4,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textPrimary,
    marginHorizontal: 2,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
    backgroundColor: C.glass,
  },
  viewToggleActive: {
    backgroundColor: 'rgba(255,122,0,0.12)',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: C.tabBg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: C.tabActive,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
  },
  tabTextActive: {
    color: C.orange,
  },
  programsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listContainer: {
    gap: 8,
  },
  programCard: {
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    overflow: 'hidden',
    flexBasis: '48%',
    flexGrow: 1,
  },
  programCardInner: {
    padding: 12,
    gap: 6,
  },
  programTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programTitleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
    marginRight: 8,
  },
  programSubtext: {
    fontSize: 13,
    color: C.textMuted,
  },
  badge: {
    backgroundColor: 'rgba(255,122,0,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.orange,
  },
  eventsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  eventBadge: {
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: C.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: C.orange,
  },
  programActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtnPrimary: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
  },
  listCard: {
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  listMain: {
    flex: 1,
    gap: 4,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listTitleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
  },
  listActionPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: C.orange,
  },
  listExpandedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  listExpandedBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  listExpandedDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  listDeleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: C.orange,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  filterModal: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 16,
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  filterOptionText: {
    fontSize: 14,
    color: C.textMuted,
  },
  filterOptionActive: {
    color: C.orange,
    fontWeight: '600',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 24,
    paddingBottom: 16,
  },
  createMenu: {
    width: 220,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingVertical: 8,
    marginBottom: 72,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.textPrimary,
  },
  menuIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,122,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: C.border,
    marginHorizontal: 16,
  },
});
