import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import { Text } from '../components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import theme from '../utils/theme';

interface Workout {
  id: string;
  title: string;
  date: string;
  duration: string;
  type: 'Speed' | 'Endurance' | 'Strength' | 'Recovery';
  sets?: number;
  distance?: string;
  completed: boolean;
}

export const PracticeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'workouts' | 'journal'>('workouts');

  const mockWorkouts: Workout[] = [
    {
      id: '1',
      title: '400m Repeats',
      date: 'Today',
      duration: '45 min',
      type: 'Speed',
      sets: 6,
      distance: '2.4 km',
      completed: false,
    },
    {
      id: '2',
      title: 'Easy Run',
      date: 'Yesterday',
      duration: '30 min',
      type: 'Endurance',
      distance: '5 km',
      completed: true,
    },
    {
      id: '3',
      title: 'Strength Training',
      date: 'Dec 10',
      duration: '60 min',
      type: 'Strength',
      sets: 4,
      completed: true,
    },
  ];

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" weight="bold" color="foreground">
            Practice
          </Text>
          <Text variant="body" color="muted">
            Track your training progress
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard title="This Week" value="4" subtitle="workouts" />
          <StatCard title="Total Hours" value="3.2" subtitle="training" />
          <StatCard title="Streak" value="7" subtitle="days" />
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
          <WorkoutsTab workouts={mockWorkouts} />
        ) : (
          <JournalTab />
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        data-testid="button-add-workout"
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.deepGold]}
          style={styles.fabGradient}
        >
          <FontAwesome5 name="plus" size={20} color={theme.colors.primaryForeground} />
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle }) => (
  <Card style={styles.statCard}>
    <CardContent style={styles.statCardContent}>
      <Text variant="small" color="muted" weight="medium">
        {title}
      </Text>
      <Text variant="h3" weight="bold" color="primary">
        {value}
      </Text>
      <Text variant="small" color="muted">
        {subtitle}
      </Text>
    </CardContent>
  </Card>
);

interface WorkoutsTabProps {
  workouts: Workout[];
}

const WorkoutsTab: React.FC<WorkoutsTabProps> = ({ workouts }) => {
  const getTypeColor = (type: Workout['type']) => {
    switch (type) {
      case 'Speed': return 'warning';
      case 'Endurance': return 'default';
      case 'Strength': return 'secondary';
      case 'Recovery': return 'success';
      default: return 'default';
    }
  };

  return (
    <View style={styles.workoutsContainer}>
      {workouts.map((workout) => (
        <Card key={workout.id} style={styles.workoutCard}>
          <CardHeader style={styles.workoutHeader}>
            <View style={styles.workoutTitleRow}>
              <CardTitle>{workout.title}</CardTitle>
              <Badge variant={getTypeColor(workout.type)} size="sm">
                {workout.type}
              </Badge>
            </View>
            <View style={styles.workoutMeta}>
              <Text variant="small" color="muted">
                {workout.date} • {workout.duration}
              </Text>
              {workout.completed && (
                <FontAwesome5 
                  name="check-circle" 
                  size={16} 
                  color={theme.colors.success}
                  solid
                />
              )}
            </View>
          </CardHeader>
          
          <CardContent>
            <View style={styles.workoutDetails}>
              {workout.distance && (
                <View style={styles.workoutStat}>
                  <FontAwesome5 name="route" size={14} color={theme.colors.textMuted} />
                  <Text variant="small" color="muted" style={styles.statText}>
                    {workout.distance}
                  </Text>
                </View>
              )}
              
              {workout.sets && (
                <View style={styles.workoutStat}>
                  <FontAwesome5 name="repeat" size={14} color={theme.colors.textMuted} />
                  <Text variant="small" color="muted" style={styles.statText}>
                    {workout.sets} sets
                  </Text>
                </View>
              )}
            </View>
            
            {!workout.completed && (
              <Button 
                variant="outline" 
                size="sm" 
                style={styles.startButton}
                data-testid={`button-start-workout-${workout.id}`}
              >
                Start Workout
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </View>
  );
};

const JournalTab: React.FC = () => (
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
          data-testid="button-add-journal-entry"
        >
          <FontAwesome5 name="pen" size={16} color={theme.colors.primary} />
          <Text variant="body" weight="medium" color="primary" style={styles.journalButtonText}>
            Add Journal Entry
          </Text>
        </Button>
      </CardContent>
    </Card>
    
    {/* Recent Entries Placeholder */}
    <View style={styles.recentEntries}>
      <Text variant="h4" weight="semibold" color="foreground" style={styles.recentTitle}>
        Recent Entries
      </Text>
      <Text variant="body" color="muted" style={styles.noEntries}>
        No journal entries yet. Start tracking your training insights!
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 4, // Extra space for FAB
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
  workoutDetails: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    marginLeft: theme.spacing.xs,
  },
  startButton: {
    alignSelf: 'flex-start',
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
  },
  noEntries: {
    textAlign: 'center',
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
});