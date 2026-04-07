import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Microphone,
  Stop,
  Play,
  TextT,
  FloppyDisk,
  Lock,
} from 'phosphor-react-native';
import { useMutation } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { getToken } from '@/lib/tokenStorage';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { env } from '@/config/env';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
type JournalEntryRouteProp = RouteProp<RootStackParamList, 'JournalEntry'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;


const getMoodLabel = (val: number) => {
  if (val <= 2) return 'Poor';
  if (val <= 4) return 'Low';
  if (val <= 6) return 'Okay';
  if (val <= 8) return 'Good';
  return 'Great';
};

const getMoodColor = (val: number) => {
  if (val <= 3) return '#ef4444';
  if (val <= 5) return '#f97316';
  if (val <= 7) return '#eab308';
  return '#22c55e';
};

export const JournalEntryScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
  const navigation = useNavigation<Navigation>();
  const route = useRoute<JournalEntryRouteProp>();
  const insets = useSafeAreaInsets();
  const dateParam = route.params?.date;
  const date = dateParam || new Date().toISOString().split('T')[0];
  const { user } = useAuth();

  const [title, setTitle] = useState(`Journal Entry - ${date}`);
  const [notes, setNotes] = useState('');
  const [moodRating, setMoodRating] = useState(5);
  const [isPublic, setIsPublic] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const hasVoiceAccess = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'star' || (user as any)?.isPremium === true;

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => undefined);
      }
    };
  }, [sound]);

  const createMutation = useMutation({
    mutationFn: async () =>
      apiRequest('/api/journal', {
        method: 'POST',
        data: {
          title: title.trim(),
          notes: notes.trim(),
          type: 'workout',
          isPublic,
          content: {
            mood: moodRating,
            date,
          },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      Alert.alert('Saved', 'Your journal entry has been saved.');
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to save journal entry.');
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your journal entry.');
      return;
    }
    createMutation.mutate();
  };

  const handleStartRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is required to record audio.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: nextRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(nextRecording);
      setIsRecording(true);
      setRecordingUri(null);
    } catch (error) {
      Alert.alert('Recording Error', 'Unable to start recording.');
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setRecordingUri(uri ?? null);
    } catch (error) {
      Alert.alert('Recording Error', 'Unable to stop recording.');
    }
  };

  const handlePlayRecording = async () => {
    if (!recordingUri) return;
    try {
      if (sound) await sound.unloadAsync();
      const { sound: nextSound } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(nextSound);
      setIsPlaying(true);
      await nextSound.playAsync();
      nextSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) setIsPlaying(false);
      });
    } catch (error) {
      Alert.alert('Playback Error', 'Unable to play recording.');
    }
  };

  const handleTranscribe = async () => {
    if (!recordingUri) {
      Alert.alert('No Recording', 'Record audio before transcribing.');
      return;
    }
    if (!hasVoiceAccess) {
      Alert.alert('Premium Required', 'Voice transcription requires a Pro or Star subscription.');
      return;
    }
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', { uri: recordingUri, name: 'recording.m4a', type: 'audio/m4a' } as any);
      const token = await getToken();
      const response = await fetch(`${env.API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to transcribe');
      if (data?.text) setNotes((prev) => `${prev ? `${prev}\n\n` : ''}${data.text}`);
    } catch (error: any) {
      Alert.alert('Transcription Error', error.message || 'Unable to transcribe recording.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const moodColor = getMoodColor(moodRating);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={18} color={theme.colors.textSecondary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal Entry</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAwareScreenScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={80}
      >
        <Text style={styles.dateLabel}>{date}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter journal entry title..."
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.brandOrange}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Write your thoughts about today's training..."
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.brandOrange}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Voice Note</Text>
            {!hasVoiceAccess && (
              <View style={styles.premiumBadge}>
                <Lock size={10} color={theme.colors.brandOrange} weight="fill" />
                <Text style={styles.premiumBadgeText}>Pro</Text>
              </View>
            )}
          </View>

          <View style={styles.voiceRow}>
            <TouchableOpacity
              style={[
                styles.voiceBtn,
                isRecording ? styles.voiceBtnActive : styles.voiceBtnDefault,
                !hasVoiceAccess && styles.voiceBtnDisabled,
              ]}
              onPress={isRecording ? handleStopRecording : handleStartRecording}
              disabled={!hasVoiceAccess}
              activeOpacity={0.7}
            >
              {isRecording
                ? <Stop size={14} color="#ef4444" weight="fill" />
                : <Microphone size={14} color={hasVoiceAccess ? theme.colors.brandOrange : theme.colors.textMuted} weight="fill" />}
              <Text style={[styles.voiceBtnText, isRecording && { color: theme.colors.destructive }, !hasVoiceAccess && { color: theme.colors.textMuted }]}>
                {isRecording ? 'Stop' : 'Record'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.voiceBtn,
                styles.voiceBtnDefault,
                (!recordingUri || isPlaying) && styles.voiceBtnDisabled,
              ]}
              onPress={handlePlayRecording}
              disabled={!recordingUri || isPlaying}
              activeOpacity={0.7}
            >
              <Play size={14} color={recordingUri && !isPlaying ? theme.colors.brandOrange : theme.colors.textMuted} weight="fill" />
              <Text style={[styles.voiceBtnText, (!recordingUri || isPlaying) && { color: theme.colors.textMuted }]}>
                {isPlaying ? 'Playing…' : 'Play'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.voiceBtn,
                styles.voiceBtnDefault,
                (!recordingUri || !hasVoiceAccess || isTranscribing) && styles.voiceBtnDisabled,
              ]}
              onPress={handleTranscribe}
              disabled={!recordingUri || !hasVoiceAccess || isTranscribing}
              activeOpacity={0.7}
            >
              {isTranscribing
                ? <ActivityIndicator size={14} color={theme.colors.brandOrange} />
                : <TextT size={14} color={recordingUri && hasVoiceAccess ? theme.colors.brandOrange : theme.colors.textMuted} weight="fill" />}
              <Text style={[styles.voiceBtnText, (!recordingUri || !hasVoiceAccess) && { color: theme.colors.textMuted }]}>
                {isTranscribing ? 'Working…' : 'Transcribe'}
              </Text>
            </TouchableOpacity>
          </View>

          {recordingUri && !isRecording && (
            <View style={styles.recordingReadyBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingReadyText}>Recording ready</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Mood</Text>
            <View style={[styles.moodBadge, { backgroundColor: `${moodColor}20` }]}>
              <Text style={[styles.moodBadgeText, { color: moodColor }]}>
                {moodRating}/10 · {getMoodLabel(moodRating)}
              </Text>
            </View>
          </View>
          <View style={styles.sliderWrap}>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={moodRating}
              onValueChange={setMoodRating}
              minimumTrackTintColor={moodColor}
              maximumTrackTintColor={theme.colors.overlayLight}
              thumbTintColor={moodColor}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>1</Text>
              <Text style={styles.sliderLabel}>10</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={{ gap: 2 }}>
              <Text style={styles.sectionLabel}>Public Entry</Text>
              <Text style={styles.switchSub}>Visible to your followers</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: theme.colors.overlayLight, true: theme.colors.brandOrange }}
              thumbColor={theme.colors.textPrimary}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, createMutation.isPending && styles.saveBtnLoading]}
          onPress={handleSave}
          disabled={createMutation.isPending}
          activeOpacity={0.85}
        >
          {createMutation.isPending
            ? <ActivityIndicator size={18} color={theme.colors.textPrimary} />
            : <FloppyDisk size={18} color={theme.colors.textPrimary} weight="fill" />}
          <Text style={styles.saveBtnText}>
            {createMutation.isPending ? 'Saving…' : 'Save Entry'}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScreenScrollView>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.backgroundSolid,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: t.colors.overlayLight,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: t.colors.overlaySubtle,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: t.colors.textPrimary,
    letterSpacing: 0.3,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 24,
  },
  dateLabel: {
    fontSize: 13,
    color: t.colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: t.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderColor: t.colors.overlayLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: t.colors.textPrimary,
    backgroundColor: t.colors.overlaySubtle,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  voiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  voiceBtnDefault: {
    backgroundColor: t.colors.overlaySubtle,
    borderColor: t.colors.overlayLight,
  },
  voiceBtnActive: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  voiceBtnDisabled: {
    opacity: 0.4,
  },
  voiceBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: t.colors.brandOrange,
  },
  recordingReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(34,197,94,0.25)',
    alignSelf: 'flex-start',
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: t.colors.success,
  },
  recordingReadyText: {
    fontSize: 12,
    fontWeight: '600',
    color: t.colors.success,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: t.colors.brandOrangeLight,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.3)',
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: t.colors.brandOrange,
  },
  sliderWrap: {
    gap: 4,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sliderLabel: {
    fontSize: 11,
    color: t.colors.textMuted,
  },
  moodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  moodBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: t.colors.overlayLight,
  },
  switchSub: {
    fontSize: 12,
    color: t.colors.textMuted,
    marginTop: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: t.colors.brandOrange,
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveBtnLoading: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: t.colors.textPrimary,
    letterSpacing: 0.3,
  },
});
