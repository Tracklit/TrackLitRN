import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import { Text } from '../components/ui/Text';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardContent } from '../components/ui/Card';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import theme from '../utils/theme';

type ChatConversationRouteProp = RouteProp<RootStackParamList, 'ChatConversation'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface Message {
  id: number;
  text?: string;
  senderId: number;
  senderName?: string;
  senderProfileImage?: string;
  createdAt: string;
  messageType?: string;
  isDeleted?: boolean;
}

interface GroupInfo {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  memberCount?: number;
}

interface ConversationInfo {
  id: number;
  otherUserId: number;
  otherUserName?: string;
  otherUserProfileImage?: string;
}

export const ChatConversationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ChatConversationRouteProp>();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { conversationId, type } = route.params || { conversationId: 0, type: 'direct' as const };
  const [messageText, setMessageText] = useState('');

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Fetch messages
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', type, conversationId],
    queryFn: () => {
      const endpoint = type === 'group'
        ? `/api/chat/groups/${conversationId}/messages`
        : `/api/chat/direct/${conversationId}/messages`;
      return apiRequest<Message[]>(endpoint);
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Fetch group/conversation info
  const infoQuery = useQuery({
    queryKey: ['chat-info', type, conversationId],
    queryFn: () => {
      if (type === 'group') {
        return apiRequest<GroupInfo>(`/api/chat/groups/${conversationId}`);
      }
      // For direct messages, we get info from the messages list
      return null;
    },
    enabled: type === 'group' && !!conversationId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const endpoint = type === 'group'
        ? `/api/chat/groups/${conversationId}/messages`
        : `/api/chat/direct/${conversationId}/messages`;
      return apiRequest(endpoint, {
        method: 'POST',
        data: { text },
      });
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', type, conversationId] });
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  const messages = messagesQuery.data ?? [];
  const groupInfo = type === 'group' ? infoQuery.data : null;

  const handleSend = () => {
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const getHeaderTitle = () => {
    if (type === 'group' && groupInfo) {
      return groupInfo.name;
    }
    // For direct messages, try to get from first message
    const otherUserMessage = messages.find(m => m.senderId !== user?.id);
    if (otherUserMessage?.senderName) {
      return otherUserMessage.senderName;
    }
    return 'Chat';
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={20} color={theme.colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text variant="body" weight="bold" color="foreground" numberOfLines={1}>
              {getHeaderTitle()}
            </Text>
            {type === 'group' && groupInfo?.memberCount && (
              <Text variant="small" color="muted">
                {groupInfo.memberCount} members
              </Text>
            )}
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messagesQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="body" color="muted" style={styles.loadingText}>
                Loading messages...
              </Text>
            </View>
          ) : messagesQuery.isError ? (
            <View style={styles.loadingContainer}>
              <FontAwesome5 name="exclamation-circle" size={32} color={theme.colors.textMuted} />
              <Text variant="body" color="muted" style={styles.loadingText}>
                Unable to load messages
              </Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <FontAwesome5 name="comments" size={32} color={theme.colors.textMuted} />
              <Text variant="body" color="muted" style={styles.loadingText}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === user?.id;
              const isDeleted = message.isDeleted;
              
              return (
                <View 
                  key={message.id} 
                  style={[
                    styles.messageRow,
                    isOwnMessage ? styles.messageRowRight : styles.messageRowLeft
                  ]}
                >
                  {!isOwnMessage && type === 'group' && (
                    <Avatar 
                      size="sm" 
                      src={message.senderProfileImage} 
                      fallback={message.senderName?.[0] || '?'} 
                      style={styles.messageAvatar}
                    />
                  )}
                  
                  <View 
                    style={[
                      styles.messageBubble,
                      isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
                      isDeleted && styles.deletedMessage
                    ]}
                  >
                    {!isOwnMessage && type === 'group' && message.senderName && (
                      <Text variant="small" color="primary" weight="semiBold" style={styles.senderName}>
                        {message.senderName}
                      </Text>
                    )}
                    
                    <Text 
                      variant="body" 
                      color={isOwnMessage ? 'primary-foreground' : 'foreground'}
                      style={isDeleted ? styles.deletedText : undefined}
                    >
                      {isDeleted ? 'This message was deleted' : message.text}
                    </Text>
                    
                    <Text 
                      variant="small" 
                      color={isOwnMessage ? 'primary-foreground' : 'muted'} 
                      style={styles.messageTime}
                    >
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom || theme.spacing.md }]}>
          <Card style={styles.inputCard}>
            <CardContent style={styles.inputContent}>
              <TextInput
                style={styles.textInput}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type a message..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  messageText.trim() && !sendMessageMutation.isPending 
                    ? styles.sendButtonActive 
                    : styles.sendButtonInactive
                ]}
                onPress={handleSend}
                disabled={!messageText.trim() || sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.colors.textMuted} />
                ) : (
                  <FontAwesome5 
                    name="paper-plane" 
                    size={16} 
                    color={messageText.trim() ? 'white' : theme.colors.textMuted}
                    solid
                  />
                )}
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    marginRight: theme.spacing.sm,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  ownMessageBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.borderRadius.sm,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: theme.borderRadius.sm,
  },
  deletedMessage: {
    opacity: 0.6,
  },
  deletedText: {
    fontStyle: 'italic',
  },
  senderName: {
    marginBottom: theme.spacing.xs,
  },
  messageTime: {
    marginTop: theme.spacing.xs,
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  inputCard: {
    marginBottom: 0,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
    maxHeight: 100,
    paddingVertical: theme.spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  sendButtonInactive: {
    backgroundColor: theme.colors.muted,
  },
});

