import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '../components/ui/Text';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import theme from '../utils/theme';

export const StopwatchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [time, setTime] = useState(0); // Time in milliseconds
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

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

  const start = () => {
    setIsRunning(true);
  };

  const pause = () => {
    setIsRunning(false);
  };

  const reset = () => {
    setTime(0);
    setIsRunning(false);
    setLaps([]);
  };

  const lap = () => {
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

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={20} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <Text variant="h2" weight="bold" color="foreground">
            Stopwatch
          </Text>
          <View style={styles.backButton} />
        </View>

        {/* Main Timer Display */}
        <Card style={styles.timerCard}>
          <CardContent style={styles.timerContent}>
            <Text variant="h1" weight="bold" color="primary" style={styles.timerText}>
              {formatTime(time)}
            </Text>
          </CardContent>
        </Card>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <View style={styles.buttonsRow}>
            {!isRunning ? (
              <Button
                variant="default"
                size="lg"
                onPress={start}
                style={styles.startButton}
                data-testid="button-start"
              >
                <FontAwesome5 name="play" size={20} color="white" solid />
                <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                  Start
                </Text>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                onPress={pause}
                style={styles.pauseButton}
                data-testid="button-pause"
              >
                <FontAwesome5 name="pause" size={20} color={theme.colors.foreground} solid />
                <Text variant="body" weight="bold" color="foreground" style={styles.buttonText}>
                  Pause
                </Text>
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              onPress={reset}
              style={styles.resetButton}
              data-testid="button-reset"
            >
              <FontAwesome5 name="redo" size={18} color={theme.colors.foreground} solid />
              <Text variant="body" weight="bold" color="foreground" style={styles.buttonText}>
                Reset
              </Text>
            </Button>
          </View>

          {isRunning && (
            <Button
              variant="outline"
              size="md"
              onPress={lap}
              style={styles.lapButton}
              data-testid="button-lap"
            >
              <FontAwesome5 name="flag" size={16} color={theme.colors.primary} solid />
              <Text variant="body" weight="medium" color="primary" style={styles.buttonText}>
                Lap
              </Text>
            </Button>
          )}
        </View>

        {/* Lap Times */}
        {laps.length > 0 && (
          <Card style={styles.lapsCard}>
            <CardContent>
              <Text variant="h4" weight="semiBold" color="foreground" style={styles.lapsTitle}>
                Lap Times
              </Text>
              <View style={styles.lapsList}>
                {laps.map((lapTime, index) => (
                  <View key={index} style={styles.lapItem}>
                    <Text variant="body" color="muted">
                      Lap {index + 1}
                    </Text>
                    <Text variant="body" weight="medium" color="foreground">
                      {formatTime(lapTime)}
                    </Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}
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
    marginVertical: theme.spacing.xl * 2,
  },
  timerContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  timerText: {
    fontSize: 48,
    letterSpacing: 2,
  },
  controlsContainer: {
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  lapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  buttonText: {
    marginLeft: theme.spacing.xs,
  },
  lapsCard: {
    marginTop: theme.spacing.xl,
    flex: 1,
  },
  lapsTitle: {
    marginBottom: theme.spacing.md,
  },
  lapsList: {
    gap: theme.spacing.sm,
  },
  lapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
});