import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
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
const CARD_GAP = 16;
const STEP = CARD_HEIGHT + CARD_GAP;
const SLIDE_DURATION = 600;
const PAUSE_DURATION = 3000;

const TOOLS_DATA: Omit<Tool, 'icon'>[] = [
  { id: 'video-analysis', title: 'Video Analysis', description: 'AI-powered race video analysis with Sprinthia', screen: 'VideoAnalysis' },
  { id: 'photo-finish', title: 'Photo Finish', description: 'Analyze race videos with timing overlays', screen: 'PhotoFinish' },
  { id: 'start-gun', title: 'Start Gun', description: 'Simulate a race start signal', screen: 'StartGun' },
  { id: 'stopwatch', title: 'Stopwatch', description: 'Track your time with precision', screen: 'Stopwatch' },
  { id: 'journal', title: 'Journal', description: 'View and search your workout notes', screen: 'Journal' },
  { id: 'exercise-library', title: 'Exercise Library', description: 'Store and organize your training videos', screen: 'ExerciseLibrary' },
  { id: 'velocity-tracker', title: 'Velocity Tracker', description: 'Track speed and acceleration metrics', screen: 'VelocityTracker' },
  { id: 'sprint-time-prediction', title: 'Sprint Time Prediction', description: 'Calculate predicted times across sprint distances', screen: 'SprintTimePrediction' },
];

const ICON_MAP: Record<string, (props: { size: number; color: string; weight: 'fill' }) => React.ReactNode> = {
  'video-analysis': (p) => <PlayCircle {...p} />,
  'photo-finish': (p) => <FlagCheckered {...p} />,
  'start-gun': (p) => <SpeakerHigh {...p} />,
  'stopwatch': (p) => <Timer {...p} />,
  'journal': (p) => <BookOpen {...p} />,
  'exercise-library': (p) => <VideoCamera {...p} />,
  'velocity-tracker': (p) => <Gauge {...p} />,
  'sprint-time-prediction': (p) => <Gauge {...p} />,
};

export const ToolsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });

  const screenHeight = Dimensions.get('window').height;
  const topOffset = insets.top + 32;
  const availableHeight = screenHeight - topOffset - contentBottomPadding;
  const visibleCount = Math.max(1, Math.floor(availableHeight / STEP));
  const totalItems = TOOLS_DATA.length;

  const translateY = useSharedValue(0);
  const indexRef = useRef(0);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSlideComplete = () => {
    if (!mountedRef.current) return;
    indexRef.current += 1;

    if (indexRef.current >= totalItems) {
      translateY.value = 0;
      indexRef.current = 0;
    }

    timerRef.current = setTimeout(slide, PAUSE_DURATION);
  };

  const slide = () => {
    if (!mountedRef.current) return;
    const target = -(indexRef.current + 1) * STEP;
    translateY.value = withTiming(target, {
      duration: SLIDE_DURATION,
      easing: Easing.inOut(Easing.ease),
    }, (finished) => {
      if (finished) runOnJS(onSlideComplete)();
    });
  };

  useEffect(() => {
    mountedRef.current = true;
    timerRef.current = setTimeout(slide, PAUSE_DURATION);
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleToolPress = (tool: Omit<Tool, 'icon'>) => {
    if (tool.comingSoon) {
      Alert.alert('Coming Soon', `${tool.title} is currently in development and will be available soon!`, [{ text: 'OK' }]);
      return;
    }
    if (tool.screen) {
      navigation.navigate(tool.screen);
    }
  };

  const renderItems = [...TOOLS_DATA, ...TOOLS_DATA.slice(0, visibleCount)];

  const renderCard = (tool: Omit<Tool, 'icon'>, idx: number) => {
    const iconFn = ICON_MAP[tool.id];
    const icon = iconFn?.({ size: 24, color: theme.colors.primaryForeground, weight: 'fill' });

    return (
      <TouchableOpacity
        key={`${tool.id}-${idx}`}
        onPress={() => handleToolPress(tool)}
        activeOpacity={0.85}
        style={{ height: CARD_HEIGHT, marginBottom: CARD_GAP }}
      >
        <Card style={[styles.toolCard, tool.comingSoon && styles.toolCardDisabled]}>
          {tool.comingSoon ? (
            <CardContent style={styles.toolContent}>
              <View style={styles.iconCircle}>{icon}</View>
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
                <View style={styles.iconCircle}>{icon}</View>
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
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <View style={[styles.carouselWrapper, { top: topOffset, height: visibleCount * STEP - CARD_GAP }]}>
        <View style={styles.carouselClip}>
          <Animated.View style={animatedStyle}>
            {renderItems.map(renderCard)}
          </Animated.View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselWrapper: {
    position: 'absolute',
    left: theme.spacing.xl,
    right: theme.spacing.xl,
  },
  carouselClip: {
    flex: 1,
    overflow: 'hidden',
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
