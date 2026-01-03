import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import { Text } from '../components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '../utils/theme';

interface SavedWorkout {
  id: number;
  userId: number;
  title: string;
  description?: string | null;
  category?: string;
  content: any; // workout content can be complex
  createdAt: string;
}

interface JournalEntry {
  id: number;
  userId: number;
  title: string;
  notes?: string | null;
  type?: string;
  content?: {
    moodRating?: number;
    mood?: string;
    shortWorkout?: string;
    mediumWorkout?: string;
    longWorkout?: string;
    date?: string;
  };
  isPublic?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Mood options for journal entries
const moodOptions = [
  { label: '😊 Great', value: 'great' },
  { label: '😌 Good', value: 'good' },
  { label: '😐 Okay', value: 'okay' },
  { label: '😩 Tired', value: 'tired' },
  { label: '😤 Frustrated', value: 'frustrated' },
];

// Workout type options
const workoutTypes = [
  'Sprint Training',
  'Speed Endurance',
  'Tempo Run',
  'Strength Training',
  'Recovery',
  'Competition',
  'Technical Drills',
  'Other',
];

export const PracticeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'workouts' | 'journal'>('workouts');
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });

  // Modal states
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);

  // Workout form state
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutType, setWorkoutType] = useState('Sprint Training');

  // Journal form state
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood] = useState('good');

  // Fetch saved workouts from workout library
  const practiceQuery = useQuery({
    queryKey: ['workout-library'],
    queryFn: async () => {
      const response = await apiRequest<{ workouts: SavedWorkout[]; totalSaved: number }>('/api/workout-library');
      return response.workouts ?? [];
    },
    enabled: isAuthenticated && !isGuest,
  });

  // Fetch journal entries  
  const journalQuery = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => apiRequest<JournalEntry[]>('/api/journal'),
    enabled: isAuthenticated && !isGuest,
  });

  // Create workout mutation - saves to workout library
  const createWorkoutMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; duration: number; workoutType: string }) => {
      return apiRequest('/api/workout-library', {
        method: 'POST',
        data: {
          title: data.title,
          description: data.description,
          category: data.workoutType,
          content: {
            type: data.workoutType,
            duration: data.duration,
            description: data.description,
            createdFromMobile: true,
          },
          isPublic: false,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-library'] });
      setShowWorkoutModal(false);
      resetWorkoutForm();
      Alert.alert('Success', 'Workout saved to library!');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to save workout. Please try again.');
    },
  });

  // Create journal entry mutation
  const createJournalMutation = useMutation({
    mutationFn: async (data: { notes: string; mood: string }) => {
      const today = new Date().toISOString().split('T')[0];
      return apiRequest('/api/journal', {
        method: 'POST',
        data: {
          title: `Training Journal - ${today}`,
          notes: data.notes,
          type: 'training',
          content: {
            mood: data.mood,
            moodRating: getMoodRating(data.mood),
            date: today,
          },
          isPublic: false,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setShowJournalModal(false);
      resetJournalForm();
      Alert.alert('Success', 'Journal entry saved!');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to save journal entry. Please try again.');
    },
  });

  // Helper to convert mood to rating
  const getMoodRating = (mood: string): number => {
    switch (mood) {
      case 'great': return 10;
      case 'good': return 8;
      case 'okay': return 6;
      case 'tired': return 4;
      case 'frustrated': return 3;
      default: return 5;
    }
  };

  const resetWorkoutForm = () => {
    setWorkoutTitle('');
    setWorkoutDescription('');
    setWorkoutDuration('');
    setWorkoutType('Sprint Training');
  };

  const resetJournalForm = () => {
    setJournalContent('');
    setJournalMood('good');
  };

  const handleRefresh = () => {
    if (activeTab === 'workouts') {
      practiceQuery.refetch();
    } else {
      journalQuery.refetch();
    }
  };

  const handleAddWorkout = () => {
    if (!isAuthenticated || isGuest) {
      Alert.alert('Login Required', 'Please sign in to add workouts.');
      return;
    }
    setShowWorkoutModal(true);
  };

  const handleAddJournalEntry = () => {
    if (!isAuthenticated || isGuest) {
      Alert.alert('Login Required', 'Please sign in to add journal entries.');
      return;
    }
    setShowJournalModal(true);
  };

  const handleSubmitWorkout = () => {
    if (!workoutTitle.trim()) {
      Alert.alert('Required', 'Please enter a workout title.');
      return;
    }

    const duration = parseInt(workoutDuration, 10) || 0;
    
    createWorkoutMutation.mutate({
      title: workoutTitle.trim(),
      description: workoutDescription.trim(),
      duration,
      workoutType: workoutType,
    });
  };

  const handleSubmitJournal = () => {
    if (!journalContent.trim()) {
      Alert.alert('Required', 'Please enter some content for your journal entry.');
      return;
    }

    createJournalMutation.mutate({
      notes: journalContent.trim(),
      mood: journalMood,
    });
  };

  // Calculate stats from API data
  const workouts = practiceQuery.data ?? [];
  const journalEntries = journalQuery.data ?? [];
  
  // Calculate this week's workouts
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekWorkouts = workouts.filter(w => new Date(w.createdAt) >= oneWeekAgo);
  
  // Calculate total hours (sum of durations)
  const totalMinutes = workouts.reduce((sum, w) => sum + (w.content?.duration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Calculate streak (consecutive days with workouts)
  const calculateStreak = () => {
    if (workouts.length === 0) return 0;
    const dates = workouts.map(w => new Date(w.createdAt).toDateString());
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < uniqueDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      if (uniqueDates.includes(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const isLoading = practiceQuery.isLoading || journalQuery.isLoading;
  const isRefreshing = practiceQuery.isFetching || journalQuery.isFetching;

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <ScreenHeader
          title="Practice"
          subtitle="Track your training progress"
          containerStyle={styles.header}
        />

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard 
            title="This Week" 
            value={isLoading ? '-' : String(thisWeekWorkouts.length)} 
            subtitle="workouts" 
            loading={isLoading}
          />
          <StatCard 
            title="Total Hours" 
            value={isLoading ? '-' : totalHours} 
            subtitle="training" 
            loading={isLoading}
          />
          <StatCard 
            title="Streak" 
            value={isLoading ? '-' : String(calculateStreak())} 
            subtitle="days" 
            loading={isLoading}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'workouts' && styles.activeTab]}
            onPress={() => setActiveTab('workouts')}
            data-testid="tab-workouts"
          >
            <Text 
              variant="body" 
              weight="medium"
              style={[
                styles.tabText,
                activeTab === 'workouts' && styles.activeTabText
              ]}
            >
              Workouts
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'journal' && styles.activeTab]}
            onPress={() => setActiveTab('journal')}
            data-testid="tab-journal"
          >
            <Text 
              variant="body" 
              weight="medium"
              style={[
                styles.tabText,
                activeTab === 'journal' && styles.activeTabText
              ]}
            >
              Journal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'workouts' ? (
          <WorkoutsTab 
            workouts={workouts} 
            isLoading={practiceQuery.isLoading}
            isError={practiceQuery.isError}
            isGuest={isGuest}
          />
        ) : (
          <JournalTab 
            entries={journalEntries}
            isLoading={journalQuery.isLoading}
            isError={journalQuery.isError}
            isGuest={isGuest}
            onAddEntry={handleAddJournalEntry}
          />
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={activeTab === 'workouts' ? handleAddWorkout : handleAddJournalEntry}
        data-testid="button-add-workout"
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.deepGold]}
          style={styles.fabGradient}
        >
          <FontAwesome5 name="plus" size={20} color={theme.colors.primaryForeground} solid />
        </LinearGradient>
      </TouchableOpacity>

      {/* Workout Creation Modal */}
      <Modal
        visible={showWorkoutModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h3" weight="bold" color="foreground">
                Log Workout
              </Text>
              <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
                <FontAwesome5 name="times" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Title */}
              <View style={styles.formGroup}>
                <Text variant="body" weight="medium" color="foreground" style={styles.label}>
                  Title *
                </Text>
                <TextInput
                  style={styles.input}
                  value={workoutTitle}
                  onChangeText={setWorkoutTitle}
                  placeholder="e.g., Morning Sprint Session"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>

              {/* Workout Type */}
              <View style={styles.formGroup}>
                <Text variant="body" weight="medium" color="foreground" style={styles.label}>
                  Workout Type
                </Text>
                <View style={styles.typeSelector}>
                  {workoutTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        workoutType === type && styles.typeOptionSelected
                      ]}
                      onPress={() => setWorkoutType(type)}
                    >
                      <Text 
                        variant="small" 
                        color={workoutType === type ? 'primary' : 'muted'}
                        weight={workoutType === type ? 'semiBold' : 'regular'}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Duration */}
              <View style={styles.formGroup}>
                <Text variant="body" weight="medium" color="foreground" style={styles.label}>
                  Duration (minutes)
                </Text>
                <TextInput
                  style={styles.input}
                  value={workoutDuration}
                  onChangeText={setWorkoutDuration}
                  placeholder="e.g., 60"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text variant="body" weight="medium" color="foreground" style={styles.label}>
                  Description
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={workoutDescription}
                  onChangeText={setWorkoutDescription}
                  placeholder="What did you work on today?"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button 
                variant="outline" 
                onPress={() => setShowWorkoutModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                onPress={handleSubmitWorkout}
                loading={createWorkoutMutation.isPending}
                style={styles.modalButton}
              >
                Save Workout
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Journal Entry Modal */}
      <Modal
        visible={showJournalModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowJournalModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h3" weight="bold" color="foreground">
                New Journal Entry
              </Text>
              <TouchableOpacity onPress={() => setShowJournalModal(false)}>
                <FontAwesome5 name="times" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Mood Selector */}
              <View style={styles.formGroup}>
                <Text variant="body" weight="medium" color="foreground" style={styles.label}>
                  How are you feeling?
                </Text>
                <View style={styles.moodSelector}>
                  {moodOptions.map((mood) => (
                    <TouchableOpacity
                      key={mood.value}
                      style={[
                        styles.moodOption,
                        journalMood === mood.value && styles.moodOptionSelected
                      ]}
                      onPress={() => setJournalMood(mood.value)}
                    >
                      <Text variant="body" color={journalMood === mood.value ? 'primary' : 'muted'}>
                        {mood.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Journal Content */}
              <View style={styles.formGroup}>
                <Text variant="body" weight="medium" color="foreground" style={styles.label}>
                  Your thoughts *
                </Text>
                <TextInput
                  style={[styles.input, styles.journalTextArea]}
                  value={journalContent}
                  onChangeText={setJournalContent}
                  placeholder="What's on your mind? How was training today? Any insights or breakthroughs?"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button 
                variant="outline" 
                onPress={() => setShowJournalModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                onPress={handleSubmitJournal}
                loading={createJournalMutation.isPending}
                style={styles.modalButton}
              >
                Save Entry
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, loading }) => (
  <Card style={styles.statCard}>
    <CardContent style={styles.statCardContent}>
      <Text variant="small" color="muted" weight="medium">
        {title}
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <Text variant="h3" weight="bold" color="primary">
          {value}
        </Text>
      )}
      <Text variant="small" color="muted">
        {subtitle}
      </Text>
    </CardContent>
  </Card>
);

interface WorkoutsTabProps {
  workouts: SavedWorkout[];
  isLoading: boolean;
  isError: boolean;
  isGuest: boolean;
}

const WorkoutsTab: React.FC<WorkoutsTabProps> = ({ workouts, isLoading, isError, isGuest }) => {
  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="user-lock" size={48} color={theme.colors.textMuted} solid />
        <Text variant="body" color="muted" style={styles.emptyText}>
          Sign in to view and track your workouts
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="body" color="muted" style={styles.emptyText}>
          Loading workouts...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="exclamation-circle" size={48} color={theme.colors.textMuted} solid />
        <Text variant="body" color="muted" style={styles.emptyText}>
          Unable to load workouts. Pull to refresh.
        </Text>
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="dumbbell" size={48} color={theme.colors.textMuted} solid />
        <Text variant="body" color="muted" style={styles.emptyText}>
          No workouts recorded yet. Tap + to log your first workout!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.workoutsContainer}>
      {workouts.map((workout) => {
        const duration = workout.content?.duration;
        return (
          <Card key={workout.id} style={styles.workoutCard}>
            <CardHeader style={styles.workoutHeader}>
              <View style={styles.workoutTitleRow}>
                <CardTitle>{workout.title || 'Workout'}</CardTitle>
                <Badge variant="default" size="sm">
                  {workout.category || 'Training'}
                </Badge>
              </View>
              <View style={styles.workoutMeta}>
                <Text variant="small" color="muted">
                  {formatDistanceToNow(new Date(workout.createdAt), { addSuffix: true })}
                  {duration ? ` • ${duration} min` : ''}
                </Text>
                <FontAwesome5 
                  name="check-circle" 
                  size={16} 
                  color={theme.colors.success}
                  solid
                />
              </View>
            </CardHeader>
            
            {workout.description && (
              <CardContent>
                <Text variant="small" color="muted">
                  {workout.description}
                </Text>
              </CardContent>
            )}
          </Card>
        );
      })}
    </View>
  );
};

interface JournalTabProps {
  entries: JournalEntry[];
  isLoading: boolean;
  isError: boolean;
  isGuest: boolean;
  onAddEntry: () => void;
}

const JournalTab: React.FC<JournalTabProps> = ({ entries, isLoading, isError, isGuest, onAddEntry }) => {
  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="user-lock" size={48} color={theme.colors.textMuted} solid />
        <Text variant="body" color="muted" style={styles.emptyText}>
          Sign in to access your training journal
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.journalContainer}>
      <Card style={styles.journalCard}>
        <CardHeader>
          <CardTitle>Training Journal</CardTitle>
        </CardHeader>
        <CardContent>
          <Text variant="body" color="muted" style={styles.journalText}>
            Record your thoughts, feelings, and insights after each workout.
          </Text>
          
          <Button 
            variant="outline" 
            style={styles.journalButton}
            onPress={onAddEntry}
            data-testid="button-add-journal-entry"
          >
            <FontAwesome5 name="pen" size={16} color={theme.colors.primary} solid />
            <Text variant="body" weight="medium" color="primary" style={styles.journalButtonText}>
              Add Journal Entry
            </Text>
          </Button>
        </CardContent>
      </Card>
      
      {/* Recent Entries */}
      <View style={styles.recentEntries}>
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.recentTitle}>
          Recent Entries
        </Text>
        
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : isError ? (
          <Text variant="body" color="muted" style={styles.noEntries}>
            Unable to load journal entries.
          </Text>
        ) : entries.length === 0 ? (
          <Text variant="body" color="muted" style={styles.noEntries}>
            No journal entries yet. Start tracking your training insights!
          </Text>
        ) : (
          entries.slice(0, 5).map((entry) => {
            const mood = entry.content?.mood;
            const displayContent = entry.notes || (typeof entry.content === 'string' ? entry.content : '');
            return (
              <Card key={entry.id} style={styles.journalEntryCard}>
                <CardContent>
                  <Text variant="small" color="muted">
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    {mood && ` • Feeling: ${mood}`}
                  </Text>
                  {entry.title && (
                    <Text variant="body" weight="semiBold" color="foreground" style={styles.journalEntryTitle}>
                      {entry.title}
                    </Text>
                  )}
                  <Text variant="body" color="foreground" style={styles.journalEntryContent}>
                    {displayContent}
                  </Text>
                </CardContent>
              </Card>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.muted,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.background,
  },
  tabText: {
    color: theme.colors.textMuted,
  },
  activeTabText: {
    color: theme.colors.foreground,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  workoutsContainer: {
    gap: theme.spacing.md,
  },
  workoutCard: {
    marginBottom: theme.spacing.md,
  },
  workoutHeader: {
    paddingBottom: theme.spacing.sm,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  workoutMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journalContainer: {
    gap: theme.spacing.lg,
  },
  journalCard: {
    marginBottom: theme.spacing.lg,
  },
  journalText: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  journalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  journalButtonText: {
    marginLeft: theme.spacing.sm,
  },
  recentEntries: {
    alignItems: 'center',
  },
  recentTitle: {
    marginBottom: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  noEntries: {
    textAlign: 'center',
  },
  journalEntryCard: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  journalEntryTitle: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  journalEntryContent: {
    marginTop: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xl * 2,
    width: 56,
    height: 56,
    borderRadius: 28,
    ...theme.shadows.lg,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalForm: {
    padding: theme.spacing.lg,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    fontSize: 16,
    backgroundColor: theme.colors.card,
  },
  textArea: {
    minHeight: 100,
  },
  journalTextArea: {
    minHeight: 150,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  typeOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  typeOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  moodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  moodOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  moodOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    flex: 1,
  },
});
