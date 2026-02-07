import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Image,
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

interface Athlete {
  id: number;
  name: string;
  username: string;
  profileImageUrl?: string | null;
}

export const CreateGroupScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const canUse = isAuthenticated && !isGuest;

  const contentBottomPadding = useMemo(
    () => getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: theme.spacing.xl }),
    [insets.bottom],
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [imageAsset, setImageAsset] = useState<Asset | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Athlete[]>([]);

  const athletesQuery = useQuery({
    queryKey: ['coach-athletes'],
    queryFn: () => apiRequest<Athlete[]>('/api/coach/athletes'),
    enabled: canUse,
  });

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 1 });
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Unable to pick image', result.errorMessage || 'Please try again.');
      return;
    }
    const asset = result.assets?.[0] ?? null;
    if (asset?.uri) setImageAsset(asset);
  };

  const toggleMember = (athlete: Athlete) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m.id === athlete.id);
      return exists ? prev.filter((m) => m.id !== athlete.id) : [...prev, athlete];
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!canUse) throw new Error('Login required');
      if (!name.trim()) throw new Error('Group name is required.');

      const token = await getToken();
      if (!token) throw new Error('Missing auth token');

      const formData = new FormData();
      formData.append('name', name.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('isPrivate', String(isPrivate));
      if (imageAsset?.uri) {
        formData.append('image', {
          uri: imageAsset.uri,
          name: imageAsset.fileName || 'group.jpg',
          type: imageAsset.type || 'image/jpeg',
        } as any);
      }
      if (selectedMembers.length > 0) {
        formData.append('members', JSON.stringify(selectedMembers.map((m) => ({ id: m.id, name: m.name, username: m.username, profileImageUrl: m.profileImageUrl }))));
      }

      const response = await fetch(`${env.API_BASE_URL}/api/chat/groups`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to create group');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      Alert.alert('Created', 'Chat group created successfully.');
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert('Create failed', error.message || 'Please try again.');
    },
  });

  return (
    <LinearGradient colors={theme.gradient.background} locations={theme.gradient.locations} style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" style={{ paddingTop: insets.top }} contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h3" weight="bold" color="foreground">
              Create Group
            </Text>
            <Text variant="small" color="muted">
              Chat channel (web parity)
            </Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        {!canUse && (
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Sign in to create a group.
          </Text>
        )}

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent style={{ gap: theme.spacing.md }}>
            <Button variant="outline" onPress={pickImage} disabled={!canUse}>
              <FontAwesome5 name="camera" size={16} color={theme.colors.foreground} solid />
              <Text variant="body" weight="medium" color="foreground" style={{ marginLeft: theme.spacing.sm }}>
                Choose group image
              </Text>
            </Button>
            {imageAsset?.uri && (
              <View style={styles.previewWrap}>
                <Image source={{ uri: imageAsset.uri }} style={styles.preview} />
              </View>
            )}

            <Text variant="body" weight="semiBold" color="foreground">
              Group name
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Sprint Squad"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text variant="body" weight="semiBold" color="foreground">
              Description
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional"
              placeholderTextColor={theme.colors.textMuted}
              multiline
            />

            <View style={styles.switchRow}>
              <Text variant="body" weight="semiBold" color="foreground">
                Private group
              </Text>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                thumbColor={isPrivate ? theme.colors.primary : theme.colors.textMuted}
                trackColor={{ true: theme.colors.primary + '66', false: theme.colors.muted }}
                disabled={!canUse}
              />
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Invite athletes (optional)</CardTitle>
          </CardHeader>
          <CardContent style={{ gap: theme.spacing.sm }}>
            {!canUse ? (
              <Text variant="body" color="muted">
                Sign in to invite members.
              </Text>
            ) : athletesQuery.isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text variant="body" color="muted">
                  Loading athletes...
                </Text>
              </View>
            ) : (athletesQuery.data ?? []).length === 0 ? (
              <Text variant="body" color="muted">
                No athletes found to invite.
              </Text>
            ) : (
              (athletesQuery.data ?? []).slice(0, 20).map((a) => {
                const selected = selectedMembers.some((m) => m.id === a.id);
                return (
                  <TouchableOpacity key={a.id} style={styles.memberRow} onPress={() => toggleMember(a)}>
                    <FontAwesome5 name={selected ? 'check-circle' : 'circle'} size={16} color={selected ? theme.colors.primary : theme.colors.textMuted} solid />
                    <Text variant="body" color="foreground" style={{ flex: 1 }}>
                      {a.name} (@{a.username})
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </CardContent>
        </Card>

        <Button
          variant="default"
          size="lg"
          onPress={() => createMutation.mutate()}
          loading={createMutation.isPending}
          disabled={!canUse || createMutation.isPending}
        >
          <FontAwesome5 name="users" size={16} color="white" solid />
          <Text variant="body" weight="bold" color="primary-foreground" style={{ marginLeft: theme.spacing.sm }}>
            Create
          </Text>
        </Button>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.lg },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: 0 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm },
  previewWrap: {
    width: '100%',
    height: 140,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  preview: { width: '100%', height: '100%' },
});


