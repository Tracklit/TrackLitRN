import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
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
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });

  const tools: Tool[] = [
    {
      id: 'video-analysis',
      title: 'Video Analysis',
      description: 'AI-powered race video analysis',
      icon: <PlayCircle size={28} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'VideoAnalysis',
    },
    {
      id: 'photo-finish',
      title: 'Photo Finish',
      description: 'Race videos with timing overlays',
      icon: <FlagCheckered size={28} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'PhotoFinish',
    },
    {
      id: 'start-gun',
      title: 'Start Gun',
      description: 'Simulate a race start signal',
      icon: <SpeakerHigh size={28} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'StartGun',
    },
    {
      id: 'stopwatch',
      title: 'Stopwatch',
      description: 'Track time with precision',
      icon: <Timer size={28} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'Stopwatch',
    },
    {
      id: 'journal',
      title: 'Journal',
      description: 'Search your workout notes',
      icon: <BookOpen size={28} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'Journal',
    },
    {
      id: 'exercise-library',
      title: 'Exercise Library',
      description: 'Organize training videos',
      icon: <VideoCamera size={28} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'ExerciseLibrary',
    },
    {
      id: 'velocity-tracker',
      title: 'Velocity Tracker',
      description: 'Speed & acceleration metrics',
      icon: <Gauge size={28} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'VelocityTracker',
    },
    {
      id: 'sprint-time-prediction',
      title: 'Sprint Prediction',
      description: 'Predicted sprint times',
      icon: <Gauge size={28} color={theme.colors.primaryForeground} weight="fill" />,
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
    }
  };

  const rows: Tool[][] = [];
  for (let i = 0; i < tools.length; i += 2) {
    rows.push(tools.slice(i, i + 2));
  }

  const renderCard = (tool: Tool) => (
    <TouchableOpacity
      key={tool.id}
      onPress={() => handleToolPress(tool)}
      activeOpacity={0.85}
      style={styles.cardTouchable}
    >
      <Card style={[styles.toolCard, tool.comingSoon && styles.toolCardDisabled]}>
        {tool.comingSoon ? (
          <CardContent style={styles.toolContent}>
            <View style={styles.iconCircle}>{tool.icon}</View>
            <Text variant="body" weight="bold" color="muted" numberOfLines={1}>{tool.title}</Text>
            <Text variant="small" color="muted" numberOfLines={2} style={styles.toolDescription}>{tool.description}</Text>
            <View style={styles.comingSoonRow}>
              <Lock size={10} color={theme.colors.textMuted} weight="fill" />
              <Text variant="small" color="muted">Coming soon</Text>
            </View>
          </CardContent>
        ) : (
          <CardContent style={styles.toolContent}>
            <View style={styles.iconCircle}>{tool.icon}</View>
            <Text variant="body" weight="bold" color="primary-foreground" numberOfLines={1}>{tool.title}</Text>
            <Text variant="small" color="primary-foreground" numberOfLines={2} style={styles.toolDescription}>{tool.description}</Text>
          </CardContent>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 28, paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <View style={styles.divider} />}
            <View style={styles.row}>
              {row.map(renderCard)}
              {row.length === 1 && <View style={styles.cardTouchable} />}
            </View>
          </React.Fragment>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(191, 54, 12, 0.15)',
    marginVertical: 14,
    marginHorizontal: 8,
  },
  cardTouchable: {
    flex: 1,
    aspectRatio: 1.2,
  },
  toolCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 0,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    ...theme.shadows.md,
  },
  toolCardDisabled: {
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderColor: theme.colors.border,
  },
  toolContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    gap: 8,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  toolDescription: {
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.85,
  },
  comingSoonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
