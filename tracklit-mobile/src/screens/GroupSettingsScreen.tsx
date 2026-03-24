import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  UserPlus,
  Users,
  Crown,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { Alert } from 'react-native';
import type { RootStackParamList } from '@/navigation/types';

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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { groupId, groupName: initialName, groupImageUrl: initialImage } = route.params;
  const { user } = useAuth();

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
  const displayImage = groupData?.imageUrl ?? groupData?.avatar_url ?? initialImage;
  const memberCount = groupData?.memberCount ?? groupData?.member_count ?? currentMembers.length;

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
        {/* Group Avatar */}
        <View style={styles.avatarSection}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Users size={44} color="#64748b" weight="fill" />
            </View>
          )}
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
    gap: 10,
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
  groupName: {
    marginTop: 4,
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
    borderTopColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: 'rgba(255,122,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  youBadgeText: {
    color: '#FF7A00',
    fontSize: 11,
    fontWeight: '600',
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
