import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Text } from '../components/ui/Text';
import { Card, CardContent } from '../components/ui/Card';
import theme from '../utils/theme';
import type { RootStackParamList } from '@/navigation/types';

type ToolScreen = Extract<keyof RootStackParamList, 'Stopwatch' | 'StartGun'>;

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string[];
  comingSoon?: boolean;
  screen?: ToolScreen;
}

export const ToolsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const contentBottomPadding = theme.layout.bottomNavHeight + insets.bottom + theme.spacing.xl;

  const tools: Tool[] = [
    {
      id: '1',
      title: 'Stopwatch',
      description: 'Precision timing for workouts and races',
      icon: 'stopwatch',
      gradient: [theme.colors.primary, theme.colors.deepGold],
      screen: 'Stopwatch',
    },
    {
      id: '2',
      title: 'Start Gun',
      description: 'Practice race starts with audio cues',
      icon: 'flag-checkered',
      gradient: ['#FF6B6B', '#FF8E8E'],
      screen: 'StartGun',
    },
    {
      id: '3',
      title: 'Photo Finish',
      description: 'Analyze race finishes frame by frame',
      icon: 'camera',
      gradient: ['#4ECDC4', '#6ED0CA'],
      comingSoon: true,
    },
    {
      id: '4',
      title: 'Wind Meter',
      description: 'Check wind conditions for sprints and jumps',
      icon: 'wind',
      gradient: ['#95E1D3', '#A8E6CF'],
    },
    {
      id: '5',
      title: 'Split Calculator',
      description: 'Calculate splits for middle distance races',
      icon: 'calculator',
      gradient: ['#FFA07A', '#FFB347'],
    },
    {
      id: '6',
      title: 'Video Analysis',
      description: 'AI-powered biomechanical analysis',
      icon: 'video',
      gradient: ['#9B59B6', '#BB7BD1'],
      comingSoon: true,
    },
    {
      id: '7',
      title: 'Heat Generator',
      description: 'Generate heats and lane assignments',
      icon: 'users',
      gradient: ['#3498DB', '#5DADE2'],
      comingSoon: true,
    },
    {
      id: '8',
      title: 'Conversion Tables',
      description: 'Convert times, distances, and measurements',
      icon: 'exchange-alt',
      gradient: ['#F39C12', '#F7DC6F'],
    },
    {
      id: '9',
      title: 'Meet Planner',
      description: 'Plan and organize track meets',
      icon: 'calendar-check',
      gradient: ['#E74C3C', '#F1948A'],
      comingSoon: true,
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
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" weight="bold" color="foreground">
            Training Tools
          </Text>
          <Text variant="body" color="muted">
            Essential tools for athletes and coaches
          </Text>
        </View>

        {/* Tools Grid */}
        <View style={styles.toolsGrid}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              onPress={() => handleToolPress(tool)}
              data-testid={`tool-${tool.id}`}
              style={styles.toolButton}
            >
              <Card style={styles.toolCard}>
                <CardContent style={styles.toolContent}>
                  {/* Tool Icon with Gradient Background */}
                  <View style={styles.toolIconContainer}>
                    <LinearGradient
                      colors={tool.gradient}
                      style={styles.toolIconGradient}
                    >
                      <FontAwesome5 
                        name={tool.icon} 
                        size={28} 
                        color="white"
                        solid 
                      />
                    </LinearGradient>
                  </View>
                  
                  {/* Tool Info */}
                  <View style={styles.toolInfo}>
                    <Text variant="body" weight="semiBold" color="foreground">
                      {tool.title}
                    </Text>
                    <Text variant="small" color="muted" style={styles.toolDescription}>
                      {tool.description}
                    </Text>
                    
                    {/* Coming Soon Badge */}
                    {tool.comingSoon && (
                      <View style={styles.comingSoonBadge}>
                        <Text variant="small" color="primary" weight="medium">
                          Coming Soon
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Arrow Icon */}
                  <View style={styles.arrowIcon}>
                    <FontAwesome5 
                      name="chevron-right" 
                      size={16} 
                      color={theme.colors.textMuted}
                      solid 
                    />
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text variant="small" color="muted" style={styles.footerText}>
            More tools are being added regularly. Have a suggestion? Let us know!
          </Text>
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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  toolsGrid: {
    gap: theme.spacing.md,
  },
  toolButton: {
    marginBottom: theme.spacing.sm,
  },
  toolCard: {
    marginBottom: 0,
  },
  toolContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  toolIconContainer: {
    marginRight: theme.spacing.lg,
  },
  toolIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  toolInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  toolDescription: {
    marginTop: theme.spacing.xs,
    lineHeight: 18,
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    backgroundColor: theme.colors.primary + '20', // 20% opacity
    borderRadius: theme.borderRadius.sm,
  },
  arrowIcon: {
    opacity: 0.5,
  },
  footer: {
    marginTop: theme.spacing.xl * 2,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  footerText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});