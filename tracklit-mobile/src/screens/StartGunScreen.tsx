import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import theme from '@/utils/theme';

const marksAudio = require('../../assets/audio/on-your-marks.mp3');
const setAudio = require('../../assets/audio/set.mp3');
const bangAudio = require('../../assets/audio/bang.mp3');

Sound.setCategory('Playback');

const playSound = (sound: Sound | null): Promise<void> =>
  new Promise((resolve) => {
    if (!sound) {
      resolve();
      return;
    }
    sound.stop(() => {
      sound.play(() => {
        resolve();
      });
    });
  });

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      resolve();
    }, ms);
  });

export const StartGunScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [marksDelay, setMarksDelay] = useState(2);
  const [setDelayValue, setSetDelayValue] = useState(1);
  const [randomOffset, setRandomOffset] = useState(0.5);
  const [isRunning, setIsRunning] = useState(false);
  const marksRef = useRef<Sound | null>(null);
  const setRef = useRef<Sound | null>(null);
  const bangRef = useRef<Sound | null>(null);

  useEffect(() => {
    marksRef.current = new Sound(marksAudio, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('Failed to load on-your-marks audio', error);
      }
    });
    setRef.current = new Sound(setAudio, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('Failed to load set audio', error);
      }
    });
    bangRef.current = new Sound(bangAudio, Sound.MAIN_BUNDLE, (error) => {
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

  const startSequence = async () => {
    if (isRunning) return;
    try {
      setIsRunning(true);
      await playSound(marksRef.current);
      await delay(marksDelay * 1000);
      await playSound(setRef.current);
      const randomExtra =
        Math.random() * randomOffset - randomOffset / 2;
      const gunDelay = Math.max(0.2, setDelayValue + randomExtra);
      await delay(gunDelay * 1000);
      await playSound(bangRef.current);
    } catch (error) {
      Alert.alert('Start gun error', 'Unable to play audio sequence.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.content}>
        <Text variant="h2" weight="bold" color="foreground" style={styles.heading}>
          Start Gun
        </Text>
        <Text variant="body" color="muted">
          Practice your race starts with customizable delays.
        </Text>

        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <Text variant="body" weight="medium" color="foreground">
              On Your Marks → Set Delay
            </Text>
            <Text variant="small" color="muted">
              {marksDelay.toFixed(1)}s
            </Text>
            <Slider
              minimumValue={1}
              maximumValue={4}
              value={marksDelay}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={theme.colors.primary}
              step={0.1}
              onValueChange={setMarksDelay}
            />
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <Text variant="body" weight="medium" color="foreground">
              Set → Gun Delay
            </Text>
            <Text variant="small" color="muted">
              {setDelayValue.toFixed(1)}s ± {(randomOffset / 2).toFixed(1)}s
            </Text>
            <Slider
              minimumValue={0.5}
              maximumValue={3}
              value={setDelayValue}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={theme.colors.primary}
              step={0.1}
              onValueChange={setSetDelayValue}
            />
            <Text variant="small" color="muted" style={styles.randomLabel}>
              Random variation
            </Text>
            <Slider
              minimumValue={0}
              maximumValue={2}
              value={randomOffset}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={theme.colors.primary}
              step={0.1}
              onValueChange={setRandomOffset}
            />
          </CardContent>
        </Card>

        <View style={styles.actions}>
          <Button
            variant="default"
            size="lg"
            onPress={startSequence}
            disabled={isRunning}
            style={styles.actionButton}
          >
            {isRunning ? 'Sequence Running...' : 'Start Sequence'}
          </Button>
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
    paddingBottom: theme.spacing.xl * 2,
    gap: theme.spacing.lg,
  },
  heading: {
    marginTop: theme.spacing.lg,
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    gap: theme.spacing.sm,
  },
  randomLabel: {
    marginTop: theme.spacing.md,
  },
  actions: {
    marginTop: theme.spacing.xl,
  },
  actionButton: {
    width: '100%',
  },
});

