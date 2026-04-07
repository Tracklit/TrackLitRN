import React, { useState } from 'react';
import { Alert, StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { ScreenTabBar } from '@/components/ScreenTabBar';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
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
        { name: 'RICE Protocol', sets: 'First 24-48 hours', duration: 'Continuous', description: 'Rest, Ice (15-20 min every 2-3 hrs), Compression bandaging, Elevation when possible' },
        { name: 'NSAIDs (if cleared by physician)', sets: 'As prescribed', duration: '3-5 days max', description: 'Ibuprofen 400mg 3x daily with food OR Naproxen as directed to reduce inflammation' },
        { name: 'Compression Bandaging', sets: 'Daily application', duration: 'First week', description: 'Elastic wrap from knee to mid-thigh, snug but not cutting circulation' },
        { name: 'Very Gentle Range of Motion', sets: 'Every 2 hours', duration: '5-10 slow reps', description: 'Sitting knee flexion/extension within pain-free range, stop at first sign of discomfort' },
        { name: 'Isometric Glute Activation', sets: '3-4 times daily', duration: '10 x 5-second holds', description: 'Lying prone, gently squeeze glutes without moving legs. Unloaded muscle activation' },
        { name: 'Gentle Massage Therapy', sets: '2-3 times daily', duration: '5-10 minutes', description: 'Light effleurage strokes above and below injury site, avoid direct pressure on strain' },
      ],
    },
    {
      name: 'Phase 2: Progressive Loading & Mobility',
      days: 'Week 2',
      goals: ['Increase range of motion', 'Begin strengthening', 'Reduce bandaging dependence', 'Progress massage intensity'],
      exercises: [
        { name: 'Transition Bandaging', sets: 'As needed', duration: 'Reduce to activity only', description: 'Switch to elastic therapeutic tape or reduce compression wrap usage to activity periods only' },
        { name: 'NSAIDs Reduction', sets: 'Taper dosage', duration: 'Days 5-7', description: 'Gradually reduce anti-inflammatory medication as acute inflammation subsides' },
        { name: 'Active Range of Motion', sets: '4-5 times daily', duration: '2-3 sets of 15 reps', description: 'Seated and standing knee flexion/extension, progress range as tolerated' },
        { name: 'Isometric Hamstring Holds', sets: '3 times daily', duration: '3 sets x 10 holds, 8-10 seconds each', description: 'Prone position, gentle hamstring contraction at multiple knee angles' },
        { name: 'Gentle Stationary Bike', sets: '1-2 times daily', duration: '10-15 minutes', description: 'No resistance, focus on smooth pedaling motion within comfortable range' },
        { name: 'Progressive Massage Therapy', sets: 'Daily', duration: '10-15 minutes', description: 'Light cross-fiber friction massage around injury site, deeper pressure to surrounding muscles' },
      ],
    },
    {
      name: 'Phase 3: Dynamic Strengthening',
      days: 'Week 3-4',
      goals: ['Restore muscle strength', 'Improve eccentric control', 'Begin dynamic movement patterns'],
      exercises: [
        { name: 'Discontinue Bandaging', sets: 'Assessment day 14-18', duration: 'Permanent', description: 'Remove compression support once swelling subsided and strength improving' },
        { name: 'Eccentric Hamstring Strengthening', sets: 'Every other day', duration: '3 sets x 6-10 reps', description: 'Assisted Nordic curls, single-leg Romanian deadlifts with body weight' },
        { name: 'Dynamic Stretching', sets: '2-3 times daily', duration: '10-15 repetitions', description: 'Leg swings, walking high knees, butt kicks (controlled amplitude)' },
        { name: 'Progressive Walking/Jogging', sets: 'Daily', duration: '15-25 minutes', description: 'Week 3: brisk walking. Week 4: walk-jog intervals (2 min walk, 30 sec jog)' },
        { name: 'Deep Tissue Massage', sets: '3-4 times weekly', duration: '15-20 minutes', description: 'Deeper pressure, trigger point release, myofascial work on entire posterior chain' },
      ],
    },
    {
      name: 'Phase 4: Return to Sport Preparation',
      days: 'Week 5-8',
      goals: ['Sport-specific movement patterns', 'High-intensity eccentric strength', 'Injury prevention protocols'],
      exercises: [
        { name: 'Advanced Eccentric Training', sets: '3 times weekly', duration: '4 sets x 8-12 reps', description: 'Full Nordic curls, single-leg RDLs with weight, eccentric leg curls' },
        { name: 'Sprint Progression', sets: 'Every other day', duration: 'Progressive intensity', description: 'Week 5-6: 70% sprints x 4-6 reps. Week 7-8: 85-95% sprints x 6-8 reps' },
        { name: 'Plyometric Progression', sets: '2-3 times weekly', duration: '3-4 sets x 6-10 reps', description: 'Bounds, hops, reactive jumps. Progress from bilateral to unilateral' },
        { name: 'Maintenance Massage', sets: '1-2 times weekly', duration: '20-30 minutes', description: 'Focus on maintaining tissue quality and preventing re-injury' },
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
  const { styles, theme } = useThemedStyles(createStyles);
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showDailyPrograms, setShowDailyPrograms] = useState(false);

  const isProOrStar = !!(user as any)?.isPremium || user?.role === 'star';
  const activePhaseIndex = currentPhase < 0 ? 0 : currentPhase;
  const progressPercent = Math.round(((activePhaseIndex + 1) / rehabProgram.phases.length) * 100);

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
      queryClient.invalidateQueries({ queryKey: ['my-programs'] });
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

  const handleSkipAhead = (phaseIndex: number) => {
    setCurrentPhase(phaseIndex);
    Alert.alert('Phase Updated', `Moved to ${rehabProgram.phases[phaseIndex].name}. Please consult your physician or coach before advancing phases.`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#FFFFFF" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hamstring Rehab</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Acute Muscle</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.programTitle}>{rehabProgram.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={14} color="rgba(255,255,255,0.5)" weight="fill" />
              <Text style={styles.metaText}>{rehabProgram.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Crosshair size={14} color="rgba(255,255,255,0.5)" weight="fill" />
              <Text style={styles.metaText}>4 Phases</Text>
            </View>
            <View style={styles.metaItem}>
              <CalendarBlank size={14} color="rgba(255,255,255,0.5)" weight="fill" />
              <Text style={styles.metaText}>Daily Guided</Text>
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

        {isProOrStar && (
          <LinearGradient
            colors={['rgba(88, 28, 135, 0.2)', 'rgba(30, 64, 175, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.proCard}
          >
            <View style={styles.proHeader}>
              <View style={styles.proTitleRow}>
                <Star size={16} color="#c084fc" weight="fill" />
                <Text style={styles.proTitle}>Pro/Star Daily Programs</Text>
              </View>
              <TouchableOpacity
                style={styles.proToggle}
                onPress={() => setShowDailyPrograms((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Text style={styles.proToggleText}>
                  {showDailyPrograms ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            {showDailyPrograms && (
              <View style={styles.dailyGrid}>
                <View>
                  <Text style={styles.weekLabel}>Week 1 - Initial Recovery</Text>
                  {dailyPrograms.week1.map((day) => (
                    <View key={day.day} style={styles.dailyCard}>
                      <View style={styles.dailyHeader}>
                        <Text style={styles.dailyDay}>Day {day.day}</Text>
                        <View style={styles.intensityPill}>
                          <Text style={styles.intensityText}>{day.intensity}</Text>
                        </View>
                      </View>
                      <Text style={styles.dailyFocus}>{day.focus}</Text>
                      <Text style={styles.dailyExercises}>{day.exercises.join(' · ')}</Text>
                    </View>
                  ))}
                </View>
                <View>
                  <Text style={styles.weekLabel}>Week 2 - Progressive Loading</Text>
                  {dailyPrograms.week2.map((day) => (
                    <View key={day.day} style={styles.dailyCard}>
                      <View style={styles.dailyHeader}>
                        <Text style={styles.dailyDay}>Day {day.day}</Text>
                        <View style={[styles.intensityPill, styles.intensityPillBlue]}>
                          <Text style={[styles.intensityText, { color: '#60a5fa' }]}>{day.intensity}</Text>
                        </View>
                      </View>
                      <Text style={styles.dailyFocus}>{day.focus}</Text>
                      <Text style={styles.dailyExercises}>{day.exercises.join(' · ')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </LinearGradient>
        )}

        <View style={styles.warningCard}>
          <Warning size={16} color="#f59e0b" weight="fill" />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>Important Medical Disclaimer</Text>
            <Text style={styles.warningText}>
              This program is for educational purposes and should complement, not replace, professional medical care. Stop exercises if pain increases. Consult your healthcare provider before starting.
            </Text>
          </View>
        </View>

        <View style={styles.phaseList}>
          {rehabProgram.phases.map((phase, index) => {
            const isActive = index === currentPhase;
            return (
              <View key={phase.name} style={[styles.phaseCard, isActive && styles.phaseCardActive]}>
                <View style={styles.phaseHeader}>
                  <TouchableOpacity
                    style={styles.phaseTitleRow}
                    onPress={() => setCurrentPhase(isActive ? -1 : index)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.phaseNumber, isActive && styles.phaseNumberActive]}>
                      <Text style={styles.phaseNumberText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.phaseName}>{phase.name}</Text>
                      <Text style={styles.phaseDays}>{phase.days}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.phaseActions}>
                    {index > currentPhase && (
                      <TouchableOpacity
                        style={styles.skipBtn}
                        onPress={() => handleSkipAhead(index)}
                        activeOpacity={0.7}
                      >
                        <SkipForward size={12} color="rgba(255,255,255,0.6)" weight="fill" />
                        <Text style={styles.skipText}>Skip</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => setCurrentPhase(isActive ? -1 : index)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isActive ? (
                        <Pause size={16} color="rgba(255,255,255,0.5)" weight="fill" />
                      ) : (
                        <Play size={16} color="rgba(255,255,255,0.5)" weight="fill" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {isActive && (
                  <View style={styles.phaseContent}>
                    <Text style={styles.sectionLabel}>Phase Goals</Text>
                    {phase.goals.map((goal) => (
                      <View key={goal} style={styles.goalRow}>
                        <CheckCircle size={14} color="#16a34a" weight="fill" />
                        <Text style={styles.goalText}>{goal}</Text>
                      </View>
                    ))}

                    <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Daily Exercises</Text>
                    {phase.exercises.map((exercise) => (
                      <View key={exercise.name} style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <View style={styles.exerciseBadge}>
                            <Text style={styles.exerciseBadgeText}>{exercise.sets} · {exercise.duration}</Text>
                          </View>
                        </View>
                        <Text style={styles.exerciseDesc}>{exercise.description}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Recovery Progress</Text>
          <Text style={styles.progressSubtitle}>Track your progress through each phase of recovery</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Phase {activePhaseIndex + 1} of {rehabProgram.phases.length}</Text>
            <Text style={styles.progressLabel}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressNote}>
            This is a visual representation. Your actual recovery may vary based on individual factors.
          </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: t.colors.overlaySubtle,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.colors.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: t.colors.textPrimary,
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#f87171' },
  scrollContent: { padding: 16, gap: 16 },
  titleBlock: { gap: 10 },
  programTitle: { fontSize: 20, fontWeight: '800', color: t.colors.textPrimary, lineHeight: 26 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: t.colors.textMuted },
  assignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    padding: 16,
  },
  assignTitle: { fontSize: 14, fontWeight: '700', color: t.colors.textPrimary },
  assignDesc: { fontSize: 11, color: t.colors.textMuted, lineHeight: 16 },
  assignBtn: {
    backgroundColor: t.colors.brandOrange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  assignBtnText: { fontSize: 12, fontWeight: '700', color: '#000' },
  proCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    padding: 16,
    gap: 12,
  },
  proHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  proTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  proTitle: { fontSize: 12, fontWeight: '700', color: '#c084fc' },
  proToggle: {
    borderWidth: 1,
    borderColor: t.colors.overlayMedium,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  proToggleText: { fontSize: 11, fontWeight: '600', color: t.colors.textPrimary },
  dailyGrid: { gap: 16 },
  weekLabel: { fontSize: 12, fontWeight: '700', color: t.colors.textSecondary, marginBottom: 8 },
  dailyCard: {
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
    backgroundColor: t.colors.overlaySubtle,
    padding: 12,
    gap: 4,
    marginBottom: 6,
  },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dailyDay: { fontSize: 12, fontWeight: '600', color: t.colors.textPrimary },
  dailyFocus: { fontSize: 11, color: t.colors.textMuted },
  dailyExercises: { fontSize: 10, color: t.colors.textMuted },
  intensityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(126, 34, 206, 0.3)',
  },
  intensityPillBlue: { backgroundColor: 'rgba(37, 99, 235, 0.3)' },
  intensityText: { fontSize: 9, fontWeight: '700', color: '#c084fc' },
  warningCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningTitle: { fontSize: 13, fontWeight: '700', color: '#f59e0b', marginBottom: 4 },
  warningText: { fontSize: 11, color: '#f59e0b', lineHeight: 16, opacity: 0.8 },
  phaseList: { gap: 10 },
  phaseCard: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: t.colors.overlaySubtle,
  },
  phaseCardActive: {
    borderColor: 'rgba(59, 130, 246, 0.5)',
    backgroundColor: 'rgba(30, 64, 175, 0.08)',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phaseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  phaseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: t.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseNumberActive: { backgroundColor: '#3b82f6' },
  phaseNumberText: { fontSize: 12, fontWeight: '800', color: t.colors.textPrimary },
  phaseName: { fontSize: 13, fontWeight: '600', color: t.colors.textPrimary },
  phaseDays: { fontSize: 11, color: t.colors.textMuted, marginTop: 2 },
  phaseActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: t.colors.overlayMedium,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipText: { fontSize: 10, fontWeight: '600', color: t.colors.textSecondary },
  phaseContent: { marginTop: 14, gap: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: t.colors.textSecondary, marginBottom: 4 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  goalText: { fontSize: 12, color: t.colors.textSecondary, flex: 1 },
  exerciseCard: {
    backgroundColor: t.colors.overlaySubtle,
    borderRadius: 10,
    padding: 12,
    gap: 4,
    borderWidth: 0.5,
    borderColor: t.colors.overlaySubtle,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  exerciseName: { fontSize: 13, fontWeight: '600', color: t.colors.textPrimary, flex: 1 },
  exerciseBadge: {
    backgroundColor: t.colors.brandOrangeLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseBadgeText: { fontSize: 9, fontWeight: '700', color: t.colors.brandOrange },
  exerciseDesc: { fontSize: 11, color: t.colors.textMuted, lineHeight: 16 },
  progressCard: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  progressTitle: { fontSize: 14, fontWeight: '700', color: t.colors.textPrimary },
  progressSubtitle: { fontSize: 11, color: t.colors.textMuted, lineHeight: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressLabel: { fontSize: 11, color: t.colors.textMuted },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: t.colors.overlayLight,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },
  progressNote: { fontSize: 10, color: t.colors.textMuted, lineHeight: 14 },
});
