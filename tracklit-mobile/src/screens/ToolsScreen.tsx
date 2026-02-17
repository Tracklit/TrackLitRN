import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PlayCircle,
  FlagCheckered,
  SpeakerHigh,
  Timer,
  BookOpen,
  VideoCamera,
  Gauge,
  Lock,
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Text } from '../components/ui/Text';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { InlineRefreshHeader } from '@/components/refresh/InlineRefreshHeader';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
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
  icon: React.ReactNode;
  comingSoon?: boolean;
  screen?: ToolScreen;
}

export const ToolsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { refreshUser } = useAuth();
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });
  const { isRefreshing, onRefresh } = usePullToRefresh(async () => refreshUser());

  const tools: Tool[] = [
    {
      id: 'video-analysis',
      title: 'Video Analysis',
      description: 'AI-powered race video analysis with Sprinthia',
      icon: <PlayCircle size={20} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'VideoAnalysis',
    },
    {
      id: 'photo-finish',
      title: 'Photo Finish',
      description: 'Analyze race videos with timing overlays',
      icon: <FlagCheckered size={20} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'PhotoFinish',
    },
    {
      id: 'start-gun',
      title: 'Start Gun',
      description: 'Simulate a race start signal',
      icon: <SpeakerHigh size={20} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'StartGun',
    },
    {
      id: 'stopwatch',
      title: 'Stopwatch',
      description: 'Track your time with precision',
      icon: <Timer size={20} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'Stopwatch',
    },
    {
      id: 'journal',
      title: 'Journal',
      description: 'View and search your workout notes',
      icon: <BookOpen size={20} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'Journal',
    },
    {
      id: 'exercise-library',
      title: 'Exercise Library',
      description: 'Store and organize your training videos',
      icon: <VideoCamera size={20} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'ExerciseLibrary',
    },
    {
      id: 'velocity-tracker',
      title: 'Velocity Tracker',
      description: 'Track speed and acceleration metrics',
      icon: <Gauge size={20} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'VelocityTracker',
    },
    {
      id: 'sprint-time-prediction',
      title: 'Sprint Time Prediction',
      description: 'Calculate predicted times across sprint distances',
      icon: <Gauge size={20} color={theme.colors.primaryForeground} weight="fill" />,
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

    switch (tool.id) {
      case '1':
        Alert.alert(
          'Stopwatch',
          'Precision stopwatch functionality coming in the next update!',
          [{ text: 'OK' }]
        );
        break;
      case '4':
        Alert.alert(
          'Wind Meter',
          'Current wind conditions: 2.1 m/s headwind\n(Demo)',
          [{ text: 'OK' }]
        );
        break;
      case '5':
        Alert.alert(
          'Split Calculator',
          'Calculate your race splits and pacing strategy here!',
          [{ text: 'OK' }]
        );
        break;
      case '8':
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
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <InlineRefreshHeader visible={isRefreshing} />
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
                        <Lock size={10} color={theme.colors.textMuted} weight="fill" />
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
    paddingHorizontal: theme.spacing.xl,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
  },
  toolButton: {
    width: '48%',
  },
  toolCard: {
    height: 100,
    borderRadius: 12,
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
