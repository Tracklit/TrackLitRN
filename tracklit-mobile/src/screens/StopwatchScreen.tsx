import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import theme from '../utils/theme';
import type { RootStackParamList } from '@/navigation/types';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';

export const StopwatchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [time, setTime] = useState(0); // Time in milliseconds
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  const handleStartStop = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setTime(0);
    setIsRunning(false);
    setLaps([]);
  };

  const handleLap = () => {
    if (isRunning) {
      setLaps(prevLaps => [...prevLaps, time]);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const latestLapDelta = laps.length > 0 ? time - (laps[laps.length - 1] || 0) : 0;

  return (
    <LinearGradient
      colors={['#020617', '#0f172a', '#020617']}
      locations={[0, 0.5, 1]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true }) },
        ]}
        showsVerticalScrollIndicator={false}
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
            Stopwatch
          </Text>
          <View style={styles.backButton} />
        </View>

        {/* Main Timer Card */}
        <View style={styles.timerCardWrap}>
          {isRunning && <View style={styles.timerGlow} pointerEvents="none" />}
          <LinearGradient
            colors={['rgba(30, 41, 59, 0.6)', 'rgba(15, 23, 42, 0.6)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.timerCard}
          >
            <View style={styles.timerContent}>
              <View style={styles.timerTextWrap}>
                <Text variant="h1" weight="bold" color="foreground" style={styles.timerText}>
                  {formatTime(time)}
                </Text>
                {laps.length > 0 && (
                  <Text variant="small" color="muted" style={styles.latestLapText}>
                    Lap {laps.length}: {formatTime(latestLapDelta)}
                  </Text>
                )}
              </View>

              <View style={styles.buttonWrap}>
                <View
                  pointerEvents="none"
                  style={[styles.buttonGlow, isRunning && styles.buttonGlowActive]}
                />
                <Pressable
                  onPress={handleStartStop}
                  data-testid="button-start-stop"
                  style={({ pressed }) => [
                    styles.bigButton,
                    pressed && styles.bigButtonPressed,
                  ]}
                >
                  <LinearGradient
                    colors={
                      isRunning
                        ? ['#ef4444', '#dc2626']
                        : ['#3b82f6', '#22d3ee']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bigButtonGradient}
                  >
                    <View style={styles.buttonRing} />
                    <View style={styles.bigButtonContent}>
                      <FontAwesome5
                        name={isRunning ? 'pause' : 'play'}
                        size={54}
                        color="white"
                        solid
                        style={isRunning ? undefined : { marginLeft: 6 }}
                      />
                      <Text variant="body" weight="bold" color="primary-foreground" style={styles.bigButtonText}>
                        {isRunning ? 'Stop' : 'Start'}
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.tipRow}>
          <Text variant="small" color="muted" style={styles.tipText}>
            Use your volume up button to start/stop the timer
          </Text>
        </View>

        <View style={styles.controlsRow}>
          <Button
            onPress={handleLap}
            disabled={!isRunning}
            data-testid="button-lap"
            size="lg"
            style={styles.controlButton}
          >
            <FontAwesome5 name="flag" size={16} color="white" solid />
            <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
              Lap
            </Text>
          </Button>
          <Button
            onPress={handleReset}
            data-testid="button-reset"
            size="lg"
            variant="outline"
            style={styles.controlButtonAlt}
          >
            <FontAwesome5 name="redo" size={16} color={theme.colors.foreground} solid />
            <Text variant="body" weight="bold" color="foreground" style={styles.buttonText}>
              Reset
            </Text>
          </Button>
        </View>

        <TouchableOpacity
          onPress={() => setIsMuted(prev => !prev)}
          data-testid="button-toggle-sound"
          style={styles.soundToggle}
          accessibilityRole="button"
          accessibilityLabel="Toggle sound"
        >
          <FontAwesome5 name={isMuted ? 'volume-mute' : 'volume-up'} size={16} color={theme.colors.mutedForeground} solid />
          <Text variant="small" color="muted" style={styles.soundToggleText}>
            {isMuted ? 'Sound Off' : 'Sound On'}
          </Text>
        </TouchableOpacity>

        {laps.length > 0 && (
          <View style={styles.lapsCard}>
            <View style={styles.lapsHeader}>
              <FontAwesome5 name="flag" size={16} color="#60a5fa" solid />
              <Text variant="h4" weight="semiBold" color="foreground" style={styles.lapsTitle}>
                Lap Times
              </Text>
            </View>
            <ScrollView
              style={styles.lapsScroll}
              contentContainerStyle={styles.lapsList}
              showsVerticalScrollIndicator={false}
            >
              {laps
                .slice()
                .reverse()
                .map((lapTime, index) => {
                  const actualIndex = laps.length - 1 - index;
                  const prevLapTime = actualIndex > 0 ? laps[actualIndex - 1] : 0;
                  const relativeLapTime = lapTime - prevLapTime;
                  return (
                    <View key={actualIndex} style={styles.lapItem}>
                      <View style={styles.lapInfo}>
                        <View style={styles.lapBadge}>
                          <Text variant="small" weight="bold" color="primary">
                            {actualIndex + 1}
                          </Text>
                        </View>
                        <View>
                          <Text variant="body" weight="semiBold" color="foreground" style={styles.lapTimeText}>
                            {formatTime(lapTime)}
                          </Text>
                          <Text variant="small" color="muted" style={styles.lapDeltaText}>
                            +{formatTime(relativeLapTime)}
                          </Text>
                        </View>
                      </View>
                      {index === 0 && (
                        <View style={styles.latestBadge}>
                          <Text variant="small" weight="semiBold" color="primary" style={styles.latestBadgeText}>
                            Latest
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
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
  timerCardWrap: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl * 1.5,
  },
  timerCard: {
    borderRadius: 24,
    padding: theme.spacing.xxxl,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    overflow: 'hidden',
  },
  timerContent: {
    alignItems: 'center',
    gap: theme.spacing.xl,
  },
  timerGlow: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  timerTextWrap: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  timerText: {
    fontSize: 64,
    letterSpacing: -1,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'System' }),
    lineHeight: 72,
    paddingTop: 6,
  },
  latestLapText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'System' }),
  },
  buttonWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    width: '100%',
    height: 240,
  },
  buttonGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  buttonGlowActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  bigButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  bigButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bigButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  bigButtonText: {
    fontSize: 22,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tipRow: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  tipText: {
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  controlButtonAlt: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  buttonText: {
    marginLeft: theme.spacing.xs,
  },
  soundToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  soundToggleText: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lapsCard: {
    marginTop: theme.spacing.xl,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    padding: theme.spacing.lg,
  },
  lapsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  lapsTitle: {
    marginBottom: 0,
  },
  lapsScroll: {
    maxHeight: 320,
  },
  lapsList: {
    gap: theme.spacing.sm,
  },
  lapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
  },
  lapInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  lapBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  lapTimeText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'System' }),
  },
  lapDeltaText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'System' }),
  },
  latestBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  latestBadgeText: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});