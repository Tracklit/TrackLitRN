import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

interface JournalEntry {
  id: number;
  userId: number;
  content: string;
  mood?: string;
  energy?: number;
  createdAt: string;
}

const MOODS = ['😊 Great', '🙂 Good', '😐 Okay', '😔 Low', '😫 Exhausted'];

export const JournalScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState(5);

  // Fetch recent journal entries
  const journalQuery = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => apiRequest<JournalEntry[]>('/api/journal'),
    enabled: isAuthenticated && !isGuest,
  });

  // Create journal entry mutation
  const createMutation = useMutation({
    mutationFn: (data: { content: string; mood?: string; energy?: number }) =>
      apiRequest('/api/journal', {
        method: 'POST',
        data,
      }),
    onSuccess: () => {
      setContent('');
      setSelectedMood(null);
      setEnergy(5);
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      Alert.alert('Success', 'Journal entry saved!');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to save journal entry.');
    },
  });

  const handleSave = () => {
    if (!isAuthenticated || isGuest) {
      Alert.alert('Login Required', 'Please sign in to save journal entries.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Empty Entry', 'Please write something in your journal.');
      return;
    }

    createMutation.mutate({
      content: content.trim(),
      mood: selectedMood || undefined,
      energy,
    });
  };

  const entries = journalQuery.data ?? [];

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + theme.spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              Training Journal
            </Text>
            <View style={styles.backButton} />
          </View>

          {/* New Entry Card */}
          <Card style={styles.entryCard}>
            <CardHeader>
              <CardTitle>New Entry</CardTitle>
            </CardHeader>
            <CardContent style={styles.entryContent}>
              {/* Mood Selection */}
              <Text variant="body" weight="medium" color="foreground" style={styles.label}>
                How are you feeling?
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.moodScroll}
              >
                <View style={styles.moodRow}>
                  {MOODS.map((mood) => (
                    <TouchableOpacity
                      key={mood}
                      style={[
                        styles.moodButton,
                        selectedMood === mood && styles.moodButtonSelected,
                      ]}
                      onPress={() => setSelectedMood(mood === selectedMood ? null : mood)}
                    >
                      <Text variant="small" color={selectedMood === mood ? 'primary' : 'muted'}>
                        {mood}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Energy Level */}
              <Text variant="body" weight="medium" color="foreground" style={styles.label}>
                Energy Level: {energy}/10
              </Text>
              <View style={styles.energyRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.energyButton,
                      energy >= level && styles.energyButtonFilled,
                    ]}
                    onPress={() => setEnergy(level)}
                  >
                    <Text variant="small" color={energy >= level ? 'primary-foreground' : 'muted'}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Journal Content */}
              <Text variant="body" weight="medium" color="foreground" style={styles.label}>
                What's on your mind?
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Write about your training, how you felt, what you learned..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={6}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />

              {/* Save Button */}
              <Button
                variant="default"
                size="lg"
                onPress={handleSave}
                loading={createMutation.isPending}
                style={styles.saveButton}
              >
                <FontAwesome5 name="save" size={16} color="white" solid />
                <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                  Save Entry
                </Text>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Entries */}
          <Text variant="h4" weight="semiBold" color="foreground" style={styles.sectionTitle}>
            Recent Entries
          </Text>

          {journalQuery.isLoading ? (
            <Text variant="body" color="muted" style={styles.emptyText}>
              Loading entries...
            </Text>
          ) : entries.length === 0 ? (
            <Text variant="body" color="muted" style={styles.emptyText}>
              No journal entries yet. Start writing above!
            </Text>
          ) : (
            entries.slice(0, 5).map((entry) => (
              <Card key={entry.id} style={styles.historyCard}>
                <CardContent>
                  <View style={styles.historyHeader}>
                    <Text variant="small" color="muted">
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </Text>
                    {entry.mood && (
                      <Text variant="small" color="muted">
                        {entry.mood}
                      </Text>
                    )}
                  </View>
                  <Text variant="body" color="foreground" style={styles.historyContent}>
                    {entry.content}
                  </Text>
                  {entry.energy && (
                    <Text variant="small" color="muted">
                      Energy: {entry.energy}/10
                    </Text>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
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
  entryCard: {
    marginBottom: 0,
  },
  entryContent: {
    gap: theme.spacing.md,
  },
  label: {
    marginTop: theme.spacing.sm,
  },
  moodScroll: {
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  moodRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.lg,
  },
  moodButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  moodButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  energyRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  energyButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  energyButtonFilled: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  textInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    fontSize: 16,
    lineHeight: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  buttonText: {
    marginLeft: theme.spacing.sm,
  },
  sectionTitle: {
    marginTop: theme.spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  historyCard: {
    marginBottom: theme.spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  historyContent: {
    marginBottom: theme.spacing.sm,
  },
});

