import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, Search, X, MessageCircle, Users as UsersIcon } from 'lucide-react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '../components/ui/Text';
import { Card, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '../utils/theme';
import { WebScreen } from '@/components/web/Screen';

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

  // Fetch chat groups
  const groupsQuery = useQuery({
    queryKey: ['chat-groups'],
    queryFn: () => apiRequest<ChatGroup[]>('/api/chat/groups'),
    enabled: isAuthenticated && !isGuest && hasValidToken,
  });

  // Fetch direct conversations
  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiRequest<Conversation[]>('/api/conversations'),
    enabled: isAuthenticated && !isGuest && hasValidToken,
  });

  // Fetch friends for new DM
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

  // Start a new DM conversation
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
      // Navigate to the conversation
      navigation.navigate('ChatConversation', {
        conversationId: data.conversationId || userId,
        type: 'direct',
      });
    },
  });

  const handleStartDM = useCallback((friend: Friend) => {
    // Check if conversation already exists
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

  return (
    <WebScreen
      backgroundColor={theme.colors.webChatBackground}
      scrollable={false}
      contentStyle={{ paddingTop: theme.spacing.lg }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight size={20} color={theme.colors.foreground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" color="foreground">
          Messages
        </Text>
        <View style={styles.headerSpacer} />
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
            <FontAwesome5 name="user-lock" size={48} color={theme.colors.textMuted} solid />
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
              Sign In Required
            </Text>
            <Text variant="body" color="muted" style={styles.emptyText}>
              Sign in to view your messages and group chats.
            </Text>
          </View>
        ) : isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="body" color="muted" style={styles.emptyText}>
              Loading messages...
            </Text>
          </View>
        ) : hasError ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="exclamation-circle" size={48} color={theme.colors.textMuted} solid />
            <Text variant="body" color="muted" style={styles.emptyText}>
              {combinedError?.status === 401
                ? 'Session expired. Please sign in again.'
                : `Unable to load messages.${combinedError?.message ? ` ${combinedError.message}` : ''} Pull to refresh.`}
            </Text>
          </View>
        ) : groups.length === 0 && conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="comments" size={48} color={theme.colors.textMuted} solid />
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
              No Messages Yet
            </Text>
            <Text variant="body" color="muted" style={styles.emptyText}>
              Join a group or start a conversation with other athletes!
            </Text>
          </View>
        ) : (
          <>
            {/* Group Chats Section */}
            {groups.length > 0 && (
              <View style={styles.section}>
                <Text variant="h4" weight="semiBold" color="foreground" style={styles.sectionTitle}>
                  Group Chats
                </Text>
                {groups.map((group) => (
                  <TouchableOpacity 
                    key={group.id} 
                    onPress={() => handleGroupPress(group)}
                  >
                      <Card style={styles.chatCard}>
                      <CardContent style={styles.chatContent}>
                        <View style={styles.avatarContainer}>
                          {group.imageUrl ? (
                            <Avatar size="md" src={group.imageUrl} fallback={group.name[0]} />
                          ) : (
                            <View style={styles.groupAvatar}>
                              <FontAwesome5 name="users" size={20} color={theme.colors.primary} solid />
                            </View>
                          )}
                          {group.unreadCount && group.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                              <Text variant="small" color="primary-foreground" weight="bold">
                                {group.unreadCount > 99 ? '99+' : group.unreadCount}
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.chatInfo}>
                          <View style={styles.chatHeader}>
                            <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                              {group.name}
                            </Text>
                            {group.lastMessageAt && (
                              <Text variant="small" color="muted">
                                {formatDistanceToNow(new Date(group.lastMessageAt), { addSuffix: false })}
                              </Text>
                            )}
                          </View>
                          
                          {group.lastMessage && (
                            <Text variant="small" color="muted" numberOfLines={1} style={styles.lastMessage}>
                              {group.lastMessage}
                            </Text>
                          )}
                          
                          {group.memberCount && (
                            <Text variant="small" color="muted">
                              {group.memberCount} members
                            </Text>
                          )}
                        </View>
                        
                        <FontAwesome5 name="chevron-right" size={14} color={theme.colors.textMuted} />
                      </CardContent>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Direct Messages Section */}
            {conversations.length > 0 && (
              <View style={styles.section}>
                <Text variant="h4" weight="semiBold" color="foreground" style={styles.sectionTitle}>
                  Direct Messages
                </Text>
                {conversations.map((conversation) => (
                  <TouchableOpacity 
                    key={conversation.id} 
                    onPress={() => handleConversationPress(conversation)}
                  >
                      <Card style={styles.chatCard}>
                      <CardContent style={styles.chatContent}>
                        <View style={styles.avatarContainer}>
                          <Avatar 
                            size="md" 
                            src={conversation.otherUserProfileImage} 
                            fallback={conversation.otherUserName?.[0] || 'U'} 
                          />
                          {conversation.unreadCount && conversation.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                              <Text variant="small" color="primary-foreground" weight="bold">
                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.chatInfo}>
                          <View style={styles.chatHeader}>
                            <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                              {conversation.otherUserName || conversation.otherUserUsername || 'Unknown'}
                            </Text>
                            {conversation.lastMessageAt && (
                              <Text variant="small" color="muted">
                                {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })}
                              </Text>
                            )}
                          </View>
                          
                          {conversation.lastMessage && (
                            <Text variant="small" color="muted" numberOfLines={1} style={styles.lastMessage}>
                              {conversation.lastMessage}
                            </Text>
                          )}
                        </View>
                        
                        <FontAwesome5 name="chevron-right" size={14} color={theme.colors.textMuted} />
                      </CardContent>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!isGuest && (
        <TouchableOpacity
          style={[styles.fab, { bottom: theme.layout.bottomNavHeight + insets.bottom + theme.spacing.lg }]}
          onPress={() => setShowNewChatModal(true)}
          accessibilityRole="button"
          accessibilityLabel="New chat"
        >
          <FontAwesome5 name="plus" size={18} color={theme.colors.primaryForeground} solid />
        </TouchableOpacity>
      )}

      {/* New Chat Options Modal */}
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
                <MessageCircle size={24} color={theme.colors.primary} />
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
                <UsersIcon size={24} color={theme.colors.primary} />
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

      {/* Friends Selection Modal */}
      <Modal
        visible={showFriendsModal}
        animationType="slide"
        onRequestClose={() => setShowFriendsModal(false)}
      >
        <View style={[styles.friendsModal, { paddingTop: insets.top }]}>
          <View style={styles.friendsModalHeader}>
            <TouchableOpacity onPress={() => setShowFriendsModal(false)}>
              <X size={24} color={theme.colors.foreground} />
            </TouchableOpacity>
            <Text variant="h4" weight="bold" color="foreground">Select Friend</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <Search size={18} color={theme.colors.textMuted} />
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
        keyboardDismissMode="on-drag" style={styles.friendsList} contentContainerStyle={{ paddingBottom: insets.bottom + theme.spacing.lg }}>
            {friendsQuery.isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
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
                  <FontAwesome5 name="chevron-right" size={14} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.webBorderLight,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerSpacer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  chatCard: {
    marginBottom: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: theme.colors.webBorderLight,
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.webPurpleStart,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: theme.colors.webChatBackground,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  chatInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  lastMessage: {
    marginBottom: theme.spacing.xs,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  modalOptionText: {
    flex: 1,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  friendsModal: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  friendsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  friendSearchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: theme.colors.foreground,
    fontSize: 16,
  },
  friendsList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  friendInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
});

