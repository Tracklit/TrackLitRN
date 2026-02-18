import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedRef,
} from 'react-native-reanimated';
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

const CARD_HEIGHT = 160;
const CARD_GAP = 20;
const STEP = CARD_HEIGHT + CARD_GAP;

export const ToolsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const isAdjustingRef = useRef(false);

  const tools: Tool[] = [
    {
      id: 'video-analysis',
      title: 'Video Analysis',
      description: 'AI-powered race video analysis with Sprinthia',
      icon: <PlayCircle size={24} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'VideoAnalysis',
    },
    {
      id: 'photo-finish',
      title: 'Photo Finish',
      description: 'Analyze race videos with timing overlays',
      icon: <FlagCheckered size={24} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'PhotoFinish',
    },
    {
      id: 'start-gun',
      title: 'Start Gun',
      description: 'Simulate a race start signal',
      icon: <SpeakerHigh size={24} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'StartGun',
    },
    {
      id: 'stopwatch',
      title: 'Stopwatch',
      description: 'Track your time with precision',
      icon: <Timer size={24} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'Stopwatch',
    },
    {
      id: 'journal',
      title: 'Journal',
      description: 'View and search your workout notes',
      icon: <BookOpen size={24} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'Journal',
    },
    {
      id: 'exercise-library',
      title: 'Exercise Library',
      description: 'Store and organize your training videos',
      icon: <VideoCamera size={24} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'ExerciseLibrary',
    },
    {
      id: 'velocity-tracker',
      title: 'Velocity Tracker',
      description: 'Track speed and acceleration metrics',
      icon: <Gauge size={24} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'VelocityTracker',
    },
    {
      id: 'sprint-time-prediction',
      title: 'Sprint Time Prediction',
      description: 'Calculate predicted times across sprint distances',
      icon: <Gauge size={24} color={theme.colors.primaryForeground} weight="fill" />,
      screen: 'SprintTimePrediction',
    },
  ];

  const count = tools.length;
  const oneSetHeight = count * STEP;
  const loopedTools = [...tools, ...tools, ...tools];

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isAdjustingRef.current) return;
    const y = e.nativeEvent.contentOffset.y;

    if (y < oneSetHeight * 0.25 || y > oneSetHeight * 1.75) {
      isAdjustingRef.current = true;
      const offset = y % oneSetHeight;
      const newY = oneSetHeight + offset;
      (scrollRef.current as any)?.scrollTo({ y: newY, animated: false });
      setTimeout(() => { isAdjustingRef.current = false; }, 50);
    }
  }, [oneSetHeight]);

  const handleContentSizeChange = useCallback(() => {
    (scrollRef.current as any)?.scrollTo({ y: oneSetHeight, animated: false });
  }, [oneSetHeight]);

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

  const renderCard = (tool: Tool, idx: number) => (
    <TouchableOpacity
      key={`${tool.id}-${idx}`}
      onPress={() => handleToolPress(tool)}
      activeOpacity={0.85}
      style={styles.cardTouchable}
    >
      <Card style={[styles.toolCard, tool.comingSoon && styles.toolCardDisabled]}>
        {tool.comingSoon ? (
          <CardContent style={styles.toolContent}>
            <View style={styles.iconCircle}>{tool.icon}</View>
            <View style={styles.toolTextArea}>
              <View style={styles.toolTitleRow}>
                <Text variant="body" weight="bold" color="muted">{tool.title}</Text>
                <Lock size={10} color={theme.colors.textMuted} weight="fill" />
              </View>
              <Text variant="small" color="muted" style={styles.toolDescription}>{tool.description}</Text>
              <Text variant="small" color="muted" style={styles.comingSoonText}>Coming soon</Text>
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
              <View style={styles.iconCircle}>{tool.icon}</View>
              <View style={styles.toolTextArea}>
                <Text variant="h3" weight="bold" color="primary-foreground">{tool.title}</Text>
                <Text variant="body" color="primary-foreground" style={styles.toolDescription}>{tool.description}</Text>
              </View>
            </CardContent>
          </LinearGradient>
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
      <Animated.ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 12, paddingBottom: 12 },
        ]}
        style={{ marginTop: insets.top, marginBottom: contentBottomPadding }}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
      >
        <View style={styles.cardsList}>
          {loopedTools.map(renderCard)}
        </View>
      </Animated.ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
  },
  cardsList: {
    gap: CARD_GAP,
  },
  cardTouchable: {
    height: CARD_HEIGHT,
  },
  toolCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 0,
    marginBottom: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'transparent',
    ...theme.shadows.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTextArea: {
    flex: 1,
    gap: 4,
  },
  toolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  toolDescription: {
    marginTop: 4,
    lineHeight: 20,
    opacity: 0.9,
  },
  comingSoonText: {
    marginTop: theme.spacing.xs,
  },
});
