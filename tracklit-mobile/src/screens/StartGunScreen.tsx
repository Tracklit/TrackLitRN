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
import {
  ArrowLeft,
  Play,
  ArrowClockwise,
  SpeakerHigh,
  SpeakerSlash,
  CaretDown,
  CaretUp,
  Crosshair,
  GearSix,
  Flashlight,
} from 'phosphor-react-native';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { Text } from '@/components/ui/Text';
import themeStatic from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
const marksAudio = require('../../assets/audio/on-your-marks.mp3');
const setAudio = require('../../assets/audio/set.mp3');
const bangAudio = require('../../assets/audio/bang.mp3');

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      resolve();
    }, ms);
  });

type SequencePhase = 'idle' | 'marks' | 'marks-wait' | 'set' | 'set-wait' | 'bang' | 'done';

export const StartGunScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [marksDelay, setMarksDelay] = useState(2);
  const [setDelayValue, setSetDelayValue] = useState(1.5);
  const [useRandomizer, setUseRandomizer] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<SequencePhase>('idle');
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gunFlash, setGunFlash] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const sequenceIdRef = useRef(0);
  const torchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const marksRef = useRef<Audio.Sound | null>(null);
  const setRef = useRef<Audio.Sound | null>(null);
  const bangRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      setTorchOn(false);
    };
  }, [gunFlash]);

  useEffect(() => {
    const loadSounds = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound: marksSound } = await Audio.Sound.createAsync(marksAudio);
        marksRef.current = marksSound;

        const { sound: setSound } = await Audio.Sound.createAsync(setAudio);
        setRef.current = setSound;

        const { sound: bangSound } = await Audio.Sound.createAsync(bangAudio);
        bangRef.current = bangSound;
      } catch (error) {
        console.error('Failed to load audio files', error);
      }
    };

    loadSounds();

    return () => {
      marksRef.current?.unloadAsync();
      setRef.current?.unloadAsync();
      bangRef.current?.unloadAsync();
    };
  }, []);

  const playSound = async (sound: Audio.Sound | null): Promise<void> => {
    if (!sound) return;
    try {
      await sound.setVolumeAsync(isMuted ? 0 : volume / 100);
      await sound.setPositionAsync(0);
      await sound.playAsync();
      return new Promise((resolve) => {
        const checkStatus = async () => {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && !status.isPlaying) {
            resolve();
          } else {
            setTimeout(checkStatus, 100);
          }
        };
        setTimeout(checkStatus, 100);
      });
    } catch (error) {
      console.error('Error playing sound', error);
    }
  };

  const startSequence = async () => {
    if (isRunning) return;
    try {
      setIsRunning(true);
      sequenceIdRef.current += 1;
      const sequenceId = sequenceIdRef.current;

      setPhase('marks');
      await playSound(marksRef.current);
      if (sequenceIdRef.current !== sequenceId) return;

      setPhase('marks-wait');
      await delay(marksDelay * 1000);
      if (sequenceIdRef.current !== sequenceId) return;

      setPhase('set');
      await playSound(setRef.current);
      if (sequenceIdRef.current !== sequenceId) return;

      setPhase('set-wait');
      const randomExtra = useRandomizer ? (Math.random() * 2 - 1) * 1.0 : 0;
      const gunDelay = Math.max(0.1, setDelayValue + randomExtra);
      await delay(gunDelay * 1000);
      if (sequenceIdRef.current !== sequenceId) return;

      setPhase('bang');
      if (gunFlash && cameraPermission?.granted) {
        if (torchTimerRef.current) clearTimeout(torchTimerRef.current);
        setTorchOn(true);
        torchTimerRef.current = setTimeout(() => {
          setTorchOn(false);
          torchTimerRef.current = null;
        }, 300);
      }
      await playSound(bangRef.current);
      setPhase('done');
    } catch (error) {
      Alert.alert('Start gun error', 'Unable to play audio sequence.');
    } finally {
      setIsRunning(false);
      setTimeout(() => setPhase('idle'), 2000);
    }
  };

  const resetSequence = async () => {
    sequenceIdRef.current += 1;
    setIsRunning(false);
    setPhase('idle');
    if (torchTimerRef.current) {
      clearTimeout(torchTimerRef.current);
      torchTimerRef.current = null;
    }
    setTorchOn(false);
    try {
      await marksRef.current?.stopAsync();
      await setRef.current?.stopAsync();
      await bangRef.current?.stopAsync();
    } catch (error) {
      // Ignore errors when stopping sounds that aren't playing
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'marks': return 'ON YOUR MARKS';
      case 'marks-wait': return 'ON YOUR MARKS...';
      case 'set': return 'SET';
      case 'set-wait': return 'SET...';
      case 'bang': return 'GO!';
      case 'done': return 'COMPLETE';
      default: return 'READY';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'marks':
      case 'marks-wait': return '#FF9800';
      case 'set':
      case 'set-wait': return '#FFD600';
      case 'bang': return '#00FF88';
      case 'done': return '#00FF88';
      default: return 'rgba(255,255,255,0.5)';
    }
  };

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

        <View style={styles.phaseCardWrap}>
          <View style={[styles.phaseCard, phase !== 'idle' && styles.phaseCardActive]}>
            <Text style={[styles.phaseText, { color: getPhaseColor() }]}>
              {getPhaseLabel()}
            </Text>
          </View>
        </View>

        <View style={styles.center}>
          <View style={[styles.glow, phase === 'bang' && styles.glowActive]} />
          <TouchableOpacity
            style={[styles.startButton, isRunning && styles.startButtonActive]}
            onPress={startSequence}
            disabled={isRunning}
            activeOpacity={0.8}
          >
            {isRunning ? (
              <Crosshair size={52} color="#fff" weight="fill" />
            ) : (
              <Play size={52} color="#fff" weight="fill" />
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 25 }} />

        <TouchableOpacity
          style={[styles.resetButton, !isRunning && styles.resetButtonDisabled]}
          onPress={resetSequence}
          disabled={!isRunning}
          activeOpacity={0.8}
        >
          <ArrowClockwise size={16} color="#fff" weight="bold" />
          <Text variant="small" weight="bold" style={styles.resetText}>
            RESET
          </Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <TouchableOpacity onPress={() => setIsMuted((prev) => !prev)} style={styles.muteBtn}>
              {isMuted ? (
                <SpeakerSlash size={20} color="#FF3366" weight="fill" />
              ) : (
                <SpeakerHigh size={20} color="#fff" weight="fill" />
              )}
            </TouchableOpacity>
            <View style={styles.sliderWrap}>
              <Slider
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor="#FF9800"
                maximumTrackTintColor="rgba(255,255,255,0.15)"
                thumbTintColor="#fff"
                disabled={isMuted}
              />
            </View>
            <Text variant="small" style={styles.volumeLabel}>
              {isMuted ? 'Muted' : `${volume}%`}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.flashToggleLeft}>
              <Flashlight size={20} color={gunFlash ? '#FF9800' : 'rgba(255,255,255,0.5)'} weight="fill" />
              <Text variant="small" style={styles.settingLabel}>Gun Flash</Text>
            </View>
            <Switch
              value={gunFlash}
              onValueChange={async (val) => {
                if (val && !cameraPermission?.granted) {
                  const result = await requestCameraPermission();
                  if (!result.granted) {
                    Alert.alert('Permission Required', 'Camera permission is needed to use the device flash.');
                    return;
                  }
                }
                setGunFlash(val);
              }}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#FF9800' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.settingsToggle}
          onPress={() => setShowSettings((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={styles.settingsToggleLeft}>
            <GearSix size={18} color="rgba(255,255,255,0.6)" weight="fill" />
            <Text variant="body" weight="semiBold" style={styles.settingsToggleText}>
              Settings & Options
            </Text>
          </View>
          {showSettings ? (
            <CaretUp size={16} color="rgba(255,255,255,0.4)" weight="bold" />
          ) : (
            <CaretDown size={16} color="rgba(255,255,255,0.4)" weight="bold" />
          )}
        </TouchableOpacity>

        {showSettings && (
          <View style={styles.card}>
            <Text variant="body" weight="bold" style={styles.sectionLabel}>
              Timing
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingHeader}>
                <Text variant="small" style={styles.settingLabel}>Marks to Set</Text>
                <Text variant="small" style={styles.settingValue}>{marksDelay.toFixed(1)}s</Text>
              </View>
              <Slider
                minimumValue={1}
                maximumValue={20}
                value={marksDelay}
                step={0.5}
                minimumTrackTintColor="#FF9800"
                maximumTrackTintColor="rgba(255,255,255,0.15)"
                thumbTintColor="#FF9800"
                onValueChange={setMarksDelay}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingHeader}>
                <Text variant="small" style={styles.settingLabel}>Set to Gun</Text>
                <Text variant="small" style={styles.settingValue}>{setDelayValue.toFixed(1)}s</Text>
              </View>
              <Slider
                minimumValue={0.5}
                maximumValue={10}
                value={setDelayValue}
                step={0.5}
                minimumTrackTintColor="#FF9800"
                maximumTrackTintColor="rgba(255,255,255,0.15)"
                thumbTintColor="#FF9800"
                onValueChange={setSetDelayValue}
              />
            </View>

            <View style={styles.switchRow}>
              <Text variant="small" style={styles.settingLabel}>Randomize gun timing</Text>
              <Switch
                value={useRandomizer}
                onValueChange={setUseRandomizer}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#FF9800' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        )}
      </ScrollView>
      {gunFlash && cameraPermission?.granted && (
        <CameraView
          style={styles.hiddenCamera}
          facing="back"
          enableTorch={torchOn}
        />
      )}
    </LinearGradient>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: themeStatic.spacing.xl,
    gap: 16,
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
  phaseCardWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: t.colors.overlaySubtle,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(148,163,184,0.25)',
    alignSelf: 'center',
    minWidth: '50%',
    maxWidth: '60%',
  },
  phaseCardActive: {
    borderColor: 'rgba(255,152,0,0.4)',
    backgroundColor: 'rgba(255,152,0,0.06)',
  },
  phaseText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: t.colors.brandOrangeLight,
  },
  glowActive: {
    backgroundColor: 'rgba(0,255,136,0.25)',
  },
  startButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,152,0,0.2)',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  startButtonActive: {
    backgroundColor: 'rgba(255,152,0,0.35)',
    borderColor: '#FFD600',
  },
  resetButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: t.colors.overlayLight,
    borderWidth: 0.5,
    borderColor: t.colors.overlayMedium,
  },
  resetButtonDisabled: {
    opacity: 0.3,
  },
  resetText: {
    color: t.colors.textPrimary,
  },
  card: {
    backgroundColor: t.colors.overlaySubtle,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(148,163,184,0.25)',
    gap: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  muteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderWrap: {
    flex: 1,
  },
  volumeLabel: {
    color: t.colors.textMuted,
    width: 50,
    textAlign: 'right',
  },
  settingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: t.colors.overlaySubtle,
    borderWidth: 0.5,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  settingsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsToggleText: {
    color: t.colors.textPrimary,
  },
  sectionLabel: {
    color: '#FF9800',
    fontSize: 14,
  },
  settingRow: {
    gap: 4,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settingLabel: {
    color: t.colors.textSecondary,
  },
  settingValue: {
    color: t.colors.textPrimary,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  flashToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hiddenCamera: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
