import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Play,
  Pause,
  ArrowClockwise,
  Flag,
} from 'phosphor-react-native';

import { Text } from '../components/ui/Text';
import theme from '../utils/theme';
import type { RootStackParamList } from '@/navigation/types';

export const StopwatchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => prev + 10);
      }, 10);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleStartStop = () => setIsRunning(prev => !prev);

  const handleReset = () => {
    setTime(0);
    setIsRunning(false);
    setLaps([]);
  };

  const handleLap = () => {
    if (isRunning) setLaps(prev => [...prev, time]);
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return { min, sec, centis };
  };

  const formatTimeStr = (ms: number): string => {
    const { min, sec, centis } = formatTime(ms);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  const { min, sec, centis } = formatTime(time);

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color={theme.colors.foreground} weight="bold" />
          </TouchableOpacity>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.timerSection}>
          <View style={styles.timerDigitsRow}>
            <View style={styles.digitBlock}>
              <Text style={styles.digitText}>
                {min.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.digitLabel}>MIN</Text>
            </View>
            <Text style={styles.colonText}>:</Text>
            <View style={styles.digitBlock}>
              <Text style={styles.digitText}>
                {sec.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.digitLabel}>SEC</Text>
            </View>
            <Text style={styles.colonText}>.</Text>
            <View style={styles.digitBlock}>
              <Text style={styles.centisText}>
                {centis.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.digitLabel}>{' '}</Text>
            </View>
          </View>

          {laps.length > 0 && (
            <Text variant="small" style={styles.currentLapLabel}>
              Lap {laps.length + 1}:  {formatTimeStr(time - laps[laps.length - 1])}
            </Text>
          )}
        </View>

        <View style={styles.center}>
          <View style={[styles.glow, isRunning && styles.glowActive]} />
          <TouchableOpacity
            style={[styles.mainButton, isRunning && styles.mainButtonActive]}
            onPress={handleStartStop}
            activeOpacity={0.8}
          >
            {isRunning ? (
              <Pause size={52} color="#fff" weight="fill" />
            ) : (
              <Play size={52} color="#fff" weight="fill" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, !isRunning && styles.controlBtnDisabled]}
            onPress={handleLap}
            disabled={!isRunning}
            activeOpacity={0.8}
          >
            <Flag size={16} color="#fff" weight="fill" />
            <Text variant="small" weight="bold" style={styles.controlBtnText}>
              LAP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, (isRunning || time === 0) && styles.controlBtnDisabled]}
            onPress={handleReset}
            disabled={isRunning || time === 0}
            activeOpacity={0.8}
          >
            <ArrowClockwise size={16} color="#fff" weight="bold" />
            <Text variant="small" weight="bold" style={styles.controlBtnText}>
              RESET
            </Text>
          </TouchableOpacity>
        </View>

        {laps.length > 0 && (
          <View style={styles.card}>
            <View style={styles.lapsHeader}>
              <Flag size={18} color="#FF9800" weight="fill" />
              <Text variant="body" weight="bold" style={styles.lapsTitle}>
                Lap Times
              </Text>
            </View>
            {laps
              .slice()
              .reverse()
              .map((lapTime, index) => {
                const actualIndex = laps.length - 1 - index;
                const prevLapTime = actualIndex > 0 ? laps[actualIndex - 1] : 0;
                const delta = lapTime - prevLapTime;
                return (
                  <View key={actualIndex} style={styles.lapRow}>
                    <View style={styles.lapLeft}>
                      <View style={styles.lapBadge}>
                        <Text variant="small" weight="bold" style={styles.lapBadgeText}>
                          {actualIndex + 1}
                        </Text>
                      </View>
                      <View>
                        <Text variant="body" weight="semiBold" style={styles.lapTime}>
                          {formatTimeStr(lapTime)}
                        </Text>
                        <Text variant="small" style={styles.lapDelta}>
                          +{formatTimeStr(delta)}
                        </Text>
                      </View>
                    </View>
                    {index === 0 && (
                      <View style={styles.latestBadge}>
                        <Text variant="small" weight="bold" style={styles.latestBadgeText}>
                          Latest
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'System' });

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    gap: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerSection: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  timerDigitsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  digitBlock: {
    alignItems: 'center',
    gap: 6,
  },
  digitText: {
    fontSize: 72,
    fontWeight: '200',
    color: '#fff',
    fontFamily: mono,
    lineHeight: 80,
    letterSpacing: -2,
  },
  centisText: {
    fontSize: 48,
    fontWeight: '200',
    color: 'rgba(255,255,255,0.5)',
    fontFamily: mono,
    lineHeight: 80,
    letterSpacing: -2,
  },
  colonText: {
    fontSize: 60,
    fontWeight: '200',
    color: 'rgba(255,255,255,0.3)',
    fontFamily: mono,
    lineHeight: 80,
    marginHorizontal: 4,
  },
  digitLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
  },
  currentLapLabel: {
    color: '#FF9800',
    fontFamily: mono,
    marginTop: 4,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,152,0,0.15)',
  },
  glowActive: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  mainButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,152,0,0.2)',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  mainButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderColor: '#ef4444',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  controlBtnDisabled: {
    opacity: 0.3,
  },
  controlBtnText: {
    color: '#fff',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(148,163,184,0.25)',
    gap: 10,
  },
  lapsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  lapsTitle: {
    color: '#fff',
  },
  lapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(148,163,184,0.15)',
  },
  lapLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lapBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,152,0,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,152,0,0.3)',
  },
  lapBadgeText: {
    color: '#FF9800',
  },
  lapTime: {
    color: '#fff',
    fontFamily: mono,
  },
  lapDelta: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: mono,
  },
  latestBadge: {
    backgroundColor: 'rgba(255,152,0,0.15)',
    borderColor: 'rgba(255,152,0,0.3)',
    borderWidth: 0.5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  latestBadgeText: {
    color: '#FF9800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
  },
});
