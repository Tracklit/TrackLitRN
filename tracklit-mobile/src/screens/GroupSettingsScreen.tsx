import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  UserPlus,
  CheckCircle,
  FloppyDisk,
  Users,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { apiRequest } from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';
import { env } from '@/config/env';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import theme from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'GroupSettings'>;

interface Member {
  id: number;
  name?: string | null;
  username: string;
  profileImageUrl?: string | null;
  profile_image_url?: string | null;
  role?: string | null;
}

interface Friend {
  id: number;
  name?: string | null;
  username: string;
  profileImageUrl?: string | null;
}

interface GroupDetail {
  id: number;
  name: string;
  imageUrl?: string;
  memberCount?: number;
  members?: Member[];
}

export const GroupSettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { groupId, groupName: initialName, groupImageUrl: initialImage } = route.params;
  const { user } = useAuth();

  const [name, setName] = useState(initialName);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const groupQuery = useQuery({
    queryKey: ['group-detail', groupId],
    queryFn: () => apiRequest<GroupDetail>(`/api/chat/groups/${groupId}`),
  });

  const groupData = groupQuery.data;
  const currentMembers: Member[] = groupData?.members ?? [];
  const currentMemberIds = new Set(currentMembers.map(m => m.id));

  const myMember = currentMembers.find(m => Number(m.id) === Number(user?.id));
  const isAdmin = myMember?.role === 'admin' || myMember?.role === 'owner';

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => apiRequest<Friend[]>('/api/friends'),
    enabled: isAdmin,
  });

  const eligibleFriends = (friendsQuery.data ?? []).filter(f => !currentMemberIds.has(f.id));

  const pickImage = useCallback(async () => {
    if (!isAdmin) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, [isAdmin]);

  const handleSave = useCallback(async () => {
    if (!isAdmin) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Group name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const baseUrl = env.API_BASE_URL;

      const form = new FormData();
      form.append('name', name.trim());
      if (imageUri) {
        const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        form.append('image', {
          uri: imageUri,
          name: `group.${ext}`,
          type: ext === 'png' ? 'image/png' : 'image/jpeg',
        } as any);
      }

      const response = await fetch(`${baseUrl}/api/chat/groups/${groupId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const responseText = await response.text();
      console.warn('[GroupSettings] response', response.status, responseText.slice(0, 500));

      if (!response.ok) {
        throw new Error(`${response.status}: ${responseText.slice(0, 200)}`);
      }

      let updated: any = null;
      try { updated = JSON.parse(responseText); } catch {}
      console.log('[GroupSettings] saved ok', updated);

      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      queryClient.invalidateQueries({ queryKey: ['chat-info', 'group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });

      Alert.alert('Saved', 'Group settings updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save group settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [isAdmin, name, imageUri, groupId, navigation]);

  const addMemberMutation = useMutation({
    mutationFn: (friendId: number) =>
      apiRequest(`/api/chat/groups/${groupId}/members`, {
        method: 'POST',
        data: { userId: friendId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add member.');
    },
  });

  const displayImage = imageUri || groupData?.imageUrl || initialImage;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#fff" weight="bold" />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" color="foreground" style={styles.headerTitle}>
          {isAdmin ? 'Group Settings' : 'Group Info'}
        </Text>
        {isAdmin ? (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color="#FF7A00" />
              : <FloppyDisk size={22} color="#FF7A00" weight="fill" />}
          </TouchableOpacity>
        ) : (
          <View style={styles.saveBtn} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Group Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={pickImage}
            activeOpacity={isAdmin ? 0.7 : 1}
          >
            {displayImage ? (
              <Image source={{ uri: displayImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Users size={40} color="#64748b" weight="fill" />
              </View>
            )}
            {isAdmin && (
              <View style={styles.cameraOverlay}>
                <Camera size={18} color="#fff" weight="fill" />
              </View>
            )}
          </TouchableOpacity>
          {isAdmin && (
            <Text variant="caption" color="muted" style={styles.avatarHint}>
              Tap to change photo
            </Text>
          )}
        </View>

        {/* Group Name */}
        <View style={styles.section}>
          <Text variant="caption" color="muted" style={styles.sectionLabel}>GROUP NAME</Text>
          {isAdmin ? (
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Group name"
              placeholderTextColor="#64748b"
              maxLength={60}
            />
          ) : (
            <View style={styles.nameReadOnly}>
              <Text variant="body" color="foreground">{name}</Text>
            </View>
          )}
        </View>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="caption" color="muted" style={styles.sectionLabel}>
              MEMBERS {groupData?.memberCount != null ? `· ${groupData.memberCount}` : ''}
            </Text>
          </View>

          {groupQuery.isLoading ? (
            <ActivityIndicator color="#FF7A00" style={{ marginVertical: 16 }} />
          ) : currentMembers.length > 0 ? (
            currentMembers.map((member, i) => (
              <View key={member.id} style={[styles.memberRow, i > 0 && styles.memberDivider]}>
                <Avatar
                  size="sm"
                  src={member.profileImageUrl ?? undefined}
                  fallback={(member.name || member.username || '?')[0].toUpperCase()}
                />
                <View style={styles.memberInfo}>
                  <Text variant="body" color="foreground" weight="semiBold">
                    {member.name || member.username}
                  </Text>
                  {member.name && (
                    <Text variant="caption" color="muted">@{member.username}</Text>
                  )}
                </View>
              </View>
            ))
          ) : null}
        </View>

        {/* Invite Section — admin only */}
        {isAdmin && (
          <View style={styles.section}>
            <Text variant="caption" color="muted" style={styles.sectionLabel}>ADD MEMBERS</Text>

            {friendsQuery.isLoading ? (
              <ActivityIndicator color="#FF7A00" style={{ marginVertical: 12 }} />
            ) : eligibleFriends.length === 0 ? (
              <Text variant="caption" color="muted" style={styles.emptyHint}>
                No connections available to invite.
              </Text>
            ) : (
              eligibleFriends.map((friend, i) => (
                <View key={friend.id} style={[styles.memberRow, i > 0 && styles.memberDivider]}>
                  <Avatar
                    size="sm"
                    src={friend.profileImageUrl ?? undefined}
                    fallback={(friend.name || friend.username || '?')[0].toUpperCase()}
                  />
                  <View style={styles.memberInfo}>
                    <Text variant="body" color="foreground" weight="semiBold">
                      {friend.name || friend.username}
                    </Text>
                    {friend.name && (
                      <Text variant="caption" color="muted">@{friend.username}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.inviteBtn}
                    onPress={() => addMemberMutation.mutate(friend.id)}
                    disabled={addMemberMutation.isPending}
                  >
                    {addMemberMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FF7A00" />
                    ) : (
                      <UserPlus size={18} color="#FF7A00" weight="fill" />
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  saveBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#FF7A00',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1C1F2B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF7A00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0E0F14',
  },
  avatarHint: {
    opacity: 0.6,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
  },
  nameInput: {
    backgroundColor: '#1C1F2B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nameReadOnly: {
    backgroundColor: '#1C1F2B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  memberDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  inviteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,122,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHint: {
    opacity: 0.5,
    paddingVertical: 8,
  },
});
