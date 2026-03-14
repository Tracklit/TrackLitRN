import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Play,
  Pause,
  Stop,
  ArrowCounterClockwise,
  Plus,
  Minus,
  Lightning,
  Timer,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import type { RootStackParamList } from '@/navigation/types';

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  orange: '#FF7A00',
  orangeDim: 'rgba(255,122,0,0.15)',
  green: '#22C55E',
  greenDim: 'rgba(34,197,94,0.15)',
  blue: '#3B82F6',
  blueDim: 'rgba(59,130,246,0.15)',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.35)',
};

type TimerPhase = 'idle' | 'work' | 'rest' | 'complete';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getTotalTime = (intervals: number, workDuration: number, restDuration: number): string => {
  const total = intervals * (workDuration + restDuration) - restDuration;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
};

interface StepperProps {
  label: string;
  value: number;
  unit: string;
  onDecrement: () => void;
  onIncrement: () => void;
  min: number;
  max: number;
  step: number;
  accentColor?: string;
}

const Stepper: React.FC<StepperProps> = ({
  label, value, unit, onDecrement, onIncrement, min, max, accentColor = C.orange,
}) => (
  <View style={styles.stepperRow}>
    <View style={styles.stepperLeft}>
      <Text style={styles.stepperLabel}>{label}</Text>
    </View>
    <View style={styles.stepperControls}>
      <TouchableOpacity
        style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
        onPress={onDecrement}
        disabled={value <= min}
        activeOpacity={0.7}
      >
        <Minus size={16} color={value <= min ? C.textMuted : C.textPrimary} weight="bold" />
      </TouchableOpacity>
      <View style={[styles.stepValue, { borderColor: accentColor }]}>
        <Text style={[styles.stepValueText, { color: accentColor }]}>
          {value}
        </Text>
        <Text style={styles.stepUnit}>{unit}</Text>
      </View>
      <TouchableOpacity
        style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
        onPress={onIncrement}
        disabled={value >= max}
        activeOpacity={0.7}
      >
        <Plus size={16} color={value >= max ? C.textMuted : C.textPrimary} weight="bold" />
      </TouchableOpacity>
    </View>
  </View>
);

export const IntervalTimerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [workDuration, setWorkDuration] = useState(30);
  const [restDuration, setRestDuration] = useState(15);
  const [intervals, setIntervals] = useState(8);

  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentInterval, setCurrentInterval] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setPhase('work');
    setTimeRemaining(workDuration);
    setCurrentInterval(1);
    setIsRunning(true);
    Vibration.vibrate(200);
  }, [workDuration]);

  const pauseTimer = useCallback(() => setIsRunning(false), []);
  const resumeTimer = useCallback(() => setIsRunning(true), []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setTimeRemaining(0);
    setCurrentInterval(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (isRunning && phase !== 'idle' && phase !== 'complete') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            Vibration.vibrate(500);
            if (phase === 'work') {
              if (currentInterval >= intervals) {
                setPhase('complete');
                setIsRunning(false);
                Vibration.vibrate([0, 300, 150, 300, 150, 300]);
                return 0;
              }
              setPhase('rest');
              return restDuration;
            } else {
              setPhase('work');
              setCurrentInterval((c) => c + 1);
              return workDuration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, phase, currentInterval, intervals, workDuration, restDuration]);

  const getPhaseColor = () => {
    if (phase === 'work') return C.green;
    if (phase === 'rest') return C.blue;
    if (phase === 'complete') return C.orange;
    return C.textPrimary;
  };

  const getPhaseBg = () => {
    if (phase === 'work') return C.greenDim;
    if (phase === 'rest') return C.blueDim;
    if (phase === 'complete') return C.orangeDim;
    return 'transparent';
  };

  const getPhaseLabel = () => {
    if (phase === 'work') return 'WORK';
    if (phase === 'rest') return 'REST';
    if (phase === 'complete') return 'DONE';
    return 'READY';
  };

  const phaseColor = getPhaseColor();
  const displayTime = phase === 'idle' ? formatTime(workDuration) : formatTime(timeRemaining);

  const progressFraction = () => {
    if (phase === 'idle' || phase === 'complete') return 0;
    const total = phase === 'work' ? workDuration : restDuration;
    return total > 0 ? (total - timeRemaining) / total : 0;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interval Timer</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Display */}
        <View style={[styles.timerCard, { borderColor: phase !== 'idle' ? phaseColor + '40' : C.border }]}>
          <View style={[styles.phasePill, { backgroundColor: getPhaseBg() }]}>
            <Timer size={12} color={phase !== 'idle' ? phaseColor : C.textMuted} weight="fill" />
            <Text style={[styles.phaseLabel, { color: phase !== 'idle' ? phaseColor : C.textMuted }]}>
              {getPhaseLabel()}
            </Text>
          </View>

          <Text style={[styles.timerDisplay, { color: phaseColor }]}>
            {displayTime}
          </Text>

          {phase !== 'idle' && phase !== 'complete' && (
            <>
              <Text style={styles.intervalCounter}>
                Interval {currentInterval} / {intervals}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  width: `${progressFraction() * 100}%` as any,
                  backgroundColor: phaseColor,
                }]} />
              </View>
            </>
          )}

          {phase === 'complete' && (
            <View style={styles.completeBadge}>
              <Lightning size={16} color={C.orange} weight="fill" />
              <Text style={styles.completeText}>{intervals} intervals complete!</Text>
            </View>
          )}
        </View>

        {/* Settings — shown when idle */}
        {phase === 'idle' && (
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Configure</Text>

            <Stepper
              label="Work Duration"
              value={workDuration}
              unit="sec"
              onDecrement={() => setWorkDuration(v => Math.max(5, v - 5))}
              onIncrement={() => setWorkDuration(v => Math.min(300, v + 5))}
              min={5}
              max={300}
              step={5}
              accentColor={C.green}
            />
            <View style={styles.divider} />
            <Stepper
              label="Rest Duration"
              value={restDuration}
              unit="sec"
              onDecrement={() => setRestDuration(v => Math.max(5, v - 5))}
              onIncrement={() => setRestDuration(v => Math.min(120, v + 5))}
              min={5}
              max={120}
              step={5}
              accentColor={C.blue}
            />
            <View style={styles.divider} />
            <Stepper
              label="Intervals"
              value={intervals}
              unit="sets"
              onDecrement={() => setIntervals(v => Math.max(1, v - 1))}
              onIncrement={() => setIntervals(v => Math.min(30, v + 1))}
              min={1}
              max={30}
              step={1}
              accentColor={C.orange}
            />

            <View style={styles.totalRow}>
              <Timer size={14} color={C.textMuted} weight="fill" />
              <Text style={styles.totalLabel}>
                Total: {getTotalTime(intervals, workDuration, restDuration)}
              </Text>
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {phase === 'idle' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={startTimer} activeOpacity={0.85}>
              <Play size={22} color="#fff" weight="fill" />
              <Text style={styles.primaryBtnText}>Start Workout</Text>
            </TouchableOpacity>
          )}

          {(phase === 'work' || phase === 'rest') && (
            <View style={styles.activeControls}>
              {isRunning ? (
                <TouchableOpacity style={[styles.controlBtn, styles.pauseBtn]} onPress={pauseTimer} activeOpacity={0.8}>
                  <Pause size={20} color={C.textPrimary} weight="fill" />
                  <Text style={styles.controlBtnText}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.controlBtn, styles.resumeBtn]} onPress={resumeTimer} activeOpacity={0.8}>
                  <Play size={20} color="#fff" weight="fill" />
                  <Text style={[styles.controlBtnText, { color: '#fff' }]}>Resume</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.controlBtn, styles.stopBtn]} onPress={resetTimer} activeOpacity={0.8}>
                <Stop size={20} color={C.textMuted} weight="fill" />
                <Text style={[styles.controlBtnText, { color: C.textMuted }]}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'complete' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={resetTimer} activeOpacity={0.85}>
              <ArrowCounterClockwise size={22} color="#fff" weight="bold" />
              <Text style={styles.primaryBtnText}>Start Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  timerCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  phasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  timerDisplay: {
    fontSize: 80,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 88,
  },
  intervalCounter: {
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: '500',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: C.orangeDim,
    borderRadius: 12,
  },
  completeText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.orange,
  },
  settingsCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 4,
  },
  settingsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  stepperLeft: {
    flex: 1,
  },
  stepperLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  stepValue: {
    minWidth: 72,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  stepValueText: {
    fontSize: 17,
    fontWeight: '800',
  },
  stepUnit: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: -20,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '500',
  },
  controls: {
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.orange,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  activeControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
  },
  pauseBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  resumeBtn: {
    backgroundColor: C.orange,
    borderColor: C.orange,
  },
  stopBtn: {
    backgroundColor: 'transparent',
    borderColor: C.border,
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
  },
});
