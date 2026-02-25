import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FilmStrip,
  PersonSimpleThrow,
  Timer,
  BookOpen,
  VideoCamera,
  Clock,
  FirstAidKit,
  Lightning,
  Brain,
  Lock,
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Text } from '../components/ui/Text';
import type { RootStackParamList } from '@/navigation/types';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type ToolScreen = Extract<
  keyof RootStackParamList,
  | 'Stopwatch'
  | 'StartGun'
  | 'PhotoFinish'
  | 'Journal'
  | 'IntervalTimer'
  | 'ExerciseLibrary'
  | 'Rehab'
  | 'Spikes'
  | 'Sprinthia'
>;

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  orange: '#FF7A00',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.06)',
};

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  comingSoon?: boolean;
  screen?: ToolScreen;
}

export const ToolsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });

  const tools: Tool[] = [
    {
      id: 'photo-finish',
      title: 'Photo Finish',
      description: 'Upload and analyze your videos',
      icon: <FilmStrip size={26} color="#FF7A00" weight="fill" />,
      color: 'rgba(255,122,0,0.12)',
      screen: 'PhotoFinish',
    },
    {
      id: 'sprinthia',
      title: 'Sprinthia AI',
      description: 'AI track & field coach',
      icon: <Brain size={26} color="#a78bfa" weight="fill" />,
      color: 'rgba(167,139,250,0.12)',
      screen: 'Sprinthia',
    },
    {
      id: 'start-gun',
      title: 'Start Gun',
      description: 'Simulate a race start signal',
      icon: <PersonSimpleThrow size={26} color="#f87171" weight="fill" />,
      color: 'rgba(248,113,113,0.12)',
      screen: 'StartGun',
    },
    {
      id: 'stopwatch',
      title: 'Stopwatch',
      description: 'Track time with precision',
      icon: <Timer size={26} color="#38bdf8" weight="fill" />,
      color: 'rgba(56,189,248,0.12)',
      screen: 'Stopwatch',
    },
    {
      id: 'interval-timer',
      title: 'Interval Timer',
      description: 'Customizable work/rest intervals',
      icon: <Clock size={26} color="#4ade80" weight="fill" />,
      color: 'rgba(74,222,128,0.12)',
      screen: 'IntervalTimer',
    },
    {
      id: 'journal',
      title: 'Journal',
      description: 'Search your workout notes',
      icon: <BookOpen size={26} color="#fbbf24" weight="fill" />,
      color: 'rgba(251,191,36,0.12)',
      screen: 'Journal',
    },
    {
      id: 'exercise-library',
      title: 'Exercise Library',
      description: 'Organize training videos',
      icon: <VideoCamera size={26} color="#c084fc" weight="fill" />,
      color: 'rgba(192,132,252,0.12)',
      screen: 'ExerciseLibrary',
    },
    {
      id: 'rehab',
      title: 'Rehab',
      description: 'Injury recovery programs',
      icon: <FirstAidKit size={26} color="#fb7185" weight="fill" />,
      color: 'rgba(251,113,133,0.12)',
      screen: 'Rehab',
    },
    {
      id: 'spikes',
      title: 'Spikes',
      description: 'Earn rewards & track progress',
      icon: <Lightning size={26} color="#facc15" weight="fill" />,
      color: 'rgba(250,204,21,0.12)',
      screen: 'Spikes',
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
      activeOpacity={0.7}
      style={styles.cardTouchable}
    >
      <View style={[styles.toolCard, tool.comingSoon && styles.toolCardDisabled]}>
        <View style={[styles.iconCircle, { backgroundColor: tool.color }]}>
          {tool.comingSoon ? <Lock size={26} color={C.textMuted} weight="fill" /> : tool.icon}
        </View>
        <Text style={[styles.toolTitle, tool.comingSoon && styles.toolTitleDisabled]} numberOfLines={1}>
          {tool.title}
        </Text>
        <Text style={[styles.toolDescription, tool.comingSoon && styles.toolDescDisabled]} numberOfLines={2}>
          {tool.description}
        </Text>
        {tool.comingSoon && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>COMING SOON</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Tools</Text>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, idx) => (
          <View key={idx} style={styles.row}>
            {row.map(renderCard)}
            {row.length === 1 && <View style={styles.cardTouchable} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  headerRow: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  cardTouchable: {
    flex: 1,
  },
  toolCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 8,
    minHeight: 150,
  },
  toolCardDisabled: {
    backgroundColor: 'rgba(28,31,43,0.5)',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
  },
  toolTitleDisabled: {
    color: C.textMuted,
  },
  toolDescription: {
    fontSize: 11,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  toolDescDisabled: {
    color: C.textMuted,
  },
  comingSoonBadge: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  comingSoonText: {
    fontSize: 8,
    fontWeight: '800',
    color: C.textMuted,
    letterSpacing: 0.8,
  },
});
