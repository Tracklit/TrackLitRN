import React, { useState, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MagnifyingGlass,
  Funnel,
  CaretDown,
  Check,
  Plus,
  User,
  LockSimple,
  WarningCircle,
  ClipboardText,
  Trash,
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { Text } from '../components/ui/Text';
import { SkeletonProgramList } from '@/components/Skeleton';
import { MainScreenHeader } from '@/components/MainScreenHeader';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { InlineRefreshHeader } from '@/components/refresh/InlineRefreshHeader';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import type { RootStackParamList } from '@/navigation/types';
import { getBottomNavOverlayHeight, getScreenContentBottomPadding } from '@/utils/layoutPadding';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeValues } from '@/contexts/ThemeContext';
import { AssignAthletesModal } from '@/components/programs/AssignAthletesModal';

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

interface PublicProgram {
  id: number;
  userId: number;
  title: string;
  description?: string | null;
  category?: string | null;
  level?: string | null;
  duration?: number;
  totalSessions?: number;
  coverImageUrl?: string | null;
  createdAt?: string;
  creatorUsername?: string | null;
  creatorName?: string | null;
}


interface ProgramsScreenProps {
  hideHeader?: boolean;
}

const createStyles = (t: ThemeValues) => StyleSheet.create({
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
    backgroundColor: t.colors.overlaySubtle,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: t.colors.textPrimary,
    fontSize: 13,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    gap: 4,
    backgroundColor: t.colors.overlaySubtle,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: t.colors.textPrimary,
    marginHorizontal: 2,
  },
  _viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
    backgroundColor: t.colors.overlaySubtle,
  },
  viewToggleActive: {
    backgroundColor: t.colors.brandOrangeLight,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: t.colors.overlaySubtle,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: t.colors.brandOrangeLight,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: t.colors.textMuted,
  },
  tabTextActive: {
    color: t.colors.brandOrange,
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
    backgroundColor: t.colors.cardSolid,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
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
    color: t.colors.textPrimary,
    marginRight: 8,
  },
  programSubtext: {
    fontSize: 13,
    color: t.colors.textMuted,
  },
  badge: {
    backgroundColor: t.colors.brandOrangeLight,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: t.colors.brandOrange,
  },
  eventsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  eventBadge: {
    backgroundColor: t.colors.overlaySubtle,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: t.colors.textSecondary,
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
    color: t.colors.brandOrange,
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
    color: t.colors.textPrimary,
  },
  actionBtnSecondary: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.35)',
    backgroundColor: 'rgba(255,122,0,0.07)',
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: t.colors.brandOrange,
  },
  listCard: {
    borderRadius: 12,
    backgroundColor: t.colors.cardSolid,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
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
    color: t.colors.textPrimary,
  },
  listActionPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: t.colors.brandOrange,
  },
  listExpandedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: t.colors.overlayLight,
  },
  listExpandedBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  listExpandedSecondaryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  listActionSecondary: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,122,0,0.8)',
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
    color: t.colors.destructive,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: t.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: t.colors.textMuted,
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
    shadowColor: t.colors.brandOrange,
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
  discoverSection: {
    marginTop: 28,
    marginBottom: 8,
  },
  discoverHeading: {
    color: t.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  discoverSubheading: {
    color: t.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  discoverList: {
    gap: 8,
  },
  discoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
  },
  discoverTitle: {
    color: t.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  discoverMeta: {
    color: t.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  filterModal: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
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
    color: t.colors.textMuted,
  },
  filterOptionActive: {
    color: t.colors.brandOrange,
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
    backgroundColor: t.colors.cardSolid,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
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
    color: t.colors.textPrimary,
  },
  menuIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: t.colors.brandOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: t.colors.overlayLight,
    marginHorizontal: 16,
  },
});

export const ProgramsScreen: React.FC<ProgramsScreenProps> = ({ hideHeader = false }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'sprint' | 'distance' | 'strength'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Program | null>(null);
  const { user, isAuthenticated, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const isGuest = userId === 'guest';
  const isCoach = user?.isCoach === true;
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });
  const { styles, theme } = useThemedStyles(createStyles);

  const myProgramsQuery = useQuery({
    queryKey: ['user-programs'],
    queryFn: () => apiRequest<Program[]>('/api/programs'),
    enabled: isAuthenticated && !isGuest,
  });

  // Public programs from other coaches that the user can adopt via Start Program.
  // Returns programs where visibility='public' AND userId != caller.
  const publicProgramsQuery = useQuery({
    queryKey: ['public-programs'],
    queryFn: () => apiRequest<PublicProgram[]>('/api/programs/public'),
    enabled: isAuthenticated && !isGuest,
  });

  const { isRefreshing, onRefresh } = usePullToRefresh(async () => {
    await Promise.all([queryClient.invalidateQueries(), refreshUser()]);
  });

  useEffect(() => {
    if (
      hideHeader &&
      !myProgramsQuery.isLoading &&
      !myProgramsQuery.isError &&
      myProgramsQuery.data?.length === 0 &&
      !isGuest
    ) {
      navigation.navigate('ProgramCreate');
    }
  }, [hideHeader, myProgramsQuery.isLoading, myProgramsQuery.isError, myProgramsQuery.data, isGuest]);

  const handleContinueProgram = (program: Program) => {
    navigation.navigate('ProgramEditor', { id: program.id });
  };

  const handleAttachMyProgram = (program: Program) => {
    setAssignTarget(program);
  };

  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: number | string) => {
      await apiRequest(`/api/programs/${programId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['my-programs'] });
      queryClient.invalidateQueries({ queryKey: ['my-programs-home'] });
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

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      {!hideHeader && <MainScreenHeader />}
      <KeyboardAwareScreenScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={80}
        refreshControl={
          <RefreshControl
            tintColor={theme.colors.textPrimary}
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <InlineRefreshHeader visible={isRefreshing} />

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <MagnifyingGlass size={14} color={theme.colors.textMuted} weight="fill" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search programs..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Funnel size={14} color={theme.colors.textPrimary} weight="fill" />
            <Text style={styles.filterText}>Filter</Text>
            <CaretDown size={10} color={theme.colors.textPrimary} weight="fill" />
          </TouchableOpacity>

        </View>

        <MyProgramsTab
          programs={filteredMyPrograms}
          isLoading={myProgramsQuery.isLoading}
          isError={myProgramsQuery.isError}
          isGuest={isGuest}
          onContinue={handleContinueProgram}
          onDelete={handleDeleteProgram}
          onAttach={isCoach ? handleAttachMyProgram : undefined}
          styles={styles}
          theme={theme}
        />

        {isAuthenticated && !isGuest && (publicProgramsQuery.data?.length ?? 0) > 0 && (
          <View style={styles.discoverSection}>
            <Text style={styles.discoverHeading}>Discover Public Programs</Text>
            <Text style={styles.discoverSubheading}>
              Programs shared by other coaches. Tap one to view it and start practicing.
            </Text>
            <View style={styles.discoverList}>
              {(publicProgramsQuery.data ?? []).map((p) => (
                <TouchableOpacity
                  key={`public-${p.id}`}
                  style={styles.discoverRow}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('ProgramDetail', { id: p.id })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.discoverTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.discoverMeta} numberOfLines={1}>
                      by @{p.creatorUsername || 'unknown'}
                      {p.category ? ` · ${p.category}` : ''}
                      {p.level ? ` · ${p.level}` : ''}
                    </Text>
                  </View>
                  <CaretDown
                    size={14}
                    color={theme.colors.textMuted}
                    weight="bold"
                    style={{ transform: [{ rotate: '-90deg' }] }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
                  <Check size={12} color={theme.colors.brandOrange} weight="bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <AssignAthletesModal
        visible={!!assignTarget}
        program={assignTarget ? { id: Number(assignTarget.id), title: assignTarget.title } : null}
        onClose={() => setAssignTarget(null)}
      />

      {isAuthenticated && !isGuest && (
        <TouchableOpacity
          style={[styles.fab, { bottom: getBottomNavOverlayHeight(insets.bottom) + 16 }]}
          onPress={handleCreateAction}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.brandOrange, '#FF9D00']}
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
  onAttach?: (program: Program) => void;
  styles: ReturnType<typeof createStyles>;
  theme: ThemeValues;
}

const MyProgramsTab: React.FC<MyProgramsTabProps> = ({
  programs,
  isLoading,
  isError,
  isGuest,
  onContinue,
  onDelete,
  onAttach,
  styles,
  theme,
}) => {
  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <LockSimple size={48} color={theme.colors.textMuted} weight="fill" />
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
        <WarningCircle size={48} color={theme.colors.textMuted} weight="fill" />
        <Text style={styles.emptyDescription}>Unable to load programs. Pull to refresh.</Text>
      </View>
    );
  }

  if (programs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <ClipboardText size={48} color={theme.colors.textMuted} weight="fill" />
        <Text style={styles.emptyTitle}>No Programs Yet</Text>
        <Text style={styles.emptyDescription}>You haven't created any training programs yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {programs.map((program) => (
        <ProgramListItem
          key={program.id}
          program={program}
          onContinue={() => onContinue(program)}
          onDelete={() => onDelete(program)}
          onAttach={onAttach ? () => onAttach(program) : undefined}
          buttonLabel="Edit Program"
          styles={styles}
          theme={theme}
        />
      ))}
    </View>
  );
};


interface ProgramListItemProps {
  program: Program;
  badgeLabel?: string;
  onContinue: () => void;
  onDelete?: () => void;
  onAttach?: () => void;
  buttonLabel?: string;
  styles: ReturnType<typeof createStyles>;
  theme: ThemeValues;
}

const ProgramListItem: React.FC<ProgramListItemProps> = ({
  program,
  badgeLabel,
  onContinue,
  onDelete,
  onAttach,
  buttonLabel = 'Continue',
  styles,
  theme,
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
              color={theme.colors.textMuted}
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
          {onAttach && (
            <TouchableOpacity style={styles.listExpandedSecondaryBtn} onPress={onAttach} activeOpacity={0.7}>
              <Text style={styles.listActionSecondary}>Assign to Athletes</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.listExpandedDeleteBtn} activeOpacity={0.7}>
              <Trash size={14} color={theme.colors.destructive} weight="fill" />
              <Text style={styles.listDeleteText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
