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
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import type { RootStackParamList } from '@/navigation/types';
import theme from '@/utils/theme';

interface ExerciseItem {
  id: number;
  name: string;
  description: string | null;
  type: string;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  duration?: number | null;
  videoAnalysisId?: number | null;
  createdAt: string;
  userId: number;
}

interface ExerciseLibraryResponse {
  exercises: ExerciseItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const ExerciseLibraryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const canUse = isAuthenticated && !isGuest;

  const libraryQuery = useQuery({
    queryKey: ['exercise-library', 1],
    queryFn: () => apiRequest<ExerciseLibraryResponse>('/api/exercise-library?page=1'),
    enabled: canUse,
  });

  const pickFile = async () => {
    if (!canUse) {
      Alert.alert('Sign In Required', 'Please sign in to use the Exercise Library.');
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Unable to pick file', result.errorMessage || 'Please try again.');
      return;
    }

    const asset = result.assets?.[0] ?? null;
    if (!asset?.uri) {
      Alert.alert('Unable to pick file', 'No file was selected.');
      return;
    }

    setSelectedAsset(asset);
    setName(asset.fileName?.replace(/\.[^.]+$/, '') || '');
    setDescription('');
    setTags('');
    setUploadModalOpen(true);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAsset?.uri) throw new Error('No file selected');

      const token = await getToken();
      if (!token) throw new Error('Missing auth token');

      const formData = new FormData();
      if (name.trim()) formData.append('name', name.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (tags.trim()) formData.append('tags', tags.trim());
      formData.append('isPublic', 'false');

      const fileName = selectedAsset.fileName || 'upload';
      const type = selectedAsset.type || 'application/octet-stream';

      formData.append('file', {
        uri: selectedAsset.uri,
        name: fileName,
        type,
      } as any);

      const response = await fetch(`${env.API_BASE_URL}/api/exercise-library/upload`, {
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
      setName('');
      setDescription('');
      setTags('');
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
      Alert.alert('Saved', 'Added to your exercise library.');
    },
    onError: (error: Error) => {
      Alert.alert('Upload failed', error.message || 'Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (exerciseId: number) => {
      await apiRequest(`/api/exercise-library/${exerciseId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
    },
    onError: (error: Error) => {
      Alert.alert('Delete failed', error.message || 'Please try again.');
    },
  });

  const items = useMemo(() => libraryQuery.data?.exercises ?? [], [libraryQuery.data]);

  const handleDelete = (exerciseId: number) => {
    Alert.alert('Delete item?', 'This will remove it from your library.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(exerciseId) },
    ]);
  };

  const resolveUrl = (fileUrl: string | null) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http')) return fileUrl;
    if (fileUrl.startsWith('/')) return `${env.API_BASE_URL}${fileUrl}`;
    return `${env.API_BASE_URL}/${fileUrl}`;
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: theme.spacing.xl }) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="h2" weight="bold" color="foreground">
            Exercise Library
          </Text>
          <Text variant="body" color="muted">
            Save training videos and reference clips.
          </Text>
        </View>

        <Card style={styles.actionsCard}>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.actionRow}>
              <Button variant="default" size="lg" onPress={() => navigation.navigate('ExerciseLibraryAdd')} disabled={!canUse}>
                <FontAwesome5 name="plus" size={16} color="white" solid />
                <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                  Add
                </Text>
              </Button>
              <Button variant="outline" size="lg" onPress={pickFile} disabled={!canUse || uploadMutation.isPending}>
                <FontAwesome5 name="upload" size={16} color={theme.colors.foreground} solid />
                <Text variant="body" weight="bold" color="foreground" style={styles.buttonText}>
                  Quick upload
                </Text>
              </Button>
            </View>
            {!canUse && (
              <Text variant="small" color="muted" style={styles.helperText}>
                Sign in to view and upload.
              </Text>
            )}
          </CardContent>
        </Card>

        <View style={styles.sectionHeaderRow}>
          <Text variant="h4" weight="semiBold" color="foreground">
            Your items
          </Text>
          {libraryQuery.isFetching && <ActivityIndicator size="small" color={theme.colors.primary} />}
        </View>

        {!canUse ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Sign in to view your library.
          </Text>
        ) : libraryQuery.isLoading ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Loading library...
          </Text>
        ) : libraryQuery.isError ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Unable to load your library.
          </Text>
        ) : items.length === 0 ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            No items yet.
          </Text>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <Card key={item.id} style={styles.itemCard}>
                <CardContent style={styles.itemContent}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemIcon}>
                      <FontAwesome5
                        name={item.fileUrl ? 'file-video' : 'link'}
                        size={16}
                        color={theme.colors.primary}
                        solid
                      />
                    </View>
                    <View style={styles.itemText}>
                      <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text variant="small" color="muted" numberOfLines={1}>
                        {item.description || item.type}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                      style={styles.deleteButton}
                    >
                      <FontAwesome5 name="trash" size={16} color={theme.colors.destructive} solid />
                    </TouchableOpacity>
                  </View>

                  {resolveUrl(item.fileUrl) && (
                    <Text variant="small" color="muted" style={styles.urlText} numberOfLines={1}>
                      {resolveUrl(item.fileUrl)}
                    </Text>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={uploadModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setUploadModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.modalTitle}>
              Add to library
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Tags (comma separated)"
              placeholderTextColor={theme.colors.textMuted}
              value={tags}
              onChangeText={setTags}
            />

            <View style={styles.modalActions}>
              <Button variant="ghost" onPress={() => setUploadModalOpen(false)} disabled={uploadMutation.isPending} style={styles.modalButton}>
                Cancel
              </Button>
              <Button variant="default" onPress={() => uploadMutation.mutate()} loading={uploadMutation.isPending} style={styles.modalButton}>
                Upload
              </Button>
            </View>
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
    marginTop: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  actionsCard: { marginBottom: 0 },
  actionRow: { flexDirection: 'row', gap: theme.spacing.md },
  buttonText: { marginLeft: theme.spacing.sm },
  helperText: { marginTop: theme.spacing.sm, textAlign: 'center' },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  emptyText: { textAlign: 'center', paddingVertical: theme.spacing.lg },
  list: { gap: theme.spacing.sm },
  itemCard: { marginBottom: 0 },
  itemContent: { paddingVertical: theme.spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { flex: 1 },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  urlText: { marginTop: theme.spacing.sm },
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
  modalTitle: { textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
  },
  modalButton: { minWidth: 120 },
});
