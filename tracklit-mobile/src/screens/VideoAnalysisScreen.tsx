import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useMutation, useQuery } from '@tanstack/react-query';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';
import { env } from '@/config/env';
import { queryClient } from '@/lib/queryClient';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

type PromptId =
  | 'sprint-form'
  | 'block-start'
  | 'stride-length'
  | 'stride-frequency'
  | 'ground-contact'
  | 'flight-time';

const PROMPTS: Array<{ id: PromptId; title: string; subtitle: string }> = [
  { id: 'sprint-form', title: 'Sprint Form', subtitle: 'Technique & posture' },
  { id: 'block-start', title: 'Block Start', subtitle: 'Reaction & acceleration' },
  { id: 'stride-length', title: 'Stride Length', subtitle: 'Length patterns' },
  { id: 'stride-frequency', title: 'Stride Frequency', subtitle: 'Cadence & rhythm' },
  { id: 'ground-contact', title: 'Ground Contact', subtitle: 'Contact efficiency' },
  { id: 'flight-time', title: 'Flight Time', subtitle: 'Airborne phase' },
];

interface VideoAnalysisItem {
  id: number;
  userId: number;
  name: string;
  description?: string | null;
  fileUrl: string;
  status?: 'processing' | 'completed' | 'failed' | string;
  analysisData?: any;
  createdAt?: string;
}

export const VideoAnalysisScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [videoName, setVideoName] = useState('');
  const [videoDescription, setVideoDescription] = useState('');

  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysisItem | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptId>('sprint-form');
  const [analysisResult, setAnalysisResult] = useState<string>('');

  const videosQuery = useQuery({
    queryKey: ['video-analysis'],
    queryFn: () => apiRequest<VideoAnalysisItem[]>('/api/video-analysis'),
    enabled: isAuthenticated && !isGuest,
  });

  const canUse = isAuthenticated && !isGuest;

  const pickVideo = async () => {
    if (!canUse) {
      Alert.alert('Sign In Required', 'Please sign in to use Video Analysis.');
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'video',
      selectionLimit: 1,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Unable to pick video', result.errorMessage || 'Please try again.');
      return;
    }

    const asset = result.assets?.[0] ?? null;
    if (!asset?.uri) {
      Alert.alert('Unable to pick video', 'No video was selected.');
      return;
    }

    setSelectedAsset(asset);
    setVideoName(asset.fileName?.replace(/\.[^.]+$/, '') || '');
    setVideoDescription('');
    setUploadModalOpen(true);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAsset?.uri) throw new Error('No video selected');
      if (!videoName.trim()) throw new Error('Video name is required');

      const token = await getToken();
      if (!token) throw new Error('Missing auth token');

      const formData = new FormData();
      formData.append('name', videoName.trim());
      if (videoDescription.trim()) {
        formData.append('description', videoDescription.trim());
      }

      const fileName = selectedAsset.fileName || 'video.mp4';
      const type = selectedAsset.type || 'video/mp4';

      formData.append('file', {
        uri: selectedAsset.uri,
        name: fileName,
        type,
      } as any);

      const response = await fetch(`${env.API_BASE_URL}/api/video-analysis/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      setUploadModalOpen(false);
      setSelectedAsset(null);
      setVideoName('');
      setVideoDescription('');
      queryClient.invalidateQueries({ queryKey: ['video-analysis'] });
      Alert.alert('Uploaded', 'Your video was uploaded successfully.');
    },
    onError: (error: Error) => {
      Alert.alert('Upload failed', error.message || 'Please try again.');
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (payload: { videoId: number; promptId: PromptId }) => {
      return apiRequest<{ analysis: string }>(`/api/video-analysis/${payload.videoId}/analyze`, {
        method: 'POST',
        data: { promptId: payload.promptId },
      });
    },
    onSuccess: (data) => {
      setAnalysisResult(data.analysis || '');
      queryClient.invalidateQueries({ queryKey: ['video-analysis'] });
    },
    onError: (error: Error) => {
      Alert.alert('Analysis failed', error.message || 'Please try again.');
    },
  });

  const openAnalysis = (video: VideoAnalysisItem) => {
    setSelectedVideo(video);
    setSelectedPrompt('sprint-form');
    setAnalysisResult(typeof video.analysisData === 'string' ? video.analysisData : '');
    setAnalysisModalOpen(true);
  };

  const handleAnalyze = () => {
    if (!selectedVideo) return;
    analyzeMutation.mutate({ videoId: selectedVideo.id, promptId: selectedPrompt });
  };

  const videos = useMemo(() => videosQuery.data ?? [], [videosQuery.data]);

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text variant="h2" weight="bold" color="foreground">
              Video Analysis
            </Text>
            <Text variant="body" color="muted">
              Upload sprint videos and analyze technique.
            </Text>
          </View>
          <View style={styles.backButton} />
        </View>

        <Card style={styles.actionsCard}>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="default"
              size="lg"
              onPress={pickVideo}
              disabled={!canUse || uploadMutation.isPending}
            >
              <FontAwesome5 name="upload" size={16} color="white" solid />
              <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                Select Video
              </Text>
            </Button>
            {!canUse && (
              <Text variant="small" color="muted" style={styles.helperText}>
                Sign in to upload and analyze videos.
              </Text>
            )}
          </CardContent>
        </Card>

        <View style={styles.sectionHeaderRow}>
          <Text variant="h4" weight="semiBold" color="foreground">
            Your uploads
          </Text>
          {videosQuery.isFetching && <ActivityIndicator size="small" color={theme.colors.primary} />}
        </View>

        {isGuest ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Sign in to view your video uploads.
          </Text>
        ) : videosQuery.isLoading ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Loading videos...
          </Text>
        ) : videosQuery.isError ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Unable to load videos. Pull to refresh.
          </Text>
        ) : videos.length === 0 ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            No uploads yet.
          </Text>
        ) : (
          <View style={styles.list}>
            {videos.map((video) => (
              <TouchableOpacity key={video.id} onPress={() => openAnalysis(video)}>
                <Card style={styles.videoCard}>
                  <CardContent style={styles.videoCardContent}>
                    <View style={styles.videoCardRow}>
                      <View style={styles.videoIcon}>
                        <FontAwesome5 name="video" size={18} color={theme.colors.primary} solid />
                      </View>
                      <View style={styles.videoText}>
                        <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                          {video.name}
                        </Text>
                        <Text variant="small" color="muted" numberOfLines={1}>
                          Status: {video.status || 'unknown'}
                        </Text>
                      </View>
                      <FontAwesome5 name="chevron-right" size={14} color={theme.colors.textMuted} solid />
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Upload modal */}
      <Modal
        visible={uploadModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setUploadModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.modalTitle}>
              Upload video
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Video name"
              placeholderTextColor={theme.colors.textMuted}
              value={videoName}
              onChangeText={setVideoName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.colors.textMuted}
              value={videoDescription}
              onChangeText={setVideoDescription}
              multiline
            />

            <View style={styles.modalActions}>
              <Button
                variant="ghost"
                onPress={() => setUploadModalOpen(false)}
                disabled={uploadMutation.isPending}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onPress={() => uploadMutation.mutate()}
                loading={uploadMutation.isPending}
                style={styles.modalButton}
              >
                Upload
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Analysis modal */}
      <Modal
        visible={analysisModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setAnalysisModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}
          >
            <View style={styles.modalHeaderRow}>
              <Text variant="h4" weight="semiBold" color="foreground" style={styles.modalTitle}>
                Analyze
              </Text>
              <TouchableOpacity onPress={() => setAnalysisModalOpen(false)}>
                <FontAwesome5 name="times" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text variant="body" color="muted" style={styles.modalSubtitle}>
              {selectedVideo?.name}
            </Text>

            <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
              style={styles.modalScroll}
              contentContainerStyle={{ paddingBottom: theme.spacing.md }}
              showsVerticalScrollIndicator={false}
            >
              <Text variant="small" color="muted" style={styles.drawerSectionLabel}>
                PROMPT
              </Text>
              <View style={styles.promptGrid}>
                {PROMPTS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.promptChip,
                      selectedPrompt === p.id && styles.promptChipActive,
                    ]}
                    onPress={() => setSelectedPrompt(p.id)}
                  >
                    <Text
                      variant="small"
                      weight="medium"
                      color={selectedPrompt === p.id ? 'primary' : 'muted'}
                    >
                      {p.title}
                    </Text>
                    <Text
                      variant="small"
                      color={selectedPrompt === p.id ? 'foreground' : 'muted'}
                      style={styles.promptSubtitle}
                    >
                      {p.subtitle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                variant="default"
                size="lg"
                onPress={handleAnalyze}
                loading={analyzeMutation.isPending}
                disabled={!canUse}
                style={styles.analyzeButton}
              >
                <FontAwesome5 name="magic" size={16} color="white" solid />
                <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                  Run analysis
                </Text>
              </Button>

              {!!analysisResult && (
                <View style={styles.analysisBox}>
                  <Text variant="body" color="foreground" style={styles.analysisText}>
                    {analysisResult}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  actionsCard: {
    marginBottom: 0,
  },
  buttonText: {
    marginLeft: theme.spacing.sm,
  },
  helperText: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  list: {
    gap: theme.spacing.sm,
  },
  videoCard: {
    marginBottom: 0,
  },
  videoCardContent: {
    paddingVertical: theme.spacing.md,
  },
  videoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  videoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.backgroundSolid,
    padding: theme.spacing.lg,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    gap: theme.spacing.md,
  },
  modalTitle: {
    textAlign: 'center',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalSubtitle: {
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 520,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
  },
  modalButton: {
    minWidth: 120,
  },
  drawerSectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: theme.spacing.sm,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  promptChip: {
    width: '48%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.card,
  },
  promptChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  promptSubtitle: {
    marginTop: 2,
  },
  analyzeButton: {
    marginTop: theme.spacing.md,
  },
  analysisBox: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
  },
  analysisText: {
    lineHeight: 22,
  },
});
