import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { ClipboardText, CheckCircle, CaretDown, Link } from 'phosphor-react-native';

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

export const ProgramPickerDropdown: React.FC<ProgramPickerDropdownProps> = ({
  programs,
  selectedProgramId,
  onSelect,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  const sortedPrograms = useMemo(() => {
    return [...programs].sort((a, b) => {
      const titleA = (a.program?.title || '').toLowerCase();
      const titleB = (b.program?.title || '').toLowerCase();
      return titleA.localeCompare(titleB);
    });
  }, [programs]);

  const selectedProgram = useMemo(() => {
    if (!selectedProgramId || programs.length === 0) return null;
    return programs.find((p) => String(p.id) === String(selectedProgramId)) ?? null;
  }, [selectedProgramId, programs]);

  const selectedTitle = selectedProgram?.program?.title ?? null;

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
      <TouchableOpacity
        style={[styles.dropdownButton, isOpen && styles.dropdownButtonOpen]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownButtonLeft}>
          <View style={[styles.iconCircle, selectedTitle && styles.iconCircleActive]}>
            <Link size={14} color={selectedTitle ? '#FF7A00' : 'rgba(255,255,255,0.5)'} weight="fill" />
          </View>
          <View style={styles.buttonTextGroup}>
            {selectedTitle ? (
              <>
                <Text style={styles.buttonAttachedLabel}>Attached program</Text>
                <Text style={styles.buttonProgramName} numberOfLines={1}>{selectedTitle}</Text>
              </>
            ) : (
              <Text style={styles.buttonPlaceholder}>Attach a program...</Text>
            )}
          </View>
        </View>
        <CaretDown
          size={14}
          color="rgba(255,255,255,0.4)"
          weight="fill"
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

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
                        color={isSelected ? '#FF7A00' : 'rgba(255,255,255,0.7)'}
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
                    {isSelected && <CheckCircle size={18} color="#FF7A00" weight="fill" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="small" color="muted">No programs available to attach</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownButtonOpen: {
    borderColor: 'rgba(255, 122, 0, 0.4)',
    backgroundColor: 'rgba(255, 122, 0, 0.06)',
  },
  dropdownButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(255,122,0,0.12)',
  },
  buttonTextGroup: {
    flex: 1,
    gap: 1,
  },
  buttonPlaceholder: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '400',
  },
  buttonAttachedLabel: {
    fontSize: 10,
    color: '#FF7A00',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buttonProgramName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  dropdownContainer: {
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
    borderRadius: 12,
    backgroundColor: '#13151E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
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
    backgroundColor: 'rgba(255, 122, 0, 0.2)',
  },
  programInfo: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
});
