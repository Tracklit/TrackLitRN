import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Heart, Bot, Sparkles, ArrowRight, Bone, Zap, Activity, Send } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { WebScreen } from '@/components/web/Screen';
import { WebPageHeader } from '@/components/web/PageHeader';
import { WebCard, WebCardSection } from '@/components/web/Card';
import { WebButton } from '@/components/web/Button';
import { WebBadge } from '@/components/web/Badge';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const rehabCategories = [
  {
    id: 'acute-muscle',
    title: 'Acute Muscle Injuries',
    description: 'Evidence-based recovery programs for sudden muscle injuries',
    icon: <Heart size={28} color="#ef4444" />,
    subpages: ['Hamstring', 'Quadriceps', 'Calf', 'Groin'],
  },
  {
    id: 'chronic-injuries',
    title: 'Chronic Injuries',
    description: 'Long-term management for persistent and overuse injuries',
    icon: <Zap size={28} color={theme.colors.primary} />,
    subpages: ['Foot', 'Hamstring', 'Quadriceps', 'Calf', 'Groin', 'Other Tendons'],
  },
  {
    id: 'back-injuries',
    title: 'Back Injuries',
    description: 'Specialized programs for spinal and back-related issues',
    icon: <Activity size={28} color="#60a5fa" />,
    subpages: ['Disc Issues', 'Ligament', 'Other'],
  },
  {
    id: 'bone-breaks',
    title: 'Bone Breaks',
    description: 'Recovery protocols for fractures and bone injuries',
    icon: <Bone size={28} color="#a855f7" />,
    subpages: ['Ankle', 'Knee', 'Shoulder', 'Rib', 'Other'],
  },
];

export const RehabScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const isStarLike = !!(user as any)?.isPremium;
  const spikes = Number((user as any)?.spikes ?? 0);
  const hasSpikes = spikes >= 50;
  const canUseAi = isAuthenticated && !isGuest && (isStarLike || hasSpikes);

  const aiConsultationMutation = useMutation({
    mutationFn: async (query: string) => {
      return apiRequest<{ consultation: string; spikesUsed?: number }>('/api/rehab/ai-consultation', {
        method: 'POST',
        data: { query },
      });
    },
    onSuccess: (data) => {
      setAiQuery('');
      setAiResponse(data.consultation || '');
    },
    onError: (error: Error) => {
      Alert.alert('Consultation failed', error.message || 'Please try again.');
    },
  });

  const handleAiSubmit = () => {
    if (!isAuthenticated || isGuest) {
      Alert.alert('Sign In Required', 'Please sign in to use AI rehabilitation.');
      return;
    }
    if (!aiQuery.trim()) return;
    if (!canUseAi) {
      Alert.alert(
        'Insufficient access',
        `AI consultations require Star access or 50 Spikes.\n\nYou currently have ${spikes} Spikes.`,
      );
      return;
    }
    aiConsultationMutation.mutate(aiQuery.trim());
  };

  const categories = useMemo(() => rehabCategories, []);

  return (
    <WebScreen backgroundColor="#010a18" contentStyle={{ paddingTop: theme.spacing.lg }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowRight size={18} color={theme.colors.foreground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <WebPageHeader
          title="Rehabilitation Center"
          description="Evidence-based recovery programs designed to get you back to peak performance safely and effectively"
        />
      </View>

      <WebCard tone="muted" padding={theme.spacing.lg}>
        <WebCardSection style={styles.aiHeader}>
          <View style={styles.aiHeaderLeft}>
            <Bot size={20} color="#c084fc" />
            <Text variant="h4" weight="semiBold" color="foreground">
              AI Rehabilitation Consultant
            </Text>
            <WebBadge variant="secondary" style={styles.badge}>
              {isStarLike ? 'Star Feature' : '50 Spikes'}
            </WebBadge>
          </View>
          <Text variant="body" color="muted">
            Get personalized rehabilitation guidance from our AI specialist. Describe your injury, symptoms, and current status for a customized recovery program.
          </Text>
        </WebCardSection>

        {!isAiOpen ? (
          <WebButton
            onPress={() => setIsAiOpen(true)}
            variant="default"
            size="lg"
            disabled={!isStarLike && !hasSpikes}
            style={{ width: '100%', marginTop: theme.spacing.md }}
          >
            <Sparkles size={16} color={theme.colors.primaryForeground} />
            <Text variant="body" weight="bold" color="primary-foreground">
              Start AI Consultation
            </Text>
          </WebButton>
        ) : (
          <View style={styles.aiForm}>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your injury, pain level, current symptoms, and any limitations..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              value={aiQuery}
              onChangeText={setAiQuery}
              editable={isAuthenticated && !isGuest}
            />
            <View style={styles.aiButtons}>
              <WebButton
                onPress={handleAiSubmit}
                variant="default"
                size="md"
                disabled={!aiQuery.trim() || aiConsultationMutation.isPending}
              >
                {aiConsultationMutation.isPending ? (
                  <ActivityIndicator color={theme.colors.primaryForeground} />
                ) : (
                  <>
                    <Send size={14} color={theme.colors.primaryForeground} />
                    <Text variant="body" weight="bold" color="primary-foreground">
                      Get AI Program
                    </Text>
                  </>
                )}
              </WebButton>
              <WebButton variant="outline" onPress={() => setIsAiOpen(false)}>
                Cancel
              </WebButton>
            </View>
            {!isStarLike && (
              <Text variant="small" color="muted">
                This consultation will cost 50 Spikes. You currently have {spikes} Spikes.
              </Text>
            )}
          </View>
        )}

        {!!aiResponse && (
          <View style={styles.responseBox}>
            <Text variant="h4" weight="semiBold" color="foreground">
              Your plan
            </Text>
            <Text variant="body" color="foreground" style={styles.responseText}>
              {aiResponse}
            </Text>
          </View>
        )}
      </WebCard>

      <View style={styles.categoryHeader}>
        <Text variant="h4" weight="semiBold" color="foreground">
          Rehab Categories
        </Text>
        {aiConsultationMutation.isPending && <ActivityIndicator size="small" color={theme.colors.primary} />}
      </View>

      <View style={styles.grid}>
        {categories.map((category) => (
          <WebCard key={category.id} tone="muted" padding={theme.spacing.lg}>
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
              {category.subpages.map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={styles.subButton}
                  onPress={() => Alert.alert('Protocol', `${sub} protocol is being ported to mobile next.`)}
                >
                  <Text variant="small" color="foreground" weight="semiBold">
                    {sub}
                  </Text>
                  <ArrowRight size={12} color={theme.colors.foreground} />
                </TouchableOpacity>
              ))}
            </View>
          </WebCard>
        ))}
      </View>
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  badge: { marginLeft: theme.spacing.sm },
  aiHeader: { gap: theme.spacing.sm },
  aiHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  aiForm: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
  textArea: {
    minHeight: 130,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: '#0f172a',
    textAlignVertical: 'top',
  },
  aiButtons: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  responseBox: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  responseText: { lineHeight: 20 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'column', gap: theme.spacing.md },
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
    borderColor: '#1f2937',
    backgroundColor: '#0f172a',
    minWidth: 140,
  },
});


