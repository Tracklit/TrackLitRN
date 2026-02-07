import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { Heart, Bot, Sparkles, ArrowRight, Bone, Zap, Activity, MessageSquare, ArrowLeft } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { WebScreen } from '@/components/web/Screen';
import { WebCard } from '@/components/web/Card';
import { WebButton } from '@/components/web/Button';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const rehabCategories = [
  {
    id: 'acute-muscle',
    title: 'Acute Muscle Injuries',
    description: 'Evidence-based recovery programs for sudden muscle injuries',
    icon: <Heart size={28} color="#ef4444" />,
    borderColor: '#fecaca',
    subpages: [
      { id: 'hamstring', name: 'Hamstring' },
      { id: 'quad', name: 'Quadriceps' },
      { id: 'calf', name: 'Calf' },
      { id: 'groin', name: 'Groin' },
    ],
  },
  {
    id: 'chronic-injuries',
    title: 'Chronic Injuries',
    description: 'Long-term management for persistent and overuse injuries',
    icon: <Zap size={28} color={theme.colors.primary} />,
    borderColor: 'rgba(124, 58, 237, 0.5)',
    subpages: [
      { id: 'foot', name: 'Foot' },
      { id: 'hamstring', name: 'Hamstring' },
      { id: 'quad', name: 'Quadriceps' },
      { id: 'calf', name: 'Calf' },
      { id: 'groin', name: 'Groin' },
      { id: 'other-tendons', name: 'Other Tendons' },
    ],
  },
  {
    id: 'back-injuries',
    title: 'Back Injuries',
    description: 'Specialized programs for spinal and back-related issues',
    icon: <Activity size={28} color="#60a5fa" />,
    borderColor: '#bfdbfe',
    subpages: [
      { id: 'disc', name: 'Disc Issues' },
      { id: 'ligament', name: 'Ligament' },
      { id: 'other', name: 'Other' },
    ],
  },
  {
    id: 'bone-breaks',
    title: 'Bone Breaks',
    description: 'Recovery protocols for fractures and bone injuries',
    icon: <Bone size={28} color="#a855f7" />,
    borderColor: '#e9d5ff',
    subpages: [
      { id: 'ankle', name: 'Ankle' },
      { id: 'knee', name: 'Knee' },
      { id: 'shoulder', name: 'Shoulder' },
      { id: 'rib', name: 'Rib' },
      { id: 'other', name: 'Other' },
    ],
  },
];

export const RehabScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();

  const isStarUser = user?.subscription === 'star' || (user as any)?.isPremium;
  const spikes = Number((user as any)?.spikes ?? 0);

  const categories = useMemo(() => rehabCategories, []);

  const handleProgramPress = (categoryId: string, programId: string, programName: string) => {
    if (categoryId === 'acute-muscle' && programId === 'hamstring') {
      navigation.navigate('RehabHamstringProgram');
      return;
    }
    if (categoryId === 'chronic-injuries' && programId === 'foot') {
      navigation.navigate('RehabFootProgram');
      return;
    }
    navigation.navigate('RehabProgramComingSoon', {
      title: `${programName} Protocol`,
      category: categoryId,
    });
  };

  return (
    <WebScreen backgroundColor="#010a18" contentStyle={{ paddingTop: theme.spacing.xl }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={16} color={theme.colors.foreground} />
        </TouchableOpacity>
      </View>
      <View style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <Heart size={32} color="#ef4444" />
          <Text variant="h1" weight="bold" color="foreground">
            Rehabilitation Center
          </Text>
        </View>
        <Text variant="body" color="muted" center style={styles.heroCopy}>
          Evidence-based recovery programs designed to get you back to peak performance safely and effectively
        </Text>
      </View>

      <LinearGradient
        colors={['rgba(88, 28, 135, 0.2)', 'rgba(30, 64, 175, 0.2)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.aiCard}
      >
        <View style={styles.aiHeaderRow}>
          <View style={styles.aiTitleRow}>
            <Bot size={20} color="#c084fc" />
            <Text variant="h4" weight="semiBold" color="foreground">
              AI Rehabilitation Consultant
            </Text>
            <View style={styles.aiBadge}>
              <Text variant="small" color="accent">
                {isStarUser ? 'Star Feature' : '50 Spikes'}
              </Text>
            </View>
          </View>
          <Text variant="small" color="muted">
            Get personalized rehabilitation guidance from our AI specialist. Describe your injury, symptoms, and current status for a customized recovery program.
          </Text>
        </View>
          <WebButton
          onPress={() => navigation.navigate('MainTabs', { screen: 'Sprinthia' } as never)}
          style={styles.aiButton}
          >
            <Sparkles size={16} color={theme.colors.primaryForeground} />
            <Text variant="body" weight="bold" color="primary-foreground">
            Start AI Consultation with Sprinthia
            </Text>
          </WebButton>
        {!isStarUser && (
              <Text variant="small" color="muted">
                This consultation will cost 50 Spikes. You currently have {spikes} Spikes.
              </Text>
            )}
      </LinearGradient>

      <View style={styles.grid}>
        {categories.map((category) => (
          <WebCard
            key={category.id}
            tone="muted"
            padding={theme.spacing.lg}
            style={[styles.categoryCard, { borderColor: category.borderColor }]}
          >
            <View style={styles.cardTop}>
              {category.icon}
              <View style={{ flex: 1, gap: theme.spacing.xs }}>
                <Text variant="body" weight="semiBold" color="foreground">
                  {category.title}
                </Text>
                <Text variant="small" color="muted">
                  {category.description}
                </Text>
              </View>
            </View>
            <Text variant="small" color="muted">
              Available Programs:
            </Text>
            <View style={styles.subGrid}>
              {category.subpages.map((subpage) => (
                <TouchableOpacity
                  key={subpage.id}
                  style={styles.subButton}
                  onPress={() => handleProgramPress(category.id, subpage.id, subpage.name)}
                >
                  <Text variant="small" color="foreground" weight="semiBold">
                    {subpage.name}
                  </Text>
                  <ArrowRight size={12} color={theme.colors.foreground} />
                </TouchableOpacity>
              ))}
            </View>
          </WebCard>
        ))}
      </View>

      <WebCard tone="muted" padding={theme.spacing.lg} style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <MessageSquare size={18} color="#60a5fa" />
          <Text variant="body" weight="semiBold" color="foreground">
            Professional Guidance
          </Text>
        </View>
        <Text variant="small" color="muted" center>
          All rehabilitation programs are based on current sports medicine research and best practices. These programs are designed to complement professional medical care, not replace it. Always consult with your healthcare provider before starting any rehabilitation program, especially for serious injuries or persistent pain.
        </Text>
      </WebCard>
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  headerRow: { alignItems: 'flex-start' },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  hero: {
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  heroCopy: {
    maxWidth: 520,
  },
  aiCard: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  aiHeaderRow: { gap: theme.spacing.sm },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' },
  aiBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  aiButton: { width: '100%' },
  grid: { flexDirection: 'column', gap: theme.spacing.md },
  categoryCard: { borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  subGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  subButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    minWidth: 140,
  },
  infoCard: { alignItems: 'center' },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
});

