import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
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

interface ProgramPickerModalProps {
  visible: boolean;
  onClose: () => void;
  programs: PurchasedProgramItem[];
  selectedProgramId?: number | string | null;
  onSelect: (program: PurchasedProgramItem) => void;
  isLoading?: boolean;
}

export const ProgramPickerModal: React.FC<ProgramPickerModalProps> = ({
  visible,
  onClose,
  programs,
  selectedProgramId,
  onSelect,
  isLoading,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <LinearGradient
          colors={['#1e40af', '#c084fc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modalCard}
        >
          <View style={styles.header}>
            <Text variant="h4" weight="bold" color="primary-foreground">
              Your Programs
            </Text>
            <Text variant="small" color="primary-foreground" style={styles.subtitle}>
              Select a training program to view or switch between your assigned programs.
            </Text>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingState}>
                <Text variant="body" color="primary-foreground">
                  Loading programs...
                </Text>
              </View>
            ) : programs.length > 0 ? (
              <View style={styles.programList}>
                {programs.map((assignment) => {
                  const isSelected = selectedProgramId === assignment.id;
                  return (
                    <TouchableOpacity
                      key={assignment.id}
                      style={[styles.programRow, isSelected && styles.programRowSelected]}
                      onPress={() => onSelect(assignment)}
                    >
                      <View style={[styles.programIcon, isSelected && styles.programIconSelected]}>
                        <FontAwesome5
                          name="clipboard-list"
                          size={16}
                          color={isSelected ? 'white' : 'rgba(255,255,255,0.8)'}
                          solid
                        />
                      </View>
                      <View style={styles.programInfo}>
                        <Text
                          variant="body"
                          weight="medium"
                          color="primary-foreground"
                          numberOfLines={1}
                        >
                          {assignment.program?.title || 'Unnamed Program'}
                        </Text>
                        <Text variant="small" color="primary-foreground" style={styles.programMeta}>
                          {assignment.program?.category || 'Training Program'}
                          {assignment.program?.duration ? ` • ${assignment.program.duration}` : ''}
                        </Text>
                      </View>
                      {isSelected && <View style={styles.selectedDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <FontAwesome5 name="clipboard-list" size={36} color="rgba(255,255,255,0.6)" solid />
                <Text variant="body" color="primary-foreground" style={styles.emptyTitle}>
                  No programs assigned yet
                </Text>
                <Text variant="small" color="primary-foreground" style={styles.emptySubtitle}>
                  Your coach will assign training programs to your account.
                </Text>
              </View>
            )}
          </ScrollView>

          <Card style={styles.footerCard}>
            <CardContent style={styles.closeContent}>
              <Button variant="outline" size="md" onPress={onClose} title="Close" />
            </CardContent>
          </Card>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    borderRadius: theme.borderRadius.webCard,
    padding: theme.spacing.lg,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    opacity: 0.8,
  },
  scroll: {
    flexShrink: 1,
    marginTop: theme.spacing.sm,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  programList: {
    gap: theme.spacing.sm,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.webCard,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  programRowSelected: {
    borderColor: '#60a5fa',
    backgroundColor: 'rgba(37, 99, 235, 0.85)',
  },
  programIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programIconSelected: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  programInfo: {
    flex: 1,
  },
  programMeta: {
    opacity: 0.7,
    marginTop: theme.spacing.xs,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(96, 165, 250, 1)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    marginTop: theme.spacing.md,
  },
  emptySubtitle: {
    marginTop: theme.spacing.xs,
    opacity: 0.7,
    textAlign: 'center',
  },
  footerCard: {
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 0,
  },
  closeContent: {
    alignItems: 'center',
  },
});

