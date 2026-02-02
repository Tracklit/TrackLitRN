import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Text } from '../components/ui/Text';
import { Card, CardContent } from '../components/ui/Card';
import theme from '../utils/theme';
import type { RootStackParamList } from '@/navigation/types';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';

type ToolScreen = Extract<
  keyof RootStackParamList,
  | 'Stopwatch'
  | 'StartGun'
  | 'PhotoFinish'
  | 'Journal'
  | 'IntervalTimer'
  | 'VideoAnalysis'
  | 'ExerciseLibrary'
  | 'VelocityTracker'
  | 'SprintTimePrediction'
>;

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  comingSoon?: boolean;
  screen?: ToolScreen;
}

export const ToolsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });

  const tools: Tool[] = [
    {
      id: 'video-analysis',
      title: 'Video Analysis',
      description: 'AI-powered race video analysis with Sprinthia',
      icon: 'play-circle',
      screen: 'VideoAnalysis',
    },
    {
      id: 'photo-finish',
      title: 'Photo Finish',
      description: 'Analyze race videos with timing overlays',
      icon: 'flag-checkered',
      screen: 'PhotoFinish',
    },
    {
      id: 'start-gun',
      title: 'Start Gun',
      description: 'Simulate a race start signal',
      icon: 'volume-up',
      screen: 'StartGun',
    },
    {
      id: 'stopwatch',
      title: 'Stopwatch',
      description: 'Track your time with precision',
      icon: 'stopwatch',
      screen: 'Stopwatch',
    },
    {
      id: 'journal',
      title: 'Journal',
      description: 'View and search your workout notes',
      icon: 'book',
      screen: 'Journal',
    },
    {
      id: 'exercise-library',
      title: 'Exercise Library',
      description: 'Store and organize your training videos',
      icon: 'video',
      screen: 'ExerciseLibrary',
    },
    {
      id: 'velocity-tracker',
      title: 'Velocity Tracker',
      description: 'Track speed and acceleration metrics',
      icon: 'tachometer-alt',
      screen: 'VelocityTracker',
    },
    {
      id: 'sprint-time-prediction',
      title: 'Sprint Time Prediction',
      description: 'Calculate predicted times across sprint distances',
      icon: 'tachometer-alt',
      screen: 'SprintTimePrediction',
    },
  ];

  const handleToolPress = (tool: Tool) => {
    if (tool.comingSoon) {
      Alert.alert(
        'Coming Soon',
        `${tool.title} is currently in development and will be available soon!`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (tool.screen) {
      navigation.navigate(tool.screen);
      return;
    }

    // Handle specific tools
    switch (tool.id) {
      case '1': // Stopwatch
        Alert.alert(
          'Stopwatch',
          'Precision stopwatch functionality coming in the next update!',
          [{ text: 'OK' }]
        );
        break;
      case '4': // Wind Meter
        Alert.alert(
          'Wind Meter',
          'Current wind conditions: 2.1 m/s headwind\n(Demo)',
          [{ text: 'OK' }]
        );
        break;
      case '5': // Split Calculator
        Alert.alert(
          'Split Calculator',
          'Calculate your race splits and pacing strategy here!',
          [{ text: 'OK' }]
        );
        break;
      case '8': // Conversion Tables
        Alert.alert(
          'Conversion Tables',
          'Time and distance conversion tools coming soon!',
          [{ text: 'OK' }]
        );
        break;
      default:
        Alert.alert(
          tool.title,
          `${tool.description}\n\nThis tool is currently in development.`,
          [{ text: 'OK' }]
        );
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={theme.gradients.webHeader.colors}
          start={theme.gradients.webHeader.start}
          end={theme.gradients.webHeader.end}
          style={styles.header}
        >
          <Text variant="h3" weight="bold" color="primary-foreground">
            Tools
          </Text>
        </LinearGradient>
        <View style={styles.toolsGrid}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              onPress={() => handleToolPress(tool)}
              data-testid={`tool-${tool.id}`}
              style={styles.toolButton}
              activeOpacity={0.8}
            >
              <Card style={[styles.toolCard, tool.comingSoon && styles.toolCardDisabled]}>
                {tool.comingSoon ? (
                  <CardContent style={styles.toolContent}>
                    <View style={styles.toolTextCenter}>
                      <View style={styles.toolTitleRow}>
                        <Text variant="body" weight="bold" color="muted">
                          {tool.title}
                        </Text>
                        <FontAwesome5 name="lock" size={10} color={theme.colors.textMuted} solid />
                      </View>
                      <Text variant="small" color="muted" style={styles.toolDescription}>
                        {tool.description}
                      </Text>
                      <Text variant="small" color="muted" style={styles.comingSoonText}>
                        Coming soon
                      </Text>
                    </View>
                  </CardContent>
                ) : (
                  <LinearGradient
                    colors={theme.gradients.webPurple.colors}
                    start={theme.gradients.webPurple.start}
                    end={theme.gradients.webPurple.end}
                    style={styles.toolGradient}
                  >
                    <CardContent style={styles.toolContent}>
                      <View style={styles.toolTextCenter}>
                        <Text variant="body" weight="bold" color="primary-foreground">
                          {tool.title}
                        </Text>
                        <Text variant="small" color="primary-foreground" style={styles.toolDescription}>
                          {tool.description}
                        </Text>
                      </View>
                    </CardContent>
                  </LinearGradient>
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  header: {
    borderRadius: theme.borderRadius.webCard,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  toolButton: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  toolCard: {
    height: 112,
    borderRadius: theme.borderRadius.webCard,
    overflow: 'hidden',
    padding: 0,
    marginBottom: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'transparent',
    ...theme.shadows.webCard,
  },
  toolCardDisabled: {
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderColor: theme.colors.border,
  },
  toolGradient: {
    flex: 1,
  },
  toolContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
  },
  toolTextCenter: {
    alignItems: 'center',
    textAlign: 'center',
  },
  toolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  toolDescription: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  comingSoonText: {
    marginTop: theme.spacing.xs,
  },
});