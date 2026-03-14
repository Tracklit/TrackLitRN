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
} from 'phosphor-react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useMutation } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

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
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState(0);
  const activePhaseIndex = currentPhase < 0 ? 0 : currentPhase;
  const progressPercent = Math.round(((activePhaseIndex + 1) / rehabProgram.phases.length) * 100);

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#FFFFFF" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Foot Rehab</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Chronic Injury</Text>
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
              <Text style={styles.metaText}>Evidence-Based</Text>
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
              This comprehensive program will guide your recovery and prevent future foot issues.
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

        <View style={styles.warningCard}>
          <Warning size={16} color="#f59e0b" weight="fill" />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>Important Considerations</Text>
            <Text style={styles.warningText}>
              Chronic foot conditions often require patience and consistency. If pain persists or worsens, consider consulting a podiatrist or sports medicine physician.
            </Text>
          </View>
        </View>

        <View style={styles.phaseList}>
          {rehabProgram.phases.map((phase, index) => {
            const isActive = index === currentPhase;
            return (
              <View key={phase.name} style={[styles.phaseCard, isActive && styles.phaseCardActive]}>
                <TouchableOpacity
                  style={styles.phaseHeader}
                  onPress={() => setCurrentPhase(isActive ? -1 : index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.phaseTitleRow}>
                    <View style={[styles.phaseNumber, isActive && styles.phaseNumberActive]}>
                      <Text style={styles.phaseNumberText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.phaseName}>{phase.name}</Text>
                      <Text style={styles.phaseDays}>{phase.days}</Text>
                    </View>
                  </View>
                  {isActive ? (
                    <Pause size={16} color="rgba(255,255,255,0.5)" weight="fill" />
                  ) : (
                    <Play size={16} color="rgba(255,255,255,0.5)" weight="fill" />
                  )}
                </TouchableOpacity>

                {isActive && (
                  <View style={styles.phaseContent}>
                    <Text style={styles.sectionLabel}>Phase Goals</Text>
                    {phase.goals.map((goal) => (
                      <View key={goal} style={styles.goalRow}>
                        <CheckCircle size={14} color="#16a34a" weight="fill" />
                        <Text style={styles.goalText}>{goal}</Text>
                      </View>
                    ))}

                    <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Exercises</Text>
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
          <Text style={styles.progressSubtitle}>
            Chronic conditions require patience - progress may be gradual but consistent
          </Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Phase {activePhaseIndex + 1} of {rehabProgram.phases.length}</Text>
            <Text style={styles.progressLabel}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressNote}>
            Recovery timeline varies with chronic conditions. Consistency is more important than speed.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0F14' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#a78bfa' },
  scrollContent: { padding: 16, gap: 16 },
  titleBlock: { gap: 10 },
  programTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', lineHeight: 26 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  assignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    padding: 16,
  },
  assignTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  assignDesc: { fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 16 },
  assignBtn: {
    backgroundColor: '#FF7A00',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  assignBtnText: { fontSize: 12, fontWeight: '700', color: '#000' },
  warningCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#1C1F2B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningTitle: { fontSize: 13, fontWeight: '700', color: '#f59e0b', marginBottom: 4 },
  warningText: { fontSize: 11, color: '#f59e0b', lineHeight: 16, opacity: 0.8 },
  phaseList: { gap: 10 },
  phaseCard: {
    backgroundColor: '#1C1F2B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  phaseCardActive: {
    borderColor: 'rgba(124, 58, 237, 0.5)',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseNumberActive: { backgroundColor: '#FF7A00' },
  phaseNumberText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  phaseName: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  phaseDays: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  phaseContent: { marginTop: 14, gap: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  goalText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 },
  exerciseCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
    gap: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  exerciseName: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', flex: 1 },
  exerciseBadge: {
    backgroundColor: 'rgba(255,122,0,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseBadgeText: { fontSize: 9, fontWeight: '700', color: '#FF7A00' },
  exerciseDesc: { fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 16 },
  progressCard: {
    backgroundColor: '#1C1F2B',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  progressTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  progressSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FF7A00',
  },
  progressNote: { fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 14 },
});
