import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useMutation } from '@tanstack/react-query';

import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { getToken } from '@/lib/tokenStorage';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { env } from '@/config/env';
import theme from '@/utils/theme';

type JournalEntryRouteProp = RouteProp<RootStackParamList, 'JournalEntry'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const JournalEntryScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<JournalEntryRouteProp>();
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

  const hasVoiceAccess = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'star' || user?.isPremium === true;

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

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: nextRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(nextRecording);
      setIsRecording(true);
      setRecordingUri(null);
    } catch (error) {
      console.error('Error starting recording:', error);
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
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Unable to stop recording.');
    }
  };

  const handlePlayRecording = async () => {
    if (!recordingUri) return;
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: nextSound } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(nextSound);
      setIsPlaying(true);
      await nextSound.playAsync();
      nextSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing recording:', error);
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
      formData.append('audio', {
        uri: recordingUri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as any);

      const token = await getToken();
      const response = await fetch(`${env.API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to transcribe');
      }

      if (data?.text) {
        setNotes((prev) => `${prev ? `${prev}\n\n` : ''}${data.text}`);
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
      Alert.alert('Transcription Error', error.message || 'Unable to transcribe recording.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" color="foreground">
          Journal Entry
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="body" color="muted">
          {date}
        </Text>

        <View style={styles.section}>
          <Text variant="body" weight="semiBold" color="foreground">
            Title
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter journal entry title..."
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Text variant="body" weight="semiBold" color="foreground">
            Notes
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Write your thoughts about today's training..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.section}>
          <Text variant="body" weight="semiBold" color="foreground">
            Voice Note
          </Text>
          <View style={styles.voiceRow}>
            <Button
              variant={isRecording ? 'outline' : 'default'}
              size="sm"
              onPress={isRecording ? handleStopRecording : handleStartRecording}
              disabled={!hasVoiceAccess}
            >
              {isRecording ? 'Stop recording' : 'Start recording'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={handlePlayRecording}
              disabled={!recordingUri || isPlaying}
            >
              {isPlaying ? 'Playing...' : 'Play'}
            </Button>
          </View>
          <Button
            variant="outline"
            size="sm"
            onPress={handleTranscribe}
            loading={isTranscribing}
            disabled={!recordingUri || !hasVoiceAccess}
          >
            Transcribe to notes
          </Button>
          {!hasVoiceAccess && (
            <Text variant="caption" color="muted">
              Voice transcription is available for Pro and Star members.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text variant="body" weight="semiBold" color="foreground">
            Mood Rating: {moodRating}/10
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={moodRating}
            onValueChange={setMoodRating}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text variant="body" weight="semiBold" color="foreground">
              Make this entry public
            </Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.foreground}
            />
          </View>
        </View>

        <Button
          variant="default"
          size="lg"
          onPress={handleSave}
          loading={createMutation.isPending}
        >
          <Text variant="body" weight="bold" color="primary-foreground">
            Save Entry
          </Text>
        </Button>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  section: {
    gap: theme.spacing.sm,
  },
  voiceRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  slider: {
    width: '100%',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

