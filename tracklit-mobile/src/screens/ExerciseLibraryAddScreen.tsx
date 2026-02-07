import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';
import { env } from '@/config/env';
import { queryClient } from '@/lib/queryClient';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Tab = 'upload' | 'youtube';

interface LibraryLimits {
  uploads: { current: number; limit: number; canUpload: boolean };
  youtube: { current: number; limit: number; canAdd: boolean };
}

export const ExerciseLibraryAddScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const canUse = isAuthenticated && !isGuest;

  const contentBottomPadding = useMemo(
    () => getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: theme.spacing.xl }),
    [insets.bottom],
  );

  const [tab, setTab] = useState<Tab>('upload');
  const [isPublic, setIsPublic] = useState(false);

  // Shared fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  // Upload-only
  const [asset, setAsset] = useState<Asset | null>(null);

  // YouTube-only
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const limitsQuery = useQuery({
    queryKey: ['exercise-library-limits'],
    queryFn: () => apiRequest<LibraryLimits>('/api/exercise-library/limits'),
    enabled: canUse,
  });

  const limits = limitsQuery.data;
  const canUpload = limits?.uploads?.canUpload ?? true;
  const canAddYoutube = limits?.youtube?.canAdd ?? true;

  const pickFile = async () => {
    if (!canUse) {
      Alert.alert('Sign In Required', 'Please sign in to add to the exercise library.');
      return;
    }
    if (!canUpload) {
      Alert.alert('Limit reached', 'Your upload limit is reached. Upgrade your plan to upload more.');
      return;
    }

    const result = await launchImageLibrary({ mediaType: 'mixed', selectionLimit: 1 });
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Unable to pick file', result.errorMessage || 'Please try again.');
      return;
    }
    const selected = result.assets?.[0] ?? null;
    if (!selected?.uri) {
      Alert.alert('Unable to pick file', 'No file was selected.');
      return;
    }
    setAsset(selected);
    setName(selected.fileName?.replace(/\.[^.]+$/, '') || '');
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!asset?.uri) throw new Error('Please select a file.');
      if (!canUpload) throw new Error('Upload limit reached.');

      const token = await getToken();
      if (!token) throw new Error('Missing auth token');

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || 'upload',
        type: asset.type || 'application/octet-stream',
      } as any);
      if (name.trim()) formData.append('name', name.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (tags.trim()) formData.append('tags', tags.trim());
      formData.append('isPublic', String(isPublic));

      const response = await fetch(`${env.API_BASE_URL}/api/exercise-library/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-library-limits'] });
      Alert.alert('Saved', 'Added to your exercise library.');
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert('Upload failed', error.message || 'Please try again.');
    },
  });

  const youtubeMutation = useMutation({
    mutationFn: async () => {
      if (!canAddYoutube) throw new Error('YouTube link limit reached.');
      if (!youtubeUrl.trim()) throw new Error('YouTube URL is required.');

      return apiRequest('/api/exercise-library/youtube', {
        method: 'POST',
        data: {
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          youtubeUrl: youtubeUrl.trim(),
          tags: tags.trim() || undefined,
          isPublic,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-library-limits'] });
      Alert.alert('Saved', 'YouTube video added to your exercise library.');
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert('Add failed', error.message || 'Please try again.');
    },
  });

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" style={{ paddingTop: insets.top }} contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h3" weight="bold" color="foreground">
              Add to Library
            </Text>
            <Text variant="small" color="muted">
              Upload a file or add a YouTube link
            </Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Limits</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {!canUse ? (
              <Text variant="body" color="muted">
                Sign in to view limits.
              </Text>
            ) : limitsQuery.isLoading ? (
              <View style={styles.row}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text variant="body" color="muted">
                  Loading limits...
                </Text>
              </View>
            ) : limits ? (
              <>
                <Text variant="body" color="foreground">
                  Uploads: {limits.uploads.current} / {limits.uploads.limit === -1 ? '∞' : limits.uploads.limit}
                </Text>
                <Text variant="body" color="foreground">
                  YouTube links: {limits.youtube.current} / {limits.youtube.limit === -1 ? '∞' : limits.youtube.limit}
                </Text>
              </>
            ) : (
              <Text variant="body" color="muted">
                Unable to load limits.
              </Text>
            )}
          </CardContent>
        </Card>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'upload' && styles.tabActive, !canUpload && styles.tabDisabled]}
            onPress={() => setTab('upload')}
            disabled={!canUpload}
          >
            <Text variant="body" weight="medium" color={tab === 'upload' ? 'foreground' : 'muted'}>
              Upload File
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'youtube' && styles.tabActive, !canAddYoutube && styles.tabDisabled]}
            onPress={() => setTab('youtube')}
            disabled={!canAddYoutube}
          >
            <Text variant="body" weight="medium" color={tab === 'youtube' ? 'foreground' : 'muted'}>
              YouTube Link
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>{tab === 'upload' ? 'Upload' : 'YouTube'}</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <View style={styles.switchRow}>
              <Text variant="body" color="foreground" weight="semiBold">
                Public
              </Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                thumbColor={isPublic ? theme.colors.primary : theme.colors.textMuted}
                trackColor={{ true: theme.colors.primary + '66', false: theme.colors.muted }}
                disabled={!canUse}
              />
            </View>

            {tab === 'upload' ? (
              <>
                <Button variant="default" size="lg" onPress={pickFile} disabled={!canUse || !canUpload || uploadMutation.isPending}>
                  <FontAwesome5 name="upload" size={16} color="white" solid />
                  <Text variant="body" weight="bold" color="primary-foreground" style={styles.btnText}>
                    Select File
                  </Text>
                </Button>
                {!!asset?.fileName && (
                  <Text variant="small" color="muted">
                    Selected: {asset.fileName}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text variant="body" color="foreground" weight="semiBold" style={styles.label}>
                  YouTube URL
                </Text>
                <TextInput
                  style={styles.input}
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  placeholder="https://www.youtube.com/watch?v=..."
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </>
            )}

            <Text variant="body" color="foreground" weight="semiBold" style={styles.label}>
              Name
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Exercise name"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text variant="body" color="foreground" weight="semiBold" style={styles.label}>
              Description
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              placeholderTextColor={theme.colors.textMuted}
              multiline
            />

            <Text variant="body" color="foreground" weight="semiBold" style={styles.label}>
              Tags
            </Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="comma,separated,tags"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
            />

            <Button
              variant="default"
              size="lg"
              onPress={() => (tab === 'upload' ? uploadMutation.mutate() : youtubeMutation.mutate())}
              disabled={
                !canUse ||
                (tab === 'upload' ? uploadMutation.isPending || !canUpload : youtubeMutation.isPending || !canAddYoutube)
              }
              loading={tab === 'upload' ? uploadMutation.isPending : youtubeMutation.isPending}
            >
              <FontAwesome5 name="plus" size={16} color="white" solid />
              <Text variant="body" weight="bold" color="primary-foreground" style={styles.btnText}>
                Add to library
              </Text>
            </Button>
          </CardContent>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.muted,
    padding: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.backgroundSolid,
  },
  tabDisabled: {
    opacity: 0.5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    marginTop: theme.spacing.sm,
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
  btnText: {
    marginLeft: theme.spacing.sm,
  },
});


