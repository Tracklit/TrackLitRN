import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
} from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { WebScreen } from '@/components/web/Screen';
import { WebCard } from '@/components/web/Card';
import { WebButton } from '@/components/web/Button';
import { WebBadge } from '@/components/web/Badge';
import { WebProgress } from '@/components/web/Progress';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const rehabProgram = {
  title: 'Chronic Foot Pain & Plantar Fasciitis Recovery',
  duration: '6-12 weeks',
  phases: [
    {
      name: 'Phase 1: Pain Management & Mobility',
      days: 'Weeks 1-2',
      goals: ['Reduce pain and inflammation', 'Improve ankle mobility', 'Begin gentle strengthening'],
      exercises: [
        {
          name: 'Ice Massage',
          sets: '2-3 times daily',
          duration: '5-10 minutes',
          description: 'Roll frozen water bottle under foot to reduce inflammation',
        },
        {
          name: 'Towel Stretch',
          sets: '3 sets',
          duration: '30 seconds hold',
          description: 'Pull toes toward shin using towel, especially in morning',
        },
        {
          name: 'Alphabet Draws',
          sets: '2-3 sets',
          duration: 'Full alphabet',
          description: 'Draw letters with big toe to improve ankle mobility',
        },
        {
          name: 'Marble Pickups',
          sets: '2 sets',
          duration: '10-15 marbles',
          description: 'Strengthen intrinsic foot muscles by picking up marbles with toes',
        },
      ],
    },
    {
      name: 'Phase 2: Strengthening & Flexibility',
      days: 'Weeks 3-6',
      goals: ['Strengthen foot and calf muscles', 'Improve flexibility', 'Correct movement patterns'],
      exercises: [
        {
          name: 'Calf Raises',
          sets: '3 sets',
          duration: '12-15 reps',
          description: 'Both double and single leg variations, progress to eccentric emphasis',
        },
        {
          name: 'Resistance Band Exercises',
          sets: '2-3 sets',
          duration: '10-12 reps each direction',
          description: 'Plantar flexion, dorsiflexion, inversion, eversion',
        },
        {
          name: 'Wall Calf Stretch',
          sets: '3 sets each leg',
          duration: '45 seconds',
          description: 'Both straight knee and bent knee variations',
        },
        {
          name: 'Short Foot Exercise',
          sets: '3 sets',
          duration: '10 second holds',
          description: 'Create arch by pulling toes toward heel without curling toes',
        },
        {
          name: 'Balance Training',
          sets: '3 sets',
          duration: '30-60 seconds',
          description: 'Single leg balance, progress to eyes closed and unstable surfaces',
        },
      ],
    },
    {
      name: 'Phase 3: Dynamic Strengthening',
      days: 'Weeks 7-10',
      goals: ['Dynamic stability', 'Sport-specific movements', 'Load tolerance'],
      exercises: [
        {
          name: 'Hopping Progressions',
          sets: '2-3 sets',
          duration: '10-15 reps',
          description: 'Forward/backward, side-to-side, progress to single leg',
        },
        {
          name: 'Plyometric Exercises',
          sets: '2-3 sets',
          duration: '8-12 reps',
          description: 'Jump squats, lateral bounds, controlled landing practice',
        },
        {
          name: 'Agility Ladder Drills',
          sets: '3-4 sets',
          duration: '30 seconds',
          description: 'Various footwork patterns to improve coordination',
        },
        {
          name: 'Hill Walking',
          sets: '1 session',
          duration: '15-20 minutes',
          description: 'Uphill walking to strengthen posterior chain',
        },
        {
          name: 'Sport-Specific Drills',
          sets: 'Gradually increase',
          duration: 'Variable',
          description: 'Begin sport-specific movements at 50-70% intensity',
        },
      ],
    },
    {
      name: 'Phase 4: Return to Full Activity',
      days: 'Weeks 11-12+',
      goals: ['Full sport participation', 'Injury prevention', 'Long-term maintenance'],
      exercises: [
        {
          name: 'Running Progression',
          sets: 'Build gradually',
          duration: 'Week by week increase',
          description: 'Start with 50% pace/distance, increase by 10% weekly',
        },
        {
          name: 'Cutting and Direction Changes',
          sets: 'Multiple sets',
          duration: 'Sport-specific',
          description: 'Progress from controlled to reactive movements',
        },
        {
          name: 'Maintenance Strengthening',
          sets: '3 times/week',
          duration: 'Ongoing',
          description: 'Continue calf raises, balance training, and flexibility',
        },
        {
          name: 'Proper Footwear Assessment',
          sets: 'Ongoing',
          duration: 'Daily',
          description: 'Ensure appropriate shoes for activities and foot mechanics',
        },
      ],
    },
  ],
};

export const FootRehabProgramScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState(0);
  const activePhaseIndex = currentPhase < 0 ? 0 : currentPhase;

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ programId?: number | string }>('/api/rehab/assign-program', {
        method: 'POST',
        data: {
          programType: 'chronic-foot',
          programData: rehabProgram,
          userId: user?.id,
        },
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert(
        'Rehab Program Assigned!',
        'Your foot recovery program has been assigned and is ready in Programs and Practice.',
        [
          {
            text: 'View Program',
            onPress: () => {
              if (response?.programId !== undefined) {
                navigation.navigate('ProgramDetail', { id: response.programId });
              } else {
                navigation.navigate('MainTabs', { screen: 'Programs' } as never);
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

  return (
    <WebScreen backgroundColor="#010a18" contentStyle={{ paddingTop: theme.spacing.xl }}>
      <View style={styles.headerRow}>
        <WebButton variant="ghost" size="sm" onPress={() => navigation.navigate('Rehab')}>
          <ArrowLeft size={14} color={theme.colors.foreground} />
          <Text variant="small" weight="medium" color="foreground">
            Back to Rehab
          </Text>
        </WebButton>
        <View style={styles.divider} />
        <View style={styles.badgePurple}>
          <Text variant="small" color="accent">
            Chronic Injury
          </Text>
        </View>
      </View>

      <View style={styles.titleBlock}>
        <Text variant="h1" weight="bold" color="foreground">
          {rehabProgram.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={14} color={theme.colors.foreground} />
            <Text variant="small" color="muted">Duration: {rehabProgram.duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <Target size={14} color={theme.colors.foreground} />
            <Text variant="small" color="muted">4 Progressive Phases</Text>
          </View>
          <View style={styles.metaItem}>
            <Calendar size={14} color={theme.colors.foreground} />
            <Text variant="small" color="muted">Evidence-Based Protocol</Text>
          </View>
        </View>
      </View>

      <LinearGradient
        colors={['rgba(20, 83, 45, 0.2)', 'rgba(30, 64, 175, 0.2)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.assignCard}
      >
        <View style={styles.assignRow}>
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="semiBold" color="foreground">
              Assign This Program
            </Text>
            <Text variant="small" color="muted">
              This comprehensive program will guide your recovery and prevent future foot issues.
            </Text>
          </View>
          <WebButton
            onPress={() => assignProgramMutation.mutate()}
            disabled={assignProgramMutation.isPending}
          >
            {assignProgramMutation.isPending ? 'Assigning...' : 'Assign Program'}
          </WebButton>
        </View>
      </LinearGradient>

      <WebCard tone="muted" padding={theme.spacing.lg} style={styles.warningCard}>
        <View style={styles.warningRow}>
          <AlertTriangle size={16} color="#f59e0b" />
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="semiBold" color="warning">
              Important Considerations
            </Text>
            <Text variant="small" color="warning">
              Chronic foot conditions often require patience and consistency. If pain persists or worsens despite following this program, consider consulting a podiatrist or sports medicine physician for additional evaluation. Proper footwear and biomechanical assessment may be necessary for optimal outcomes.
            </Text>
          </View>
        </View>
      </WebCard>

      <View style={styles.phaseList}>
        {rehabProgram.phases.map((phase, index) => {
          const isActive = index === currentPhase;
          return (
            <WebCard
              key={phase.name}
              tone="muted"
              padding={theme.spacing.lg}
              style={[styles.phaseCard, isActive && styles.phaseCardActive]}
            >
              <View style={styles.phaseHeader}>
                <View>
                  <View style={styles.phaseTitleRow}>
                    <View style={[styles.phaseNumber, isActive && styles.phaseNumberActive]}>
                      <Text variant="small" weight="bold" color="foreground">
                        {index + 1}
                      </Text>
                    </View>
                    <Text variant="body" weight="semiBold" color="foreground">
                      {phase.name}
                    </Text>
                  </View>
                  <Text variant="small" color="muted" style={{ marginLeft: 36 }}>
                    {phase.days}
                  </Text>
                </View>
                <View style={styles.phaseActions}>
                  <WebButton
                    variant="ghost"
                    size="sm"
                    onPress={() => setCurrentPhase(isActive ? -1 : index)}
                  >
                  {isActive ? <Pause size={14} color={theme.colors.foreground} /> : <Play size={14} color={theme.colors.foreground} />}
                  </WebButton>
                </View>
              </View>

              {isActive && (
                <View style={styles.phaseContent}>
                  <View style={styles.phaseSection}>
                    <Text variant="small" weight="medium" color="foreground">
                      Phase Goals:
                    </Text>
                    {phase.goals.map((goal) => (
                      <View key={goal} style={styles.goalRow}>
                        <CheckCircle size={12} color="#16a34a" />
                        <Text variant="small" color="muted">
                          {goal}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.phaseSection}>
                    <Text variant="small" weight="medium" color="foreground">
                      Recommended Exercises:
                    </Text>
                    <View style={styles.exerciseList}>
                      {phase.exercises.map((exercise) => (
                        <View key={exercise.name} style={styles.exerciseCard}>
                          <View style={styles.exerciseHeader}>
                            <Text variant="small" weight="semiBold" color="foreground" style={styles.exerciseTitle}>
                              {exercise.name}
                            </Text>
                            <WebBadge variant="outline" style={styles.exerciseBadge}>
                              {exercise.sets} • {exercise.duration}
                            </WebBadge>
                          </View>
                          <Text variant="small" color="muted">
                            {exercise.description}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </WebCard>
          );
        })}
      </View>

      <WebCard tone="muted" padding={theme.spacing.lg}>
        <Text variant="body" weight="semiBold" color="foreground">
          Recovery Progress
        </Text>
        <Text variant="small" color="muted">
          Chronic conditions require patience - progress may be gradual but consistent
        </Text>
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
          <View style={styles.progressHeader}>
            <Text variant="small" color="muted">
              Phase {activePhaseIndex + 1} of {rehabProgram.phases.length}
            </Text>
            <Text variant="small" color="muted">
              {Math.round(((activePhaseIndex + 1) / rehabProgram.phases.length) * 100)}% Complete
            </Text>
          </View>
          <WebProgress value={((activePhaseIndex + 1) / rehabProgram.phases.length) * 100} />
          <Text variant="small" color="muted">
            Recovery timeline varies with chronic conditions. Consistency is more important than speed.
          </Text>
        </View>
      </WebCard>
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  divider: { width: 1, height: 20, backgroundColor: '#4b5563' },
  badgePurple: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  titleBlock: { gap: theme.spacing.md },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  assignCard: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    padding: theme.spacing.lg,
  },
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  warningCard: { borderColor: 'rgba(245, 158, 11, 0.3)', borderWidth: 1 },
  warningRow: { flexDirection: 'row', gap: theme.spacing.md },
  phaseList: { gap: theme.spacing.md },
  phaseCard: { borderColor: '#374151', borderWidth: 1 },
  phaseCardActive: { borderColor: 'rgba(124, 58, 237, 0.5)', backgroundColor: 'rgba(124, 58, 237, 0.2)' },
  phaseHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md, alignItems: 'flex-start' },
  phaseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: '45%',
  },
  phaseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  phaseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseNumberActive: { backgroundColor: theme.colors.primary },
  phaseContent: { marginTop: theme.spacing.md, gap: theme.spacing.md },
  phaseSection: { gap: theme.spacing.sm },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  exerciseList: { gap: theme.spacing.sm },
  exerciseCard: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#4b5563',
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  exerciseTitle: { flex: 1, flexWrap: 'wrap' },
  exerciseBadge: { maxWidth: '60%', alignSelf: 'flex-start' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
});

