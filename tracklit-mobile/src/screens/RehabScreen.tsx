import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import theme from '@/utils/theme';
import { useMutation } from '@tanstack/react-query';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const rehabCategories = [
  {
    id: 'acute-muscle',
    title: 'Acute Muscle Injuries',
    description: 'Evidence-based recovery programs for sudden muscle injuries',
    icon: 'heart',
    subpages: ['Hamstring', 'Quadriceps', 'Calf', 'Groin'],
  },
  {
    id: 'chronic-injuries',
    title: 'Chronic Injuries',
    description: 'Long-term management for persistent and overuse injuries',
    icon: 'bolt',
    subpages: ['Foot', 'Hamstring', 'Quadriceps', 'Calf', 'Groin', 'Other Tendons'],
  },
  {
    id: 'back-injuries',
    title: 'Back Injuries',
    description: 'Specialized programs for spinal and back-related issues',
    icon: 'running',
    subpages: ['Disc Issues', 'Ligament', 'Other'],
  },
  {
    id: 'bone-breaks',
    title: 'Bone Breaks',
    description: 'Recovery protocols for fractures and bone injuries',
    icon: 'bone',
    subpages: ['Ankle', 'Knee', 'Shoulder', 'Rib', 'Other'],
  },
];

export const RehabScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);

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
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" color="foreground">
          Rehabilitation
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.aiCard}>
          <CardHeader>
            <View style={styles.aiTitleRow}>
              <FontAwesome5 name="robot" size={18} color={theme.colors.primary} solid />
              <CardTitle>AI Rehab Consultant</CardTitle>
            </View>
            <Text variant="small" color="muted">
              Describe your injury and symptoms to generate a structured rehab plan.
              {isAuthenticated && !isGuest && !isStarLike && (
                <Text variant="small" color="muted">{`\nRequires 50 Spikes (you have ${spikes}).`}</Text>
              )}
            </Text>
          </CardHeader>
          <CardContent style={{ gap: theme.spacing.md }}>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your injury, pain level, symptoms, and current limitations…"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              value={aiQuery}
              onChangeText={setAiQuery}
              editable={isAuthenticated && !isGuest}
            />

            <Button
              variant="default"
              size="lg"
              onPress={handleAiSubmit}
              loading={aiConsultationMutation.isPending}
              disabled={!aiQuery.trim() || !isAuthenticated || isGuest}
            >
              <FontAwesome5 name="magic" size={16} color="white" solid />
              <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                Get AI plan
              </Text>
            </Button>

            {!isAuthenticated || isGuest ? (
              <Text variant="small" color="muted" style={styles.helperText}>
                Sign in to use AI rehab consultation.
              </Text>
            ) : !canUseAi ? (
              <Text variant="small" color="muted" style={styles.helperText}>
                You need Star access or at least 50 Spikes.
              </Text>
            ) : null}

            {!!aiResponse && (
              <View style={styles.responseBox}>
                <Text variant="h4" weight="semiBold" color="foreground" style={{ marginBottom: theme.spacing.sm }}>
                  Your plan
                </Text>
                <Text variant="body" color="foreground" style={styles.responseText}>
                  {aiResponse}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        <View style={styles.sectionHeaderRow}>
          <Text variant="h4" weight="semiBold" color="foreground">
            Rehab categories
          </Text>
          {aiConsultationMutation.isPending && (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          )}
        </View>

        <View style={styles.categoryList}>
          {categories.map((cat) => (
            <Card key={cat.id} style={styles.categoryCard}>
              <CardContent style={styles.categoryContent}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryIcon}>
                    <FontAwesome5 name={cat.icon as any} size={16} color={theme.colors.primary} solid />
                  </View>
                  <View style={styles.categoryText}>
                    <Text variant="body" weight="semiBold" color="foreground">
                      {cat.title}
                    </Text>
                    <Text variant="small" color="muted">
                      {cat.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.subpageRow}>
                  {cat.subpages.map((sp) => (
                    <TouchableOpacity
                      key={sp}
                      style={styles.subpageChip}
                      onPress={() => Alert.alert('Protocol', `${sp} protocol is being ported to mobile next.`)}
                    >
                      <Text variant="small" color="primary" weight="medium">
                        {sp}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerSpacer: { flex: 1 },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  aiCard: {
    marginBottom: 0,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  buttonText: { marginLeft: theme.spacing.sm },
  helperText: { textAlign: 'center', lineHeight: 18 },
  responseBox: {
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
  },
  responseText: { lineHeight: 22 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  categoryList: {
    gap: theme.spacing.md,
  },
  categoryCard: {
    marginBottom: 0,
  },
  categoryContent: {
    gap: theme.spacing.md,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    flex: 1,
    gap: 2,
  },
  subpageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  subpageChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSolid,
  },
});
