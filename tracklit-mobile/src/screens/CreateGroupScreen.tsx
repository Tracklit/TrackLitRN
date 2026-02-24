import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import {
  CaretLeft,
  Camera,
  Users,
  CheckCircle,
  X,
  Lock,
  UsersThree,
  Warning,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';
import { env } from '@/config/env';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  orange: '#FF7A00',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.06)',
  iconBg: 'rgba(255,255,255,0.05)',
  inputBg: 'rgba(255,255,255,0.04)',
  red: '#ef4444',
};

const MAX_GROUP_SIZE = 10;

interface Friend {
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

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Friend[]>([]);

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => apiRequest<Friend[]>('/api/friends'),
    enabled: canUse,
  });

  const friends = useMemo(() => friendsQuery.data ?? [], [friendsQuery.data]);

  const pickImage = useCallback(async () => {
    try {
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permResult.status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library permission is required to choose a group photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open photo library.');
    }
  }, []);

  const removeImage = useCallback(() => {
    setImageUri(null);
  }, []);

  const toggleMember = useCallback((friend: Friend) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m.id === friend.id);
      if (exists) return prev.filter((m) => m.id !== friend.id);
      if (prev.length >= MAX_GROUP_SIZE - 1) {
        Alert.alert('Limit reached', `Groups are limited to ${MAX_GROUP_SIZE} members.`);
        return prev;
      }
      return [...prev, friend];
    });
  }, []);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!canUse) throw new Error('Login required');
      if (!name.trim()) throw new Error('Group name is required.');

      const token = await getToken();
      if (!token) throw new Error('Missing auth token');

      const memberIds = selectedMembers.map((m) => m.id);

      if (imageUri) {
        const formData = new FormData();
        formData.append('name', name.trim());
        if (description.trim()) formData.append('description', description.trim());
        formData.append('isPrivate', String(isPrivate));

        const uriParts = imageUri.split('.');
        const ext = uriParts[uriParts.length - 1] || 'jpg';
        formData.append('image', {
          uri: imageUri,
          name: `group.${ext}`,
          type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        } as any);

        if (memberIds.length > 0) {
          formData.append('memberIds', JSON.stringify(memberIds));
        }

        const response = await fetch(`${env.API_BASE_URL}/api/chat/groups`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          let errorMsg = 'Failed to create group';
          try {
            const json = await response.json();
            errorMsg = json.message || json.error || errorMsg;
          } catch {
            try {
              errorMsg = await response.text() || errorMsg;
            } catch {}
          }
          throw new Error(errorMsg);
        }
        return response.json();
      } else {
        const body: Record<string, any> = {
          name: name.trim(),
          isPrivate,
        };
        if (description.trim()) body.description = description.trim();
        if (memberIds.length > 0) body.memberIds = memberIds;

        return apiRequest('/api/chat/groups', {
          method: 'POST',
          data: body,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      Alert.alert('Group Created', 'Your group has been created.');
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert('Create failed', error.message || 'Please try again.');
    },
  });

  const canCreate = canUse && name.trim().length > 0 && !createMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <CaretLeft size={18} color={C.textSecondary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.createBtn, !canCreate && styles.createBtnDisabled]}
          onPress={() => createMutation.mutate()}
          disabled={!canCreate}
          activeOpacity={0.7}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={[styles.createBtnText, !canCreate && styles.createBtnTextDisabled]}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {!canUse ? (
          <View style={styles.emptyContainer}>
            <UsersThree size={40} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>Sign in to create a group.</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.imagePickerRow} onPress={pickImage} activeOpacity={0.6}>
              {imageUri ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                    <X size={12} color={C.textPrimary} weight="bold" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Camera size={22} color={C.textMuted} weight="fill" />
                </View>
              )}
              <View style={styles.imagePickerText}>
                <Text style={styles.imageLabel}>Group Photo</Text>
                <Text style={styles.imageSub}>Tap to choose an image</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Sprint Squad"
                placeholderTextColor={C.textMuted}
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="What's this group about?"
                placeholderTextColor={C.textMuted}
                multiline
                maxLength={200}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Lock size={16} color={C.textSecondary} weight="fill" />
                <Text style={styles.switchText}>Private group</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                thumbColor={isPrivate ? C.orange : 'rgba(255,255,255,0.3)'}
                trackColor={{ true: 'rgba(255,122,0,0.3)', false: 'rgba(255,255,255,0.08)' }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Add Members
              </Text>
              <Text style={styles.sectionCount}>
                {selectedMembers.length}/{MAX_GROUP_SIZE - 1}
              </Text>
            </View>

            {selectedMembers.length >= MAX_GROUP_SIZE - 1 && (
              <View style={styles.limitBanner}>
                <Warning size={14} color={C.orange} weight="fill" />
                <Text style={styles.limitText}>
                  Group limit of {MAX_GROUP_SIZE} members reached
                </Text>
              </View>
            )}

            {friendsQuery.isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={C.orange} />
                <Text style={styles.loadingText}>Loading connections...</Text>
              </View>
            ) : friends.length === 0 ? (
              <View style={styles.emptyMembers}>
                <Users size={24} color={C.textMuted} weight="fill" />
                <Text style={styles.emptyMembersText}>
                  No connections to invite yet.{'\n'}Connect with athletes first.
                </Text>
              </View>
            ) : (
              <View style={styles.membersList}>
                {friends.map((friend, index) => {
                  const selected = selectedMembers.some((m) => m.id === friend.id);
                  return (
                    <View key={friend.id}>
                      {index > 0 && <View style={styles.memberDivider} />}
                      <TouchableOpacity
                        style={styles.memberRow}
                        onPress={() => toggleMember(friend)}
                        activeOpacity={0.6}
                      >
                        <Avatar
                          size="sm"
                          fallback={(friend.name || friend.username || 'U').slice(0, 2)}
                          src={friend.profileImageUrl || undefined}
                        />
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {friend.name || friend.username}
                          </Text>
                          <Text style={styles.memberUsername} numberOfLines={1}>
                            @{friend.username}
                          </Text>
                        </View>
                        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                          {selected && <CheckCircle size={18} color={C.orange} weight="fill" />}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.3,
  },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: C.orange,
  },
  createBtnDisabled: {
    backgroundColor: 'rgba(255,122,0,0.25)',
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  createBtnTextDisabled: {
    color: 'rgba(0,0,0,0.4)',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.iconBg,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: 56,
    height: 56,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  imagePickerText: {
    flex: 1,
    gap: 2,
  },
  imageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },
  imageSub: {
    fontSize: 11,
    color: C.textMuted,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.textPrimary,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textPrimary,
  },
  divider: {
    height: 0.5,
    backgroundColor: C.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,122,0,0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  limitText: {
    fontSize: 11,
    color: C.orange,
    fontWeight: '500',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 12,
    color: C.textMuted,
  },
  emptyMembers: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyMembersText: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  membersList: {
    gap: 0,
  },
  memberDivider: {
    height: 0.5,
    backgroundColor: C.border,
    marginLeft: 48,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  memberInfo: {
    flex: 1,
    gap: 1,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },
  memberUsername: {
    fontSize: 11,
    color: C.textMuted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: C.orange,
    backgroundColor: 'rgba(255,122,0,0.1)',
  },
});
