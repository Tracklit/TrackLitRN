import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Slider from '@react-native-community/slider';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

type TimerPhase = 'idle' | 'work' | 'rest' | 'complete';

export const IntervalTimerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Timer settings
  const [workDuration, setWorkDuration] = useState(30); // seconds
  const [restDuration, setRestDuration] = useState(15); // seconds
  const [intervals, setIntervals] = useState(8);
  
  // Timer state
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentInterval, setCurrentInterval] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalTime = (): string => {
    const total = intervals * (workDuration + restDuration) - restDuration;
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = useCallback(() => {
    setPhase('work');
    setTimeRemaining(workDuration);
    setCurrentInterval(1);
    setIsRunning(true);
    Vibration.vibrate(200);
  }, [workDuration]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setTimeRemaining(0);
    setCurrentInterval(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && phase !== 'idle' && phase !== 'complete') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Phase complete
            Vibration.vibrate(500);
            
            if (phase === 'work') {
              if (currentInterval >= intervals) {
                // All intervals complete
                setPhase('complete');
                setIsRunning(false);
                Alert.alert('Workout Complete!', `You completed ${intervals} intervals!`);
                return 0;
              } else {
                // Switch to rest
                setPhase('rest');
                return restDuration;
              }
            } else {
              // Switch to work (next interval)
              setPhase('work');
              setCurrentInterval((c) => c + 1);
              return workDuration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, phase, currentInterval, intervals, workDuration, restDuration]);

  const getPhaseColor = () => {
    switch (phase) {
      case 'work':
        return theme.colors.success;
      case 'rest':
        return theme.colors.primary;
      case 'complete':
        return theme.colors.deepGold;
      default:
        return theme.colors.foreground;
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'work':
        return 'WORK';
      case 'rest':
        return 'REST';
      case 'complete':
        return 'COMPLETE';
      default:
        return 'READY';
    }
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing.xl },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <Text variant="h2" weight="bold" color="foreground">
            Interval Timer
          </Text>
          <View style={styles.backButton} />
        </View>

        {/* Timer Display */}
        <Card style={styles.timerCard}>
          <CardContent style={styles.timerContent}>
            <Text
              variant="body"
              weight="bold"
              style={[styles.phaseText, { color: getPhaseColor() }]}
            >
              {getPhaseText()}
            </Text>
            <Text
              variant="h1"
              weight="bold"
              style={[styles.timerText, { color: getPhaseColor() }]}
            >
              {phase === 'idle' ? formatTime(workDuration) : formatTime(timeRemaining)}
            </Text>
            {phase !== 'idle' && phase !== 'complete' && (
              <Text variant="body" color="muted">
                Interval {currentInterval} of {intervals}
              </Text>
            )}
          </CardContent>
        </Card>

        {/* Settings (only when idle) */}
        {phase === 'idle' && (
          <View style={styles.settings}>
            <Card style={styles.settingCard}>
              <CardContent style={styles.settingContent}>
                <Text variant="body" weight="medium" color="foreground">
                  Work Duration: {workDuration}s
                </Text>
                <Slider
                  minimumValue={10}
                  maximumValue={120}
                  value={workDuration}
                  step={5}
                  minimumTrackTintColor={theme.colors.success}
                  maximumTrackTintColor={theme.colors.border}
                  thumbTintColor={theme.colors.success}
                  onValueChange={setWorkDuration}
                />
              </CardContent>
            </Card>

            <Card style={styles.settingCard}>
              <CardContent style={styles.settingContent}>
                <Text variant="body" weight="medium" color="foreground">
                  Rest Duration: {restDuration}s
                </Text>
                <Slider
                  minimumValue={5}
                  maximumValue={60}
                  value={restDuration}
                  step={5}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.border}
                  thumbTintColor={theme.colors.primary}
                  onValueChange={setRestDuration}
                />
              </CardContent>
            </Card>

            <Card style={styles.settingCard}>
              <CardContent style={styles.settingContent}>
                <Text variant="body" weight="medium" color="foreground">
                  Intervals: {intervals}
                </Text>
                <Slider
                  minimumValue={1}
                  maximumValue={20}
                  value={intervals}
                  step={1}
                  minimumTrackTintColor={theme.colors.deepGold}
                  maximumTrackTintColor={theme.colors.border}
                  thumbTintColor={theme.colors.deepGold}
                  onValueChange={setIntervals}
                />
              </CardContent>
            </Card>

            <Text variant="small" color="muted" style={styles.totalTime}>
              Total workout time: {getTotalTime()}
            </Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {phase === 'idle' && (
            <Button
              variant="default"
              size="lg"
              onPress={startTimer}
              style={styles.mainButton}
            >
              <FontAwesome5 name="play" size={20} color="white" solid />
              <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                Start Workout
              </Text>
            </Button>
          )}

          {(phase === 'work' || phase === 'rest') && (
            <View style={styles.activeControls}>
              {isRunning ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onPress={pauseTimer}
                  style={styles.controlButton}
                >
                  <FontAwesome5 name="pause" size={20} color={theme.colors.foreground} solid />
                  <Text variant="body" weight="bold" color="foreground" style={styles.buttonText}>
                    Pause
                  </Text>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="lg"
                  onPress={resumeTimer}
                  style={styles.controlButton}
                >
                  <FontAwesome5 name="play" size={20} color="white" solid />
                  <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                    Resume
                  </Text>
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                onPress={resetTimer}
                style={styles.controlButton}
              >
                <FontAwesome5 name="stop" size={20} color={theme.colors.foreground} solid />
                <Text variant="body" weight="bold" color="foreground" style={styles.buttonText}>
                  Stop
                </Text>
              </Button>
            </View>
          )}

          {phase === 'complete' && (
            <Button
              variant="default"
              size="lg"
              onPress={resetTimer}
              style={styles.mainButton}
            >
              <FontAwesome5 name="redo" size={20} color="white" solid />
              <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                Start Again
              </Text>
            </Button>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCard: {
    marginVertical: theme.spacing.xl,
  },
  timerContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  phaseText: {
    fontSize: 18,
    letterSpacing: 4,
    marginBottom: theme.spacing.sm,
  },
  timerText: {
    fontSize: 64,
    letterSpacing: 2,
  },
  settings: {
    gap: theme.spacing.md,
    flex: 1,
  },
  settingCard: {
    marginBottom: 0,
  },
  settingContent: {
    gap: theme.spacing.sm,
  },
  totalTime: {
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  controls: {
    marginTop: 'auto',
    paddingVertical: theme.spacing.xl,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  activeControls: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  buttonText: {
    marginLeft: theme.spacing.sm,
  },
});

