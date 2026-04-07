import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle, BookOpen } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonListRows } from '@/components/Skeleton';
import { apiRequest } from '@/lib/api';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface CoachAthlete {
  id: number;
  username: string;
  name?: string | null;
  profileImageUrl?: string | null;
  relationshipId?: number;
}

interface AssignAthletesModalProps {
  visible: boolean;
  onClose: () => void;
  program: { id: number; title: string } | null;
}

type AssignResult = 'success' | 'already' | string;

const ALREADY_ASSIGNED_MESSAGE = 'Program is already assigned to this user';

const INVALIDATE_KEYS: string[][] = [
  ['coach-programs'],
  ['coach-athletes'],
  ['user-programs'],
  ['my-programs'],
  ['my-programs-home'],
  ['today-session'],
];

export const AssignAthletesModal: React.FC<AssignAthletesModalProps> = ({
  visible,
  onClose,
  program,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const { styles, theme } = useThemedStyles(createStyles);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [resultMap, setResultMap] = useState<Record<number, AssignResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const athletesQuery = useQuery({
    queryKey: ['coach-athletes'],
    queryFn: () => apiRequest<CoachAthlete[]>('/api/coach/athletes'),
    enabled: visible,
  });

  useEffect(() => {
    if (!visible) {
      setSelectedIds(new Set());
      setResultMap({});
      setIsSubmitting(false);
    }
  }, [visible]);

  const athletes = useMemo(() => athletesQuery.data ?? [], [athletesQuery.data]);

  const toggleAthlete = (athleteId: number) => {
    if (isSubmitting) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(athleteId)) {
        next.delete(athleteId);
      } else {
        next.add(athleteId);
      }
      return next;
    });
    setResultMap((prev) => {
      if (!(athleteId in prev)) return prev;
      const next = { ...prev };
      delete next[athleteId];
      return next;
    });
  };

  const handleAddAthletes = () => {
    onClose();
    navigation.navigate('MyAthletes');
  };

  const invalidateAfterAssign = () => {
    INVALIDATE_KEYS.forEach((key) => {
      void queryClient.invalidateQueries({ queryKey: key });
    });
  };

  const handleAssign = async () => {
    if (!program || selectedIds.size === 0 || isSubmitting) return;

    const ids = Array.from(selectedIds);
    setIsSubmitting(true);
    setResultMap({});

    const settled = await Promise.allSettled(
      ids.map((athleteId) =>
        apiRequest(`/api/programs/${program.id}/assign`, {
          method: 'POST',
          data: { assigneeId: Number(athleteId) },
        }),
      ),
    );

    const nextResults: Record<number, AssignResult> = {};
    let successCount = 0;
    let alreadyCount = 0;
    const errorEntries: { athleteId: number; message: string }[] = [];

    settled.forEach((result, index) => {
      const athleteId = ids[index];
      if (result.status === 'fulfilled') {
        nextResults[athleteId] = 'success';
        successCount += 1;
        return;
      }

      const message: string =
        (result.reason && typeof result.reason === 'object' && result.reason.message) ||
        'Failed to assign program';

      if (message === ALREADY_ASSIGNED_MESSAGE) {
        nextResults[athleteId] = 'already';
        alreadyCount += 1;
        return;
      }

      nextResults[athleteId] = message;
      errorEntries.push({ athleteId, message });
    });

    setResultMap(nextResults);
    setIsSubmitting(false);
    invalidateAfterAssign();

    const totalHandled = successCount + alreadyCount;
    const summaryLines = [
      `Assigned "${program.title}" to ${totalHandled} of ${ids.length} athletes.`,
    ];

    if (errorEntries.length > 0) {
      const shown = errorEntries.slice(0, 3).map(({ athleteId, message }) => {
        const athlete = athletes.find((a) => a.id === athleteId);
        const label = athlete?.name || athlete?.username || `Athlete ${athleteId}`;
        return `${label}: ${message}`;
      });
      summaryLines.push('', 'Some assignments failed:');
      summaryLines.push(...shown);
      if (errorEntries.length > 3) {
        summaryLines.push(`And ${errorEntries.length - 3} more.`);
      }
    }

    Alert.alert('Assign Program', summaryLines.join('\n'));

    if (errorEntries.length === 0) {
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const selectedCount = selectedIds.size;
  const assignLabel =
    selectedCount === 0
      ? 'Assign'
      : `Assign to ${selectedCount} athlete${selectedCount === 1 ? '' : 's'}`;

  const renderAthleteStatus = (athleteId: number) => {
    const result = resultMap[athleteId];
    if (result === 'success') {
      return <CheckCircle size={18} color={theme.colors.success} weight="fill" />;
    }
    if (result === 'already') {
      return <CheckCircle size={18} color={theme.colors.textMuted} weight="fill" />;
    }
    if (typeof result === 'string') {
      return (
        <Text style={styles.errorText} numberOfLines={2}>
          {result}
        </Text>
      );
    }
    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.headerSubtitle}>Assign to</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {program?.title || 'Program'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <X size={14} color={theme.colors.textSecondary} weight="bold" />
            </TouchableOpacity>
          </View>

          <View style={styles.listWrapper}>
            {athletesQuery.isLoading ? (
              <View style={styles.loadingWrapper}>
                <SkeletonListRows count={5} hasAvatar />
              </View>
            ) : athletes.length === 0 ? (
              <View style={styles.emptyState}>
                <BookOpen size={48} color={theme.colors.textMuted} weight="fill" />
                <Text style={styles.emptyTitle}>You have no athletes yet</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleAddAthletes}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyButtonText}>Add athletes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {athletes.map((athlete) => {
                  const isSelected = selectedIds.has(athlete.id);
                  const displayName = athlete.name || athlete.username;
                  return (
                    <TouchableOpacity
                      key={athlete.id}
                      style={[styles.athleteRow, isSelected && styles.athleteRowSelected]}
                      onPress={() => toggleAthlete(athlete.id)}
                      activeOpacity={0.75}
                      disabled={isSubmitting}
                    >
                      <View style={styles.checkboxWrapper}>
                        {isSelected ? (
                          <CheckCircle size={22} color={theme.colors.brandOrange} weight="fill" />
                        ) : (
                          <View style={styles.checkboxEmpty} />
                        )}
                      </View>
                      <Avatar
                        size="sm"
                        src={athlete.profileImageUrl || undefined}
                        alt={displayName}
                        fallback={(displayName || '?').substring(0, 2).toUpperCase()}
                      />
                      <View style={styles.athleteInfo}>
                        <Text style={styles.athleteName} numberOfLines={1}>
                          {displayName}
                        </Text>
                        {!!athlete.name && (
                          <Text style={styles.athleteUsername} numberOfLines={1}>
                            @{athlete.username}
                          </Text>
                        )}
                      </View>
                      <View style={styles.statusWrapper}>{renderAthleteStatus(athlete.id)}</View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {athletes.length > 0 && (
            <TouchableOpacity
              style={[
                styles.assignButton,
                (selectedCount === 0 || isSubmitting) && styles.assignButtonDisabled,
              ]}
              disabled={selectedCount === 0 || isSubmitting}
              onPress={handleAssign}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.assignButtonText}>{assignLabel}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: t.colors.backgroundSolid,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: t.colors.border,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.overlayMedium,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  headerText: {
    flex: 1,
    marginRight: 10,
  },
  headerSubtitle: {
    color: t.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    color: t.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: t.colors.darkGray,
    borderWidth: 1,
    borderColor: t.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrapper: {
    flexShrink: 1,
    minHeight: 120,
  },
  loadingWrapper: {
    paddingVertical: 12,
  },
  scroll: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingVertical: 8,
    gap: 6,
  },
  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  athleteRowSelected: {
    borderColor: t.colors.brandOrange,
    backgroundColor: t.colors.brandOrangeLight,
  },
  checkboxWrapper: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: t.colors.textMuted,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    color: t.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  athleteUsername: {
    color: t.colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  statusWrapper: {
    minWidth: 22,
    maxWidth: 140,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  errorText: {
    color: t.colors.destructive,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    color: t.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyButton: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: t.colors.brandOrange,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  assignButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    backgroundColor: t.colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonDisabled: {
    opacity: 0.45,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
