import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Sound from 'react-native-sound';

import { Text } from '@/components/ui/Text';
import { Card, CardContent } from '@/components/ui/Card';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

import marksAudio from '../../assets/audio/on-your-marks.mp3';
import setAudio from '../../assets/audio/set.mp3';
import bangAudio from '../../assets/audio/bang.mp3';

Sound.setCategory('Playback');

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      resolve();
    }, ms);
  });

export const StartGunScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [marksDelay, setMarksDelay] = useState(2);
  const [setDelayValue, setSetDelayValue] = useState(1.5);
  const [useRandomizer, setUseRandomizer] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const sequenceIdRef = useRef(0);
  const marksRef = useRef<Sound | null>(null);
  const setRef = useRef<Sound | null>(null);
  const bangRef = useRef<Sound | null>(null);

  useEffect(() => {
    marksRef.current = new Sound(marksAudio, (error) => {
      if (error) {
        console.error('Failed to load on-your-marks audio', error);
      }
    });
    setRef.current = new Sound(setAudio, (error) => {
      if (error) {
        console.error('Failed to load set audio', error);
      }
    });
    bangRef.current = new Sound(bangAudio, (error) => {
      if (error) {
        console.error('Failed to load bang audio', error);
      }
    });

    return () => {
      marksRef.current?.release();
      setRef.current?.release();
      bangRef.current?.release();
    };
  }, []);

  const playSound = (sound: Sound | null): Promise<void> =>
    new Promise((resolve) => {
      if (!sound) {
        resolve();
        return;
      }
      sound.setVolume(isMuted ? 0 : volume / 100);
      sound.stop(() => {
        sound.play(() => resolve());
      });
    });

  const startSequence = async () => {
    if (isRunning) return;
    try {
      setIsRunning(true);
      sequenceIdRef.current += 1;
      const sequenceId = sequenceIdRef.current;

      await playSound(marksRef.current);
      if (sequenceIdRef.current !== sequenceId) return;
      await delay(marksDelay * 1000);
      if (sequenceIdRef.current !== sequenceId) return;

      await playSound(setRef.current);
      if (sequenceIdRef.current !== sequenceId) return;

      const randomExtra = useRandomizer ? (Math.random() * 2 - 1) * 1.0 : 0;
      const gunDelay = Math.max(0.1, setDelayValue + randomExtra);
      await delay(gunDelay * 1000);
      if (sequenceIdRef.current !== sequenceId) return;

      await playSound(bangRef.current);
    } catch (error) {
      Alert.alert('Start gun error', 'Unable to play audio sequence.');
    } finally {
      setIsRunning(false);
    }
  };

  const resetSequence = () => {
    sequenceIdRef.current += 1;
    setIsRunning(false);
    marksRef.current?.stop(() => undefined);
    setRef.current?.stop(() => undefined);
    bangRef.current?.stop(() => undefined);
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
            Start Gun
          </Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.center}>
          <View style={styles.glow} />
          <TouchableOpacity
            style={[styles.startButton, isRunning && styles.startButtonActive]}
            onPress={startSequence}
            disabled={isRunning}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="play" size={48} color="white" solid />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.resetButton, !isRunning && styles.resetButtonDisabled]}
          onPress={resetSequence}
          disabled={!isRunning}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="redo" size={24} color="white" solid />
          <Text variant="small" weight="bold" color="primary-foreground">
            RESET
          </Text>
        </TouchableOpacity>

        <Card style={styles.volumeCard}>
          <CardContent style={styles.volumeContent}>
            <TouchableOpacity onPress={() => setIsMuted((prev) => !prev)} style={styles.muteButton}>
              <FontAwesome5 name={isMuted ? 'volume-mute' : 'volume-up'} size={18} color="white" solid />
            </TouchableOpacity>
            <View style={styles.volumeSliderWrap}>
              <Slider
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor="white"
                disabled={isMuted}
              />
            </View>
            <Text variant="small" color="muted" style={styles.volumeValue}>
              {isMuted ? 'Muted' : `${volume}%`}
            </Text>
          </CardContent>
        </Card>

        <TouchableOpacity
          style={styles.settingsToggle}
          onPress={() => setShowSettings((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Text variant="body" weight="semiBold" color="foreground">
            Settings & Options
          </Text>
          <FontAwesome5 name={showSettings ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {showSettings && (
          <Card style={styles.settingsCard}>
            <CardContent style={styles.settingsContent}>
              <Text variant="body" weight="semiBold" color="foreground">
                Timing
              </Text>

              <View style={styles.settingRow}>
                <View style={styles.settingHeader}>
                  <Text variant="small" color="muted">Marks to Set</Text>
                  <Text variant="small" color="foreground">{marksDelay.toFixed(1)}s</Text>
                </View>
                <Slider
                  minimumValue={1}
                  maximumValue={20}
                  value={marksDelay}
                  step={0.5}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.border}
                  thumbTintColor={theme.colors.primary}
                  onValueChange={setMarksDelay}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingHeader}>
                  <Text variant="small" color="muted">Set to Gun</Text>
                  <Text variant="small" color="foreground">{setDelayValue.toFixed(1)}s</Text>
                </View>
                <Slider
                  minimumValue={0.5}
                  maximumValue={10}
                  value={setDelayValue}
                  step={0.5}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.border}
                  thumbTintColor={theme.colors.primary}
                  onValueChange={setSetDelayValue}
                />
              </View>

              <View style={styles.switchRow}>
                <Text variant="small" color="muted">Randomize gun timing</Text>
                <Switch
                  value={useRandomizer}
                  onValueChange={setUseRandomizer}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={theme.colors.foreground}
                />
              </View>
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
    gap: theme.spacing.lg,
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
  },
  startButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  startButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  resetButton: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.darkGray,
  },
  resetButtonDisabled: {
    opacity: 0.4,
  },
  volumeCard: {
    marginBottom: 0,
  },
  volumeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  muteButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.lightGray,
  },
  volumeSliderWrap: {
    flex: 1,
  },
  volumeValue: {
    width: 64,
    textAlign: 'right',
  },
  settingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
  },
  settingsCard: {
    marginBottom: 0,
  },
  settingsContent: {
    gap: theme.spacing.md,
  },
  settingRow: {
    gap: theme.spacing.sm,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

