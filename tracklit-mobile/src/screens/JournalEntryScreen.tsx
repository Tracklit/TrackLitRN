import React, { useState } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useMutation } from '@tanstack/react-query';

import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import theme from '@/utils/theme';

type JournalEntryRouteProp = RouteProp<RootStackParamList, 'JournalEntry'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const JournalEntryScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<JournalEntryRouteProp>();
  const dateParam = route.params?.date;
  const date = dateParam || new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(`Journal Entry - ${date}`);
  const [notes, setNotes] = useState('');
  const [type] = useState('workout');
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [motivation, setMotivation] = useState(5);
  const [confidence, setConfidence] = useState(5);
  const [soreness, setSoreness] = useState(5);
  const [isPublic, setIsPublic] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () =>
      apiRequest('/api/journal', {
        method: 'POST',
        data: {
          title: title.trim(),
          notes: notes.trim(),
          type,
          isPublic,
          content: {
            mood,
            energy,
            motivation,
            confidence,
            soreness,
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            How are you feeling? (1-10)
          </Text>
          {[
            { label: 'Mood', value: mood, setter: setMood },
            { label: 'Energy', value: energy, setter: setEnergy },
            { label: 'Motivation', value: motivation, setter: setMotivation },
            { label: 'Confidence', value: confidence, setter: setConfidence },
            { label: 'Soreness', value: soreness, setter: setSoreness },
          ].map((item) => (
            <View key={item.label} style={styles.sliderRow}>
              <Text variant="small" color="muted" style={styles.sliderLabel}>
                {item.label}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={item.value}
                onValueChange={item.setter}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />
              <Text variant="small" color="foreground" style={styles.sliderValue}>
                {item.value}
              </Text>
            </View>
          ))}
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
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sliderLabel: {
    width: 80,
  },
  slider: {
    flex: 1,
  },
  sliderValue: {
    width: 24,
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

