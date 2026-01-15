import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight } from 'lucide-react-native';
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
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });

  // Fetch chat groups
  const groupsQuery = useQuery({
    queryKey: ['chat-groups'],
    queryFn: () => apiRequest<ChatGroup[]>('/api/chat/groups'),
    enabled: isAuthenticated && !isGuest,
  });

  // Fetch direct conversations
  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiRequest<Conversation[]>('/api/conversations'),
    enabled: isAuthenticated && !isGuest,
  });

  const groups = groupsQuery.data ?? [];
  const conversations = conversationsQuery.data ?? [];

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
        {isGuest ? (
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
              Unable to load messages. Pull to refresh.
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
          onPress={() => navigation.navigate('CreateGroup')}
          accessibilityRole="button"
          accessibilityLabel="Create group"
        >
          <FontAwesome5 name="plus" size={18} color={theme.colors.primaryForeground} solid />
        </TouchableOpacity>
      )}
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
});

