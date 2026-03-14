import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import { ClipboardText, CheckCircle, CaretDown } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

interface Program {
  id: number | string;
  title: string;
  description?: string;
  category?: string;
  duration?: string;
}

interface PurchasedProgramItem {
  id: number | string;
  programId: number | string;
  program: Program;
  assignerName?: string;
}

interface ProgramPickerDropdownProps {
  programs: PurchasedProgramItem[];
  selectedProgramId?: number | string | null;
  onSelect: (program: PurchasedProgramItem) => void;
  isLoading?: boolean;
}

interface ProgramPickerModalProps extends ProgramPickerDropdownProps {
  visible?: boolean;
  onClose: () => void;
}

const sortPrograms = (programs: PurchasedProgramItem[]) =>
  [...programs].sort((a, b) => {
    const titleA = (a.program?.title || '').toLowerCase();
    const titleB = (b.program?.title || '').toLowerCase();
    return titleA.localeCompare(titleB);
  });

export const ProgramPickerDropdown: React.FC<ProgramPickerDropdownProps> = ({
  programs,
  selectedProgramId,
  onSelect,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  const sortedPrograms = useMemo(() => sortPrograms(programs), [programs]);

  const selectedTitle = useMemo(() => {
    if (!selectedProgramId || programs.length === 0) return 'Assign Program';
    const match = programs.find((p) => String(p.id) === String(selectedProgramId));
    return match?.program?.title || 'Assign Program';
  }, [selectedProgramId, programs]);

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const maxHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280],
  });

  const handleSelect = (assignment: PurchasedProgramItem) => {
    onSelect(assignment);
    setIsOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsOpen(!isOpen)}
          activeOpacity={0.7}
        >
          <ClipboardText size={14} color={theme.colors.primaryForeground} weight="fill" />
          <Text variant="small" weight="medium" color="primary-foreground" numberOfLines={1} style={styles.buttonLabel}>
            {selectedTitle}
          </Text>
          <CaretDown
            size={12}
            color={theme.colors.primaryForeground}
            weight="fill"
            style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.dropdownContainer, { maxHeight }]}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {isLoading ? (
            <View style={styles.loadingState}>
              <Text variant="small" color="muted">Loading programs...</Text>
            </View>
          ) : sortedPrograms.length > 0 ? (
            <View style={styles.programList}>
              {sortedPrograms.map((assignment, idx) => {
                const isSelected = String(selectedProgramId) === String(assignment.id);
                return (
                  <TouchableOpacity
                    key={`${assignment.id}-${assignment.programId}-${idx}`}
                    style={[styles.programRow, isSelected && styles.programRowSelected]}
                    onPress={() => handleSelect(assignment)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.programIcon, isSelected && styles.programIconSelected]}>
                      <ClipboardText
                        size={14}
                        color={isSelected ? 'white' : 'rgba(255,255,255,0.7)'}
                        weight="fill"
                      />
                    </View>
                    <View style={styles.programInfo}>
                      <Text
                        variant="small"
                        weight={isSelected ? 'semiBold' : 'medium'}
                        color="foreground"
                        numberOfLines={1}
                      >
                        {assignment.program?.title || 'Unnamed Program'}
                      </Text>
                      <Text variant="caption" color="muted" numberOfLines={1}>
                        {assignment.program?.category || 'Training Program'}
                        {assignment.program?.duration ? ` • ${assignment.program.duration}` : ''}
                      </Text>
                    </View>
                    {isSelected && <CheckCircle size={18} color={theme.colors.primary} weight="fill" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="small" color="muted">No programs assigned yet</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

export const ProgramPickerModal: React.FC<ProgramPickerModalProps> = ({
  visible = true,
  onClose,
  programs,
  selectedProgramId,
  onSelect,
  isLoading,
}) => {
  const sortedPrograms = useMemo(() => sortPrograms(programs), [programs]);

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text variant="body" weight="semiBold" color="foreground">
            Your Programs
          </Text>
          <Text variant="small" color="muted" style={styles.modalSubtitle}>
            Select a training program to view or switch between your assigned programs.
          </Text>

          {isLoading ? (
            <View style={styles.loadingState}>
              <Text variant="small" color="muted">Loading programs...</Text>
            </View>
          ) : sortedPrograms.length > 0 ? (
            <View style={styles.programList}>
              {sortedPrograms.map((assignment, idx) => {
                const isSelected = String(selectedProgramId) === String(assignment.id);
                return (
                  <TouchableOpacity
                    key={`${assignment.id}-${assignment.programId}-${idx}`}
                    style={[styles.programRow, isSelected && styles.programRowSelected]}
                    onPress={() => onSelect(assignment)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.programIcon, isSelected && styles.programIconSelected]}>
                      <ClipboardText
                        size={14}
                        color={isSelected ? 'white' : 'rgba(255,255,255,0.7)'}
                        weight="fill"
                      />
                    </View>
                    <View style={styles.programInfo}>
                      <Text
                        variant="small"
                        weight={isSelected ? 'semiBold' : 'medium'}
                        color="foreground"
                        numberOfLines={1}
                      >
                        {assignment.program?.title || 'Unnamed Program'}
                      </Text>
                      <Text variant="caption" color="muted" numberOfLines={1}>
                        {assignment.program?.category || 'Training Program'}
                        {assignment.program?.duration ? ` • ${assignment.program.duration}` : ''}
                      </Text>
                    </View>
                    {isSelected ? <CheckCircle size={18} color={theme.colors.primary} weight="fill" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="small" color="muted">No programs assigned yet</Text>
            </View>
          )}

          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose} activeOpacity={0.7}>
            <Text variant="small" weight="semiBold" color="foreground">
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: theme.spacing.lg,
  },
  modalSubtitle: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  buttonLabel: {
    maxWidth: 180,
  },
  dropdownContainer: {
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  scroll: {
    maxHeight: 280,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  programList: {
    padding: theme.spacing.xs,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 8,
  },
  programRowSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  programIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programIconSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  programInfo: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  modalCloseButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});
