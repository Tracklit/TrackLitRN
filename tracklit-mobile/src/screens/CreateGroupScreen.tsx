import React, { useState, useCallback } from 'react';
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
import { useQuery } from '@tanstack/react-query';
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

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Friend {
  id: number;
  name: string;
  username: string;
  profileImageUrl?: string | null;
}

const C = {
  bg:            '#0E0F14',
  card:          '#1C1F2B',
  orange:        '#FF7A00',
  textPrimary:   '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted:     'rgba(255,255,255,0.4)',
  border:        'rgba(255,255,255,0.06)',
  iconBg:        'rgba(255,255,255,0.05)',
  inputBg:       'rgba(255,255,255,0.04)',
};

const MAX_MEMBERS = 10;

export const CreateGroupScreen: React.FC = () => {
  const insets    = useSafeAreaInsets();
  const nav       = useNavigation<Nav>();
  const { user, isAuthenticated } = useAuth();
  const isGuest   = user?.id === 'guest';
  const canUse    = isAuthenticated && !isGuest;

  const [name,            setName]            = useState('');
  const [description,     setDescription]     = useState('');
  const [isPrivate,       setIsPrivate]       = useState(false);
  const [imageUri,        setImageUri]        = useState<string | null>(null);
  const [selected,        setSelected]        = useState<Friend[]>([]);
  const [submitting,      setSubmitting]      = useState(false);

  // ── load connections ──────────────────────────────────────────────────────
  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn:  () => apiRequest<Friend[]>('/api/friends'),
    enabled:  canUse,
  });
  const friends = friendsQuery.data ?? [];

  // ── pick image ────────────────────────────────────────────────────────────
  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.');
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
  }, []);

  // ── toggle member ─────────────────────────────────────────────────────────
  const toggleMember = useCallback((friend: Friend) => {
    setSelected(prev => {
      if (prev.some(m => m.id === friend.id)) {
        return prev.filter(m => m.id !== friend.id);
      }
      if (prev.length >= MAX_MEMBERS - 1) {
        Alert.alert('Limit reached', `Groups are limited to ${MAX_MEMBERS} members.`);
        return prev;
      }
      return [...prev, friend];
    });
  }, []);

  // ── submit ────────────────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (!canUse || !name.trim() || submitting) return;
    setSubmitting(true);

    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in — please log in again.');

      const creator = user
        ? [{ id: user.id, name: user.name, username: user.username ?? user.email ?? '', profileImageUrl: user.profileImageUrl, role: 'admin' }]
        : [];

      const members = [
        ...creator,
        ...selected.map(m => ({
          id:              m.id,
          name:            m.name,
          username:        m.username,
          profileImageUrl: m.profileImageUrl,
        })),
      ];

      let response: Response;

      if (imageUri) {
        // multipart/form-data when there is an image
        const form = new FormData();
        form.append('name',        name.trim());
        form.append('description', description.trim());
        form.append('isPrivate',   isPrivate ? 'true' : 'false');
        if (members.length > 0) form.append('members', JSON.stringify(members));

        const ext = imageUri.split('.').pop() || 'jpg';
        form.append('image', { uri: imageUri, name: `group.${ext}`, type: `image/${ext === 'png' ? 'png' : 'jpeg'}` } as any);

        response = await fetch(`${env.API_BASE_URL}/api/chat/groups`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
          body:    form,
        });
      } else {
        // plain JSON when no image
        response = await fetch(`${env.API_BASE_URL}/api/chat/groups`, {
          method:  'POST',
          headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name:        name.trim(),
            description: description.trim(),
            isPrivate:   isPrivate ? 'true' : 'false',
            ...(members.length > 0 && { members: JSON.stringify(members) }),
          }),
        });
      }

      const text = await response.text();
      console.log('[CreateGroup] status=%d body=%s', response.status, text.slice(0, 500));

      if (!response.ok) {
        let msg = `Server error (${response.status})`;
        try {
          const j = JSON.parse(text);
          msg = j.details || j.message || j.error || msg;
        } catch {
          if (text) msg = text.slice(0, 300);
        }
        throw new Error(msg);
      }

      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      Alert.alert('Group Created', 'Your group has been created successfully.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Could not create group', err?.message || 'Unknown error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [canUse, name, description, isPrivate, imageUri, selected, submitting, nav]);

  const canSubmit = canUse && name.trim().length > 0 && !submitting;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <CaretLeft size={18} color={C.textSecondary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.createBtn, !canSubmit && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!canSubmit}
          activeOpacity={0.7}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={[styles.createBtnText, !canSubmit && styles.createBtnTextDim]}>Create</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {!canUse ? (
          <View style={styles.centred}>
            <UsersThree size={40} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>Sign in to create a group.</Text>
          </View>
        ) : (
          <>
            {/* image picker */}
            <TouchableOpacity style={styles.imageRow} onPress={pickImage} activeOpacity={0.6}>
              {imageUri ? (
                <View style={styles.imageWrap}>
                  <Image source={{ uri: imageUri }} style={styles.imageThumb} />
                  <TouchableOpacity style={styles.removeImg} onPress={() => setImageUri(null)}>
                    <X size={12} color={C.textPrimary} weight="bold" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Camera size={22} color={C.textMuted} weight="fill" />
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.imageLabel}>Group Photo</Text>
                <Text style={styles.imageSub}>Tap to choose</Text>
              </View>
            </TouchableOpacity>

            {/* name */}
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

            {/* description */}
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

            {/* private toggle */}
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

            {/* members header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Add Members</Text>
              <Text style={styles.sectionCount}>{selected.length}/{MAX_MEMBERS - 1}</Text>
            </View>

            {selected.length >= MAX_MEMBERS - 1 && (
              <View style={styles.limitBanner}>
                <Warning size={14} color={C.orange} weight="fill" />
                <Text style={styles.limitText}>Member limit reached ({MAX_MEMBERS})</Text>
              </View>
            )}

            {/* members list */}
            {friendsQuery.isLoading ? (
              <View style={styles.centredRow}>
                <ActivityIndicator size="small" color={C.orange} />
                <Text style={styles.mutedText}>Loading connections…</Text>
              </View>
            ) : friends.length === 0 ? (
              <View style={styles.centred}>
                <Users size={24} color={C.textMuted} weight="fill" />
                <Text style={styles.emptyText}>
                  No connections to invite yet.{'\n'}Connect with athletes first.
                </Text>
              </View>
            ) : (
              <View>
                {friends.map((friend, i) => {
                  const isSelected = selected.some(m => m.id === friend.id);
                  return (
                    <View key={friend.id}>
                      {i > 0 && <View style={styles.memberDivider} />}
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
                        <View style={{ flex: 1, gap: 1 }}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {friend.name || friend.username}
                          </Text>
                          <Text style={styles.memberUsername} numberOfLines={1}>
                            @{friend.username}
                          </Text>
                        </View>
                        <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                          {isSelected && <CheckCircle size={18} color={C.orange} weight="fill" />}
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
  container:    { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 20,
    paddingVertical:  14,
    gap:              10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.iconBg,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle:   { fontSize: 16, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.3 },
  createBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, backgroundColor: C.orange,
  },
  createBtnDisabled: { backgroundColor: 'rgba(255,122,0,0.25)' },
  createBtnText:     { fontSize: 12, fontWeight: '700', color: '#000' },
  createBtnTextDim:  { color: 'rgba(0,0,0,0.4)' },
  content:    { padding: 20, gap: 20 },
  centred:    { alignItems: 'center', paddingVertical: 40, gap: 12 },
  centredRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  emptyText:  { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  mutedText:  { fontSize: 12, color: C.textMuted },
  imageRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  imagePlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.iconBg,
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  imageWrap:   { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  imageThumb:  { width: 56, height: 56 },
  removeImg: {
    position: 'absolute', top: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  imageLabel:  { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  imageSub:    { fontSize: 11, color: C.textMuted },
  inputGroup:  { gap: 6 },
  label: {
    fontSize: 11, fontWeight: '600', color: C.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 0.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    color: C.textPrimary, fontSize: 14,
  },
  textArea:    { minHeight: 80, textAlignVertical: 'top' },
  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchText:  { fontSize: 13, fontWeight: '500', color: C.textPrimary },
  divider:     { height: 0.5, backgroundColor: C.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  sectionCount: { fontSize: 11, fontWeight: '600', color: C.textMuted },
  limitBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,122,0,0.08)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  limitText:      { fontSize: 11, color: C.orange, fontWeight: '500' },
  memberDivider:  { height: 0.5, backgroundColor: C.border, marginLeft: 48 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 10,
  },
  memberName:     { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  memberUsername: { fontSize: 11, color: C.textMuted },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { borderColor: C.orange, backgroundColor: 'rgba(255,122,0,0.1)' },
});
