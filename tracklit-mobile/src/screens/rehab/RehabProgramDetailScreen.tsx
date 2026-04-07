import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  CalendarBlank,
  Crosshair,
  CheckCircle,
  CaretDown,
  CaretUp,
  ArrowRight,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { LinearGradient } from '@/components/LinearGradient';
import { ScreenTabBar } from '@/components/ScreenTabBar';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { REHAB_PROGRAMS } from '@/data/rehabPrograms';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
type RouteProps = RouteProp<RootStackParamList, 'RehabProgramDetail'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;


export const RehabProgramDetailScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteProps>();
  const { programKey, programName, categoryLabel } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const program = REHAB_PROGRAMS[programKey];

  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({ 0: true });

  const togglePhase = (index: number) => {
    setExpandedPhases((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ programId?: number | string }>('/api/rehab/assign-program', {
        method: 'POST',
        data: {
          programType: programKey,
          programData: program,
          userId: user?.id,
        },
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['my-programs'] });
      Alert.alert(
        'Rehab Program Assigned!',
        `Your ${programName} rehabilitation program has been assigned and is ready in Programs and Practice.`,
        [
          {
            text: 'View Program',
            onPress: () => {
              if (response?.programId !== undefined) {
                navigation.navigate('ProgramDetail', { id: response.programId });
              } else {
                navigation.navigate('MainTabs', { screen: 'Training' } as never);
              }
            },
          },
          { text: 'Close', style: 'cancel' },
        ],
      );
    },
    onError: () => {
      Alert.alert('Assignment Failed', 'Unable to assign the program. Please try again.');
    },
  });

  if (!program) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <ArrowLeft size={18} color="#FFFFFF" weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{programName}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{categoryLabel}</Text>
          </View>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonDesc}>This program is being developed by our sports medicine team. Check back soon.</Text>
        </View>
        <ScreenTabBar />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#FFFFFF" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{programName} Rehab</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{categoryLabel}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.programTitle}>{program.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={14} color={theme.colors.textMuted} weight="fill" />
              <Text style={styles.metaText}>{program.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Crosshair size={14} color={theme.colors.textMuted} weight="fill" />
              <Text style={styles.metaText}>{program.phases.length} Phases</Text>
            </View>
            <View style={styles.metaItem}>
              <CalendarBlank size={14} color={theme.colors.textMuted} weight="fill" />
              <Text style={styles.metaText}>Guided Recovery</Text>
            </View>
          </View>
        </View>

        <LinearGradient
          colors={['rgba(20, 83, 45, 0.25)', 'rgba(30, 64, 175, 0.25)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.assignCard}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.assignTitle}>Assign This Program</Text>
            <Text style={styles.assignDesc}>
              This will replace your current training program with this rehabilitation protocol until recovery is complete.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.assignBtn, assignProgramMutation.isPending && { opacity: 0.6 }]}
            onPress={() => assignProgramMutation.mutate()}
            disabled={assignProgramMutation.isPending}
            activeOpacity={0.7}
          >
            <Text style={styles.assignBtnText}>
              {assignProgramMutation.isPending ? 'Assigning...' : 'Assign'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.phasesSection}>
          <Text style={styles.sectionLabel}>Recovery Phases</Text>
          {program.phases.map((phase, phaseIndex) => {
            const isExpanded = !!expandedPhases[phaseIndex];
            return (
              <View key={phaseIndex} style={styles.phaseCard}>
                <TouchableOpacity
                  style={styles.phaseHeader}
                  onPress={() => togglePhase(phaseIndex)}
                  activeOpacity={0.7}
                >
                  <View style={styles.phaseNumberCircle}>
                    <Text style={styles.phaseNumber}>{phaseIndex + 1}</Text>
                  </View>
                  <View style={styles.phaseTitleBlock}>
                    <Text style={styles.phaseName}>{phase.name}</Text>
                    <Text style={styles.phaseDays}>{phase.days}</Text>
                  </View>
                  {isExpanded
                    ? <CaretUp size={16} color={theme.colors.textMuted} weight="bold" />
                    : <CaretDown size={16} color={theme.colors.textMuted} weight="bold" />
                  }
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.phaseBody}>
                    <View style={styles.goalsBlock}>
                      <Text style={styles.goalsLabel}>Goals</Text>
                      {phase.goals.map((goal, gi) => (
                        <View key={gi} style={styles.goalRow}>
                          <CheckCircle size={13} color={theme.colors.success} weight="fill" />
                          <Text style={styles.goalText}>{goal}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.exercisesBlock}>
                      <Text style={styles.exercisesLabel}>Exercises</Text>
                      {phase.exercises.map((exercise, ei) => (
                        <View key={ei} style={styles.exerciseCard}>
                          <View style={styles.exerciseTop}>
                            <View style={styles.exerciseIndexDot} />
                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                          </View>
                          <View style={styles.exerciseMeta}>
                            <View style={styles.exerciseMetaTag}>
                              <Text style={styles.exerciseMetaTagText}>{exercise.sets}</Text>
                            </View>
                            <ArrowRight size={10} color={theme.colors.textMuted} />
                            <View style={styles.exerciseMetaTag}>
                              <Text style={styles.exerciseMetaTagText}>{exercise.duration}</Text>
                            </View>
                          </View>
                          <Text style={styles.exerciseDesc}>{exercise.description}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <ScreenTabBar />
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.backgroundSolid },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: t.colors.overlaySubtle,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  badge: {
    backgroundColor: t.colors.brandOrangeLight,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: t.colors.brandOrange,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  titleBlock: {
    gap: 10,
    paddingTop: 4,
  },
  programTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: t.colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: t.colors.textMuted,
    fontWeight: '500',
  },
  assignCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(34,197,94,0.2)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  assignTitle: { fontSize: 14, fontWeight: '700', color: t.colors.textPrimary },
  assignDesc: { fontSize: 11, color: t.colors.textMuted, lineHeight: 16 },
  assignBtn: {
    backgroundColor: t.colors.brandOrange,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  assignBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },
  phasesSection: {
    gap: 10,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: t.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  phaseCard: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
    overflow: 'hidden',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  phaseNumberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: t.colors.brandOrangeLight,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: t.colors.brandOrange,
  },
  phaseTitleBlock: {
    flex: 1,
    gap: 2,
  },
  phaseName: {
    fontSize: 14,
    fontWeight: '700',
    color: t.colors.textPrimary,
    lineHeight: 20,
  },
  phaseDays: {
    fontSize: 12,
    color: t.colors.textMuted,
    fontWeight: '500',
  },
  phaseBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 14,
    borderTopWidth: 0.5,
    borderTopColor: t.colors.overlayLight,
    paddingTop: 14,
  },
  goalsBlock: {
    gap: 6,
  },
  goalsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: t.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  goalText: {
    flex: 1,
    fontSize: 13,
    color: t.colors.textSecondary,
    lineHeight: 19,
  },
  exercisesBlock: {
    gap: 8,
  },
  exercisesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: t.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  exerciseCard: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 10,
    padding: 12,
    gap: 7,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
  },
  exerciseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseIndexDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: t.colors.brandOrange,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  exerciseMetaTag: {
    backgroundColor: t.colors.overlaySubtle,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
  },
  exerciseMetaTagText: {
    fontSize: 11,
    color: t.colors.textSecondary,
    fontWeight: '600',
  },
  exerciseDesc: {
    fontSize: 12,
    color: t.colors.textMuted,
    lineHeight: 18,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: t.colors.textPrimary,
    textAlign: 'center',
  },
  comingSoonDesc: {
    fontSize: 14,
    color: t.colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
