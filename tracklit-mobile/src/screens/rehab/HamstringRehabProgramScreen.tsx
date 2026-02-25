import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  CalendarBlank,
  Clock,
  Crosshair,
  Warning,
  CheckCircle,
  Play,
  Pause,
  SkipForward,
  Star,
} from 'phosphor-react-native';
import { LinearGradient } from '@/components/LinearGradient';
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
  title: 'Acute Hamstring Strain Recovery',
  duration: '4-8 weeks',
  phases: [
    {
      name: 'Phase 1: Immediate Care & Early Mobilization',
      days: 'Week 1',
      goals: ['Control pain and swelling', 'Prevent muscle shortening', 'Begin gentle movement', 'Protect healing tissue'],
      exercises: [
        {
          name: 'RICE Protocol',
          sets: 'First 24-48 hours',
          duration: 'Continuous',
          description: 'Rest, Ice (15-20 min every 2-3 hrs), Compression bandaging, Elevation when possible',
        },
        {
          name: 'NSAIDs (if cleared by physician)',
          sets: 'As prescribed',
          duration: '3-5 days max',
          description: 'Ibuprofen 400mg 3x daily with food OR Naproxen as directed to reduce inflammation',
        },
        {
          name: 'Compression Bandaging',
          sets: 'Daily application',
          duration: 'First week',
          description: 'Elastic wrap from knee to mid-thigh, snug but not cutting circulation',
        },
        {
          name: 'Very Gentle Range of Motion',
          sets: 'Every 2 hours',
          duration: '5-10 slow reps',
          description: 'Sitting knee flexion/extension within pain-free range, stop at first sign of discomfort',
        },
        {
          name: 'Isometric Glute Activation',
          sets: '3-4 times daily',
          duration: '10 x 5-second holds',
          description: 'Lying prone, gently squeeze glutes without moving legs. Unloaded muscle activation',
        },
        {
          name: 'Gentle Massage Therapy',
          sets: '2-3 times daily',
          duration: '5-10 minutes',
          description: 'Light effleurage strokes above and below injury site, avoid direct pressure on strain',
        },
      ],
    },
    {
      name: 'Phase 2: Progressive Loading & Mobility',
      days: 'Week 2',
      goals: ['Increase range of motion', 'Begin strengthening', 'Reduce bandaging dependence', 'Progress massage intensity'],
      exercises: [
        {
          name: 'Transition Bandaging',
          sets: 'As needed',
          duration: 'Reduce to activity only',
          description: 'Switch to elastic therapeutic tape or reduce compression wrap usage to activity periods only',
        },
        {
          name: 'NSAIDs Reduction',
          sets: 'Taper dosage',
          duration: 'Days 5-7',
          description: 'Gradually reduce anti-inflammatory medication as acute inflammation subsides',
        },
        {
          name: 'Active Range of Motion',
          sets: '4-5 times daily',
          duration: '2-3 sets of 15 reps',
          description: 'Seated and standing knee flexion/extension, progress range as tolerated',
        },
        {
          name: 'Isometric Hamstring Holds',
          sets: '3 times daily',
          duration: '3 sets x 10 holds, 8-10 seconds each',
          description: 'Prone position, gentle hamstring contraction at multiple knee angles',
        },
        {
          name: 'Gentle Stationary Bike',
          sets: '1-2 times daily',
          duration: '10-15 minutes',
          description: 'No resistance, focus on smooth pedaling motion within comfortable range',
        },
        {
          name: 'Progressive Massage Therapy',
          sets: 'Daily',
          duration: '10-15 minutes',
          description: 'Light cross-fiber friction massage around injury site, deeper pressure to surrounding muscles',
        },
      ],
    },
    {
      name: 'Phase 3: Dynamic Strengthening',
      days: 'Week 3-4',
      goals: ['Restore muscle strength', 'Improve eccentric control', 'Begin dynamic movement patterns'],
      exercises: [
        {
          name: 'Discontinue Bandaging',
          sets: 'Assessment day 14-18',
          duration: 'Permanent',
          description: 'Remove compression support once swelling subsided and strength improving',
        },
        {
          name: 'Eccentric Hamstring Strengthening',
          sets: 'Every other day',
          duration: '3 sets x 6-10 reps',
          description: 'Assisted Nordic curls, single-leg Romanian deadlifts with body weight',
        },
        {
          name: 'Dynamic Stretching',
          sets: '2-3 times daily',
          duration: '10-15 repetitions',
          description: 'Leg swings, walking high knees, butt kicks (controlled amplitude)',
        },
        {
          name: 'Progressive Walking/Jogging',
          sets: 'Daily',
          duration: '15-25 minutes',
          description: 'Week 3: brisk walking. Week 4: walk-jog intervals (2 min walk, 30 sec jog)',
        },
        {
          name: 'Deep Tissue Massage',
          sets: '3-4 times weekly',
          duration: '15-20 minutes',
          description: 'Deeper pressure, trigger point release, myofascial work on entire posterior chain',
        },
      ],
    },
    {
      name: 'Phase 4: Return to Sport Preparation',
      days: 'Week 5-8',
      goals: ['Sport-specific movement patterns', 'High-intensity eccentric strength', 'Injury prevention protocols'],
      exercises: [
        {
          name: 'Advanced Eccentric Training',
          sets: '3 times weekly',
          duration: '4 sets x 8-12 reps',
          description: 'Full Nordic curls, single-leg RDLs with weight, eccentric leg curls',
        },
        {
          name: 'Sprint Progression',
          sets: 'Every other day',
          duration: 'Progressive intensity',
          description: 'Week 5-6: 70% sprints x 4-6 reps. Week 7-8: 85-95% sprints x 6-8 reps',
        },
        {
          name: 'Plyometric Progression',
          sets: '2-3 times weekly',
          duration: '3-4 sets x 6-10 reps',
          description: 'Bounds, hops, reactive jumps. Progress from bilateral to unilateral',
        },
        {
          name: 'Maintenance Massage',
          sets: '1-2 times weekly',
          duration: '20-30 minutes',
          description: 'Focus on maintaining tissue quality and preventing re-injury',
        },
      ],
    },
  ],
};

const dailyPrograms = {
  week1: [
    { day: 1, focus: 'Initial Assessment & RICE', exercises: ['RICE Protocol', 'Very Gentle ROM', 'Compression Bandaging'], intensity: 'Very Light' },
    { day: 2, focus: 'Pain Management', exercises: ['Continue RICE', 'Isometric Glute Activation', 'Gentle Massage'], intensity: 'Very Light' },
    { day: 3, focus: 'Early Mobilization', exercises: ['Gentle ROM', 'Light Massage', 'NSAIDs as needed'], intensity: 'Light' },
    { day: 4, focus: 'Progressive Movement', exercises: ['Increased ROM', 'Glute Activation', 'Massage Therapy'], intensity: 'Light' },
    { day: 5, focus: 'Preparation for Phase 2', exercises: ['Active ROM', 'Pain Assessment', 'Bandaging Evaluation'], intensity: 'Light' },
    { day: 6, focus: 'Assessment Day', exercises: ['Range Testing', 'Strength Assessment', 'Plan Phase 2'], intensity: 'Assessment' },
    { day: 7, focus: 'Recovery', exercises: ['Light Massage', 'Gentle Movement', 'Rest'], intensity: 'Recovery' },
  ],
  week2: [
    { day: 8, focus: 'Phase 2 Initiation', exercises: ['Active ROM', 'Isometric Holds', 'Reduced Bandaging'], intensity: 'Light-Moderate' },
    { day: 9, focus: 'Strength Building', exercises: ['Isometric Training', 'Bike Work', 'Progressive Massage'], intensity: 'Moderate' },
    { day: 10, focus: 'Mobility Focus', exercises: ['Dynamic ROM', 'Bike Training', 'Cross-fiber Massage'], intensity: 'Moderate' },
    { day: 11, focus: 'Progressive Loading', exercises: ['Isometric Progression', 'Extended Bike', 'Deep Massage'], intensity: 'Moderate' },
    { day: 12, focus: 'Strength Assessment', exercises: ['Strength Testing', 'ROM Evaluation', 'Massage'], intensity: 'Moderate' },
    { day: 13, focus: 'Phase 3 Preparation', exercises: ['Advanced ROM', 'Strength Prep', 'Assessment'], intensity: 'Moderate' },
    { day: 14, focus: 'Recovery & Evaluation', exercises: ['Light Activity', 'Massage', 'Phase 3 Planning'], intensity: 'Recovery' },
  ],
};

export const HamstringRehabProgramScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showDailyPrograms, setShowDailyPrograms] = useState(false);

  const isProOrStar = !!(user as any)?.isPremium || user?.role === 'star';
  const activePhaseIndex = currentPhase < 0 ? 0 : currentPhase;

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ programId?: number | string }>('/api/rehab/assign-program', {
        method: 'POST',
        data: {
          programType: 'acute-hamstring',
          programData: rehabProgram,
          dailyPrograms,
          userId: user?.id,
        },
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert(
        'Rehab Program Assigned!',
        'Your hamstring recovery program has been assigned and is ready in Programs and Practice.',
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

  const handleSkipAhead = (phaseIndex: number) => {
    setCurrentPhase(phaseIndex);
    Alert.alert('Phase Updated', `Moved to ${rehabProgram.phases[phaseIndex].name}. Please consult your physician or coach before advancing phases.`);
  };

  return (
    <WebScreen backgroundColor="#010a18" contentStyle={{ paddingTop: theme.spacing.xl }}>
      <View style={styles.headerRow}>
        <WebButton variant="ghost" size="sm" onPress={() => navigation.goBack()}>
          <ArrowLeft size={14} color={theme.colors.foreground} />
          <Text variant="small" weight="medium" color="foreground">
            Back to Rehab
          </Text>
        </WebButton>
        <View style={styles.divider} />
        <View style={styles.badgeRed}>
          <Text variant="small" color="destructive">
            Acute Muscle Injury
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
            <Crosshair size={14} color={theme.colors.foreground} />
            <Text variant="small" color="muted">4 Progressive Phases</Text>
          </View>
          <View style={styles.metaItem}>
            <CalendarBlank size={14} color={theme.colors.foreground} />
            <Text variant="small" color="muted">Daily Guided Exercises</Text>
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
              This will replace your current training program with this rehabilitation protocol until recovery is complete.
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

      {isProOrStar && (
        <LinearGradient
          colors={['rgba(88, 28, 135, 0.2)', 'rgba(30, 64, 175, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.proCard}
        >
          <View style={styles.proHeader}>
            <View style={styles.proTitleRow}>
              <Star size={16} color="#c084fc" />
              <Text variant="small" weight="medium" color="accent">
                Pro/Star Daily Programs
              </Text>
            </View>
            <WebButton
              variant="outline"
              size="sm"
              onPress={() => setShowDailyPrograms((prev) => !prev)}
            >
              <Text variant="small" weight="medium" color="foreground">
                {showDailyPrograms ? 'Hide' : 'Show'} Daily Programs
              </Text>
            </WebButton>
          </View>
          {showDailyPrograms && (
            <View style={styles.dailyGrid}>
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground" style={{ marginBottom: theme.spacing.sm }}>
                  Week 1 - Initial Recovery
                </Text>
                <View style={styles.dailyList}>
                  {dailyPrograms.week1.map((day) => (
                    <View key={day.day} style={styles.dailyCard}>
                      <View style={styles.dailyHeader}>
                        <Text variant="small" weight="medium" color="foreground">
                          Day {day.day}
                        </Text>
                        <View style={styles.intensityPill}>
                          <Text variant="small" color="accent">{day.intensity}</Text>
                        </View>
                      </View>
                      <Text variant="small" color="muted">
                        {day.focus}
                      </Text>
                      <Text variant="small" color="muted">
                        {day.exercises.join(' • ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium" color="foreground" style={{ marginBottom: theme.spacing.sm }}>
                  Week 2 - Progressive Loading
                </Text>
                <View style={styles.dailyList}>
                  {dailyPrograms.week2.map((day) => (
                    <View key={day.day} style={styles.dailyCard}>
                      <View style={styles.dailyHeader}>
                        <Text variant="small" weight="medium" color="foreground">
                          Day {day.day}
                        </Text>
                        <View style={styles.intensityPillBlue}>
                          <Text variant="small" color="accent">{day.intensity}</Text>
                        </View>
                      </View>
                      <Text variant="small" color="muted">
                        {day.focus}
                      </Text>
                      <Text variant="small" color="muted">
                        {day.exercises.join(' • ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </LinearGradient>
      )}

      <WebCard tone="muted" padding={theme.spacing.lg} style={styles.warningCard}>
        <View style={styles.warningRow}>
          <Warning size={16} color="#f59e0b" />
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="semiBold" color="warning">
              Important Medical Disclaimer
            </Text>
            <Text variant="small" color="warning">
              This program is for educational purposes and should complement, not replace, professional medical care. Stop exercises if pain increases. Consult your healthcare provider before starting this program, especially for Grade 2-3 strains or if symptoms persist beyond expected timeframes.
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
                  {index > currentPhase && (
                    <WebButton variant="outline" size="sm" onPress={() => handleSkipAhead(index)}>
                      <SkipForward size={12} color={theme.colors.foreground} />
                      <Text variant="small" color="foreground">
                        Skip Ahead
                      </Text>
                    </WebButton>
                  )}
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
                      Daily Exercises:
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
          Track your progress through each phase of recovery
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
            This is a visual representation. Your actual recovery may vary based on individual factors.
          </Text>
        </View>
      </WebCard>
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  divider: { width: 1, height: 20, backgroundColor: '#4b5563' },
  badgeRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
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
  proCard: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  proHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  proTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  dailyGrid: { flexDirection: 'column', gap: theme.spacing.md },
  dailyList: { gap: theme.spacing.sm },
  dailyCard: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  intensityPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(126, 34, 206, 0.3)',
  },
  intensityPillBlue: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
  },
  warningCard: { borderColor: 'rgba(245, 158, 11, 0.3)', borderWidth: 1 },
  warningRow: { flexDirection: 'row', gap: theme.spacing.md },
  phaseList: { gap: theme.spacing.md },
  phaseCard: { borderColor: '#374151', borderWidth: 1 },
  phaseCardActive: { borderColor: 'rgba(59, 130, 246, 0.5)', backgroundColor: 'rgba(30, 64, 175, 0.2)' },
  phaseHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md, alignItems: 'flex-start' },
  phaseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  phaseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseNumberActive: { backgroundColor: '#3b82f6' },
  phaseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: '45%',
  },
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

