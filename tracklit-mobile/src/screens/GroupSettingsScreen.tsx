import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  UserPlus,
  Users,
  Crown,
  Camera,
  Star,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { apiRequest } from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';
import { env } from '@/config/env';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import { TIER_LIMITS, resolveUserTier } from '@/constants/tierEntitlements';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'GroupSettings'>;

interface Member {
  id: number;
  name?: string | null;
  username: string;
  profileImageUrl?: string | null;
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
  avatar_url?: string;
  memberCount?: number;
  member_count?: number;
  members?: Member[];
  ownerId?: number | null;
  owner_id?: number | null;
  createdBy?: number | null;
  created_by?: number | null;
}

export const GroupSettingsScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { groupId, groupName: initialName, groupImageUrl: initialImage } = route.params;
  const { user } = useAuth();

  const userTier = resolveUserTier((user as any)?.subscriptionTier);
  const tierLimits = TIER_LIMITS[userTier];
  const maxMembersPerGroup = tierLimits.unlimitedMembers ? null : (tierLimits as any).maxMembersPerGroup ?? 10;

  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState('');

  const groupQuery = useQuery({
    queryKey: ['group-detail', groupId],
    queryFn: () => apiRequest<GroupDetail>(`/api/chat/groups/${groupId}`),
  });

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => apiRequest<Friend[]>('/api/friends'),
  });

  const groupData = groupQuery.data;
  const currentMembers: Member[] = groupData?.members ?? [];
  const currentMemberIds = new Set(currentMembers.map(m => m.id));
  const eligibleFriends = (friendsQuery.data ?? []).filter(f => !currentMemberIds.has(f.id));

  const displayName = groupData?.name ?? initialName;
  const serverImage = groupData?.imageUrl ?? groupData?.avatar_url ?? initialImage;
  const displayImage = pendingImageUri ?? serverImage;
  const memberCount = groupData?.memberCount ?? groupData?.member_count ?? currentMembers.length;

  const pickAndUploadImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setPendingImageUri(uri);
    setUploadingImage(true);

    try {
      const token = await getToken();
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const baseUrl = `${env.API_BASE_URL}/api/chat/groups/${groupId}`;

      // Strategy 1: PATCH with 'image' field (server uses upload.single('image'))
      const form = new FormData();
      form.append('image', { uri, name: `group.${ext}`, type: mimeType } as any);

      let response = await fetch(baseUrl, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      let responseText = await response.text();
      console.log('[GroupSettings] PATCH image status=%d body=%s', response.status, responseText.slice(0, 300));

      // Strategy 2: PATCH with 'avatar' field as fallback
      if (!response.ok) {
        const form2 = new FormData();
        form2.append('avatar', { uri, name: `group.${ext}`, type: mimeType } as any);
        response = await fetch(baseUrl, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: form2,
        });
        responseText = await response.text();
        console.log('[GroupSettings] PATCH avatar status=%d body=%s', response.status, responseText.slice(0, 300));
      }

      if (!response.ok) {
        setPendingImageUri(null);
        Alert.alert('Upload failed', `All upload methods failed.\nLast response: ${response.status}: ${responseText.slice(0, 200)}`);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      queryClient.invalidateQueries({ queryKey: ['chat-info', 'group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });
      Alert.alert('Done', 'Group photo updated.');
    } catch (err: any) {
      setPendingImageUri(null);
      Alert.alert('Error', err?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  }, [groupId]);

  const addMemberMutation = useMutation({
    mutationFn: (friendId: number) =>
      apiRequest(`/api/chat/groups/${groupId}/members`, {
        method: 'POST',
        data: { userId: friendId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      queryClient.invalidateQueries({ queryKey: ['chat-info', 'group', groupId] });
    },
    onError: () => {
      Alert.alert('Error', 'Could not add member. Please try again.');
    },
  });

  const handleAddMember = useCallback((friendId: number) => {
    if (maxMembersPerGroup !== null && memberCount >= maxMembersPerGroup) {
      let msg = '';
      if (userTier === 'free') {
        msg = `Free plan allows up to ${maxMembersPerGroup} members per group.\nUpgrade to Pro for up to 30 members, or Elite for unlimited.`;
      } else if (userTier === 'pro') {
        msg = `Pro plan allows up to ${maxMembersPerGroup} members per group.\nUpgrade to Elite for unlimited members.`;
      } else {
        msg = `This group has reached the member limit (${maxMembersPerGroup}).`;
      }
      setPaywallMessage(msg);
      setShowPaywall(true);
      return;
    }
    addMemberMutation.mutate(friendId);
  }, [maxMembersPerGroup, memberCount, userTier, addMemberMutation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#fff" weight="bold" />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" color="foreground" style={styles.headerTitle}>
          Group Info
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Avatar — always tappable to change */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={pickAndUploadImage}
            activeOpacity={0.75}
            disabled={uploadingImage}
          >
            {displayImage ? (
              <Image source={{ uri: displayImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Users size={44} color="#64748b" weight="fill" />
              </View>
            )}
            <View style={styles.cameraOverlay}>
              {uploadingImage
                ? <ActivityIndicator size="small" color="#fff" />
                : <Camera size={16} color="#fff" weight="fill" />}
            </View>
          </TouchableOpacity>
          <Text variant="caption" color="muted" style={styles.avatarHint}>
            Tap to change photo
          </Text>
          <Text variant="h3" weight="bold" color="foreground" style={styles.groupName}>
            {displayName}
          </Text>
          {memberCount > 0 && (
            <Text variant="caption" color="muted">
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Text>
          )}
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text variant="caption" color="muted" style={styles.sectionLabel}>MEMBERS</Text>

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
                  <View style={styles.memberNameRow}>
                    <Text variant="body" color="foreground" weight="semiBold">
                      {member.name || member.username}
                    </Text>
                    {(member.role === 'admin' || member.role === 'owner') && (
                      <Crown size={13} color="#FF7A00" weight="fill" style={styles.crownIcon} />
                    )}
                  </View>
                  {member.name && (
                    <Text variant="caption" color="muted">@{member.username}</Text>
                  )}
                </View>
                {Number(member.id) === Number(user?.id) && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>You</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text variant="caption" color="muted" style={styles.emptyHint}>
              No members found.
            </Text>
          )}
        </View>

        {/* Invite friends */}
        {eligibleFriends.length > 0 && (
          <View style={styles.section}>
            <Text variant="caption" color="muted" style={styles.sectionLabel}>ADD MEMBERS</Text>
            {friendsQuery.isLoading ? (
              <ActivityIndicator color="#FF7A00" style={{ marginVertical: 12 }} />
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
                    onPress={() => handleAddMember(friend.id)}
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

      <Modal
        visible={showPaywall}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaywall(false)}
      >
        <TouchableOpacity
          style={styles.paywallOverlay}
          activeOpacity={1}
          onPress={() => setShowPaywall(false)}
        >
          <View style={styles.paywallSheet}>
            <View style={styles.paywallHandle} />
            <Star size={32} color="#FF7A00" weight="fill" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text variant="h4" weight="bold" color="foreground" style={{ textAlign: 'center' }}>
              Upgrade Your Plan
            </Text>
            <Text variant="body" color="muted" style={{ textAlign: 'center', lineHeight: 20 }}>
              {paywallMessage}
            </Text>
            <TouchableOpacity
              style={styles.paywallUpgradeBtn}
              onPress={() => {
                setShowPaywall(false);
                navigation.navigate('AppTier');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.paywallUpgradeBtnText}>View Plans</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.paywallDismissBtn}
              onPress={() => setShowPaywall(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.paywallDismissBtnText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.backgroundSolid,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.overlayLight,
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
  headerRight: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 28,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: t.colors.brandOrange,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: t.colors.cardSolid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: t.colors.overlayMedium,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: t.colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0E0F14',
  },
  avatarHint: {
    opacity: 0.5,
    fontSize: 11,
  },
  groupName: {
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: 6,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  memberDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.colors.overlaySubtle,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  crownIcon: {
    marginTop: 1,
  },
  youBadge: {
    backgroundColor: t.colors.brandOrangeLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  youBadgeText: {
    color: t.colors.brandOrange,
    fontSize: 11,
    fontWeight: '600',
  },
  inviteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.colors.brandOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHint: {
    opacity: 0.5,
    paddingVertical: 8,
  },
  paywallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  paywallSheet: {
    backgroundColor: t.colors.cardSolid,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
    gap: 12,
  },
  paywallHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.overlayHeavy,
    alignSelf: 'center',
    marginBottom: 8,
  },
  paywallUpgradeBtn: {
    backgroundColor: t.colors.brandOrange,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  paywallUpgradeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  paywallDismissBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  paywallDismissBtnText: {
    fontSize: 13,
    color: t.colors.textMuted,
  },
});
