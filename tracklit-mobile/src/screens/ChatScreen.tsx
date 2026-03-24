import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import {
  ArrowLeft,
  MagnifyingGlass,
  X,
  ChatCircle,
  UsersThree,
  NotePencil,
  Lock,
  WarningCircle,
  ChatTeardropDots,
} from 'phosphor-react-native';

import { Text } from '../components/ui/Text';
import { Avatar } from '../components/ui/Avatar';
import { SkeletonChatList } from '@/components/Skeleton';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '../utils/theme';

interface Friend {
  id: number;
  username: string;
  name?: string | null;
  profileImageUrl?: string | null;
}

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface ChatGroup {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  memberCount?: number;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  lastMessageSenderName?: string;
}

interface ChatGroupApi {
  channel_type?: string;
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  avatar_url?: string | null;
  memberCount?: number | null;
  member_count?: number | null;
  member_ids?: number[] | null;
  members?: unknown[] | null;
  lastMessage?: string | null;
  last_message?: string | null;
  lastMessageAt?: string | null;
  last_message_at?: string | null;
  unreadCount?: number | null;
  unread_count?: number | null;
  lastMessageSenderName?: string | null;
  last_message_sender_name?: string | null;
  lastMessageSenderUsername?: string | null;
  last_message_sender_username?: string | null;
}

interface Conversation {
  id: number;
  otherUserId: number;
  otherUserName?: string;
  otherUserUsername?: string;
  otherUserProfileImage?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

type ListItem =
  | { kind: 'group'; data: ChatGroup }
  | { kind: 'dm'; data: Conversation };

const formatChatTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd/MM/yy');
};

const normalizeChatGroup = (group: ChatGroupApi): ChatGroup => {
  const memberIds = Array.isArray(group.member_ids) ? group.member_ids : [];
  const members = Array.isArray(group.members) ? group.members : [];
  const derivedMemberCount = memberIds.length > 0 ? memberIds.length : members.length;

  return {
    id: group.id,
    name: group.name,
    description: group.description ?? undefined,
    imageUrl: group.imageUrl ?? group.avatar_url ?? undefined,
    memberCount: group.memberCount ?? group.member_count ?? derivedMemberCount,
    lastMessage: group.lastMessage ?? group.last_message ?? undefined,
    lastMessageAt: group.lastMessageAt ?? group.last_message_at ?? undefined,
    unreadCount: group.unreadCount ?? group.unread_count ?? 0,
    lastMessageSenderName:
      group.lastMessageSenderName ??
      group.last_message_sender_name ??
      group.lastMessageSenderUsername ??
      group.last_message_sender_username ??
      undefined,
  };
};

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated, hasValidToken, logout } = useAuth();
  const isGuest = user?.id === 'guest';
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });
  const queryClient = useQueryClient();

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');

  const groupsQuery = useQuery({
    queryKey: ['chat-groups'],
    queryFn: async () => {
      const response = await apiRequest<ChatGroupApi[]>('/api/chat/groups');
      return response
        .filter((item) => item.channel_type !== 'direct')
        .map(normalizeChatGroup);
    },
    enabled: isAuthenticated && !isGuest && hasValidToken,
  });

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiRequest<Conversation[]>('/api/conversations'),
    enabled: isAuthenticated && !isGuest && hasValidToken,
  });

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => apiRequest<Friend[]>('/api/friends'),
    enabled: isAuthenticated && !isGuest && hasValidToken && showFriendsModal,
  });

  const groups = groupsQuery.data ?? [];
  const conversations = conversationsQuery.data ?? [];
  const friends = friendsQuery.data ?? [];

  const filteredFriends = friends.filter((f) =>
    (f.name?.toLowerCase() || f.username.toLowerCase()).includes(friendSearch.toLowerCase())
  );

  const allItems: ListItem[] = [
    ...groups.map((g): ListItem => ({ kind: 'group', data: g })),
    ...conversations.map((c): ListItem => ({ kind: 'dm', data: c })),
  ].sort((a, b) => {
    const aTime = a.kind === 'group' ? a.data.lastMessageAt : a.data.lastMessageAt;
    const bTime = b.kind === 'group' ? b.data.lastMessageAt : b.data.lastMessageAt;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  const startConversationMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest<{ conversationId: number }>('/api/conversations', {
        method: 'POST',
        data: { otherUserId: userId },
      });
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setShowFriendsModal(false);
      setShowNewChatModal(false);
      navigation.navigate('ChatConversation', {
        conversationId: data.conversationId || userId,
        type: 'direct',
      });
    },
  });

  const handleStartDM = useCallback((friend: Friend) => {
    const existingConvo = conversations.find(
      (c) => c.otherUserId === friend.id
    );
    if (existingConvo) {
      setShowFriendsModal(false);
      setShowNewChatModal(false);
      navigation.navigate('ChatConversation', {
        conversationId: existingConvo.id,
        type: 'direct',
      });
    } else {
      startConversationMutation.mutate(friend.id);
    }
  }, [conversations, navigation, startConversationMutation]);

  const handleRefresh = () => {
    groupsQuery.refetch();
    conversationsQuery.refetch();
  };

  const handleGroupPress = (group: ChatGroup) => {
    navigation.navigate('ChatConversation', {
      conversationId: group.id,
      type: 'group'
    });
  };

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('ChatConversation', {
      conversationId: conversation.id,
      type: 'direct'
    });
  };

  const isLoading = groupsQuery.isLoading || conversationsQuery.isLoading;
  const isRefreshing = groupsQuery.isFetching || conversationsQuery.isFetching;
  const hasError = groupsQuery.isError || conversationsQuery.isError;
  const hasForcedLogout = useRef(false);
  const combinedError = (groupsQuery.error || conversationsQuery.error) as
    | (Error & { status?: number })
    | null;

  useEffect(() => {
    if (combinedError?.status === 401 && !hasForcedLogout.current) {
      hasForcedLogout.current = true;
      logout();
    }
  }, [combinedError?.status, logout]);

  const renderChatRow = (item: ListItem) => {
    const isGroup = item.kind === 'group';
    const key = `${item.kind}-${item.data.id}`;
    const name = isGroup
      ? (item.data as ChatGroup).name
      : (item.data as Conversation).otherUserName || (item.data as Conversation).otherUserUsername || 'Unknown';
    const lastMsg = item.data.lastMessage;
    const time = formatChatTime(item.data.lastMessageAt);
    const unread = item.data.unreadCount ?? 0;
    const avatarSrc = isGroup
      ? (item.data as ChatGroup).imageUrl
      : (item.data as Conversation).otherUserProfileImage;
    const fallbackLetter = (name?.[0] || '?').toUpperCase();

    return (
      <TouchableOpacity
        key={key}
        style={styles.chatRow}
        activeOpacity={0.6}
        onPress={() =>
          isGroup
            ? handleGroupPress(item.data as ChatGroup)
            : handleConversationPress(item.data as Conversation)
        }
      >
        <View style={styles.avatarWrap}>
          <Avatar size="lg" src={avatarSrc || undefined} fallback={fallbackLetter} />
          {isGroup && (
            <View style={styles.groupBadgeIcon}>
              <UsersThree size={10} color="#fff" weight="fill" />
            </View>
          )}
        </View>

        <View style={styles.chatRowBody}>
          <View style={styles.chatRowTop}>
            <Text
              variant="body"
              weight={unread > 0 ? 'bold' : 'semiBold'}
              color="foreground"
              numberOfLines={1}
              style={styles.chatRowName}
            >
              {name}
            </Text>
            <Text
              variant="small"
              color={unread > 0 ? 'accent' : 'muted'}
              style={unread > 0 ? styles.timeBold : undefined}
            >
              {time}
            </Text>
          </View>
          {isGroup && (item.data as ChatGroup).lastMessageSenderName && (
            <Text
              variant="caption"
              color="muted"
              numberOfLines={1}
              style={styles.chatRowSender}
            >
              {(item.data as ChatGroup).lastMessageSenderName}
            </Text>
          )}
          <View style={styles.chatRowBottom}>
            <Text
              variant="caption"
              color={unread > 0 ? 'foreground' : 'muted'}
              numberOfLines={1}
              style={[styles.chatRowPreview, unread > 0 && styles.chatRowPreviewBold]}
            >
              {lastMsg || (isGroup ? `${(item.data as ChatGroup).memberCount ?? 0} members` : 'No messages yet')}
            </Text>
            {unread > 0 && (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>
                  {unread > 999 ? '999+' : unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#fff" weight="bold" />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" color="foreground" style={styles.headerTitle}>
          Chats
        </Text>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => setShowNewChatModal(true)}
        >
          <NotePencil size={22} color="#94a3b8" weight="fill" />
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {isGuest || !hasValidToken ? (
          <View style={styles.emptyState}>
            <Lock size={48} color={theme.colors.textMuted} weight="fill" />
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
              Sign In Required
            </Text>
            <Text variant="body" color="muted" style={styles.emptyText}>
              Sign in to view your messages and group chats.
            </Text>
          </View>
        ) : isLoading ? (
          <View style={styles.emptyState}>
            <SkeletonChatList count={6} />
          </View>
        ) : hasError ? (
          <View style={styles.emptyState}>
            <WarningCircle size={48} color={theme.colors.textMuted} weight="fill" />
            <Text variant="body" color="muted" style={styles.emptyText}>
              {combinedError?.status === 401
                ? 'Session expired. Please sign in again.'
                : `Unable to load messages. Pull to refresh.`}
            </Text>
          </View>
        ) : allItems.length === 0 ? (
          <View style={styles.emptyState}>
            <ChatTeardropDots size={48} color={theme.colors.textMuted} weight="fill" />
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
              No Messages Yet
            </Text>
            <Text variant="body" color="muted" style={styles.emptyText}>
              Join a group or start a conversation with other athletes!
            </Text>
          </View>
        ) : (
          allItems.map(renderChatRow)
        )}
      </ScrollView>

      <Modal
        visible={showNewChatModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNewChatModal(false)}
        >
          <View style={styles.modalContent}>
            <Text variant="h4" weight="bold" color="foreground" style={styles.modalTitle}>
              Start a Conversation
            </Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowNewChatModal(false);
                setShowFriendsModal(true);
              }}
            >
              <View style={styles.modalOptionIcon}>
                <ChatCircle size={24} color="#FF9800" weight="fill" />
              </View>
              <View style={styles.modalOptionText}>
                <Text variant="body" weight="semiBold" color="foreground">New Message</Text>
                <Text variant="small" color="muted">Start a direct message with a friend</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowNewChatModal(false);
                navigation.navigate('CreateGroup');
              }}
            >
              <View style={styles.modalOptionIcon}>
                <UsersThree size={24} color="#FF9800" weight="fill" />
              </View>
              <View style={styles.modalOptionText}>
                <Text variant="body" weight="semiBold" color="foreground">New Group</Text>
                <Text variant="small" color="muted">Create a group chat with multiple people</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowNewChatModal(false)}
            >
              <Text variant="body" weight="semiBold" color="muted">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showFriendsModal}
        animationType="slide"
        onRequestClose={() => setShowFriendsModal(false)}
      >
        <View style={[styles.friendsModal, { paddingTop: insets.top }]}>
          <View style={styles.friendsModalHeader}>
            <TouchableOpacity onPress={() => setShowFriendsModal(false)}>
              <X size={24} color="#fff" weight="bold" />
            </TouchableOpacity>
            <Text variant="h4" weight="bold" color="foreground">Select Friend</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <MagnifyingGlass size={18} color={theme.colors.textMuted} weight="bold" />
            <TextInput
              style={styles.friendSearchInput}
              placeholder="Search friends..."
              placeholderTextColor={theme.colors.textMuted}
              value={friendSearch}
              onChangeText={setFriendSearch}
            />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            style={styles.friendsList}
            contentContainerStyle={{ paddingBottom: insets.bottom + theme.spacing.lg }}
          >
            {friendsQuery.isLoading ? (
              <View style={styles.center}>
                <SkeletonChatList count={6} />
              </View>
            ) : filteredFriends.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="body" color="muted">
                  {friends.length === 0 ? 'No friends yet. Connect with athletes first!' : 'No friends match your search.'}
                </Text>
              </View>
            ) : (
              filteredFriends.map((friend) => (
                <TouchableOpacity
                  key={friend.id}
                  style={styles.friendItem}
                  activeOpacity={0.6}
                  onPress={() => handleStartDM(friend)}
                  disabled={startConversationMutation.isPending}
                >
                  <Avatar
                    size="md"
                    src={friend.profileImageUrl || undefined}
                    fallback={(friend.name || friend.username || 'U').slice(0, 2)}
                  />
                  <View style={styles.friendInfo}>
                    <Text variant="body" weight="semiBold" color="foreground">
                      {friend.name || friend.username}
                    </Text>
                    <Text variant="small" color="muted">@{friend.username}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1623',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginLeft: 12,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 4,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  groupBadgeIcon: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#5b21b6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f1623',
  },
  chatRowBody: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 10,
  },
  chatRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatRowName: {
    flex: 1,
    marginRight: 8,
  },
  timeBold: {
    fontWeight: '600',
  },
  chatRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatRowSender: {
    marginBottom: 1,
    opacity: 0.7,
  },
  chatRowPreview: {
    flex: 1,
    marginRight: 8,
  },
  chatRowPreviewBold: {
    fontWeight: '500',
  },
  unreadPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 6,
  },
  emptyText: {
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,152,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionText: {
    flex: 1,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  friendsModal: {
    flex: 1,
    backgroundColor: '#0f1623',
  },
  friendsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  friendSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  friendsList: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 14,
  },
  friendInfo: {
    flex: 1,
  },
});
