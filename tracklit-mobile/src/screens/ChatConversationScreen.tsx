import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Pressable,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import { X, Edit2, Trash2, Reply, MoreVertical } from 'lucide-react-native';

import { Text } from '../components/ui/Text';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardContent } from '../components/ui/Card';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { getToken } from '@/lib/tokenStorage';
import { env } from '@/config/env';
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
  messageType?: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  isDeleted?: boolean;
  editedAt?: string;
  replyToId?: number;
  replyToMessage?: {
    id: number;
    text?: string;
    senderName?: string;
    messageType?: string;
  };
}

interface GroupInfo {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  memberCount?: number;
}

export const ChatConversationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ChatConversationRouteProp>();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { conversationId, type } = route.params || { conversationId: 0, type: 'direct' as const };
  const [messageText, setMessageText] = useState('');
  const [pendingMedia, setPendingMedia] = useState<Asset | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [showFullImage, setShowFullImage] = useState<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Mark messages as read when opening a thread
  useEffect(() => {
    if (!conversationId) return;
    const endpoint =
      type === 'group'
        ? `/api/chat/groups/${conversationId}/mark-read`
        : `/api/chat/direct/${conversationId}/mark-read`;

    // Mark-read is best-effort: some public groups may be viewable but not joinable.
    apiRequest(endpoint, { method: 'POST', rawResponse: true })
      .then((res: any) => {
        // Silence 403s ("not a member") to avoid noisy logs.
        if (res?.status && res.status === 403) return;
      })
      .catch(() => {
        // Non-fatal
      });
  }, [conversationId, type]);

  const safeFormatDistance = (value: unknown) => {
    const d = value instanceof Date ? value : new Date(value as any);
    if (!d || Number.isNaN(d.getTime())) return '';
    return formatDistanceToNow(d, { addSuffix: true });
  };

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

  const sendMediaMutation = useMutation({
    mutationFn: async (payload: { asset: Asset; text?: string }) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Missing auth token');
      }

      if (!payload.asset.uri) {
        throw new Error('Missing media uri');
      }

      const isGroup = type === 'group';
      const uploadField = isGroup ? 'media' : 'image';
      const endpoint = isGroup
        ? `/api/chat/groups/${conversationId}/messages`
        : `/api/chat/direct/${conversationId}/messages`;

      const formData = new FormData();
      if (payload.text?.trim()) {
        formData.append('text', payload.text.trim());
      }

      const fileName = payload.asset.fileName || 'upload.jpg';
      const fileType = payload.asset.type || 'image/jpeg';
      formData.append(uploadField, {
        uri: payload.asset.uri,
        name: fileName,
        type: fileType,
      } as any);

      const response = await fetch(`${env.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to send media');
      }

      return response.json();
    },
    onSuccess: () => {
      setPendingMedia(null);
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', type, conversationId] });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (error: Error) => {
      Alert.alert('Unable to send media', error.message || 'Please try again.');
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, text }: { messageId: number; text: string }) => {
      const endpoint = type === 'group'
        ? `/api/chat/groups/${conversationId}/messages/${messageId}`
        : `/api/chat/direct/${conversationId}/messages/${messageId}`;
      return apiRequest(endpoint, {
        method: 'PATCH',
        data: { text },
      });
    },
    onSuccess: () => {
      setEditingMessage(null);
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', type, conversationId] });
    },
    onError: (error: Error) => {
      Alert.alert('Unable to edit message', error.message || 'Please try again.');
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const endpoint = type === 'group'
        ? `/api/chat/groups/${conversationId}/messages/${messageId}`
        : `/api/chat/direct/${conversationId}/messages/${messageId}`;
      return apiRequest(endpoint, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', type, conversationId] });
    },
    onError: (error: Error) => {
      Alert.alert('Unable to delete message', error.message || 'Please try again.');
    },
  });

  const handleMessageLongPress = useCallback((message: Message) => {
    setSelectedMessage(message);
    setShowMessageOptions(true);
  }, []);

  const handleEditMessage = useCallback(() => {
    if (!selectedMessage) return;
    setEditingMessage(selectedMessage);
    setMessageText(selectedMessage.text || '');
    setShowMessageOptions(false);
  }, [selectedMessage]);

  const handleDeleteMessage = useCallback(() => {
    if (!selectedMessage) return;
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMessageMutation.mutate(selectedMessage.id);
            setShowMessageOptions(false);
          },
        },
      ]
    );
  }, [selectedMessage, deleteMessageMutation]);

  const handleReplyToMessage = useCallback(() => {
    if (!selectedMessage) return;
    setReplyToMessage(selectedMessage);
    setShowMessageOptions(false);
  }, [selectedMessage]);

  const cancelEditOrReply = useCallback(() => {
    setEditingMessage(null);
    setReplyToMessage(null);
    setMessageText('');
  }, []);

  const handleAttach = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Unable to pick image', result.errorMessage || 'Please try again.');
      return;
    }

    const asset = result.assets?.[0] ?? null;
    if (!asset?.uri) {
      Alert.alert('Unable to pick image', 'No image was selected.');
      return;
    }

    setPendingMedia(asset);
  };

  const messages = messagesQuery.data ?? [];
  const groupInfo = type === 'group' ? infoQuery.data : null;

  const handleSend = () => {
    // Handle editing
    if (editingMessage) {
      if (!messageText.trim() || editMessageMutation.isPending) return;
      editMessageMutation.mutate({ messageId: editingMessage.id, text: messageText.trim() });
      return;
    }

    // Handle media attachment
    if (pendingMedia) {
      if (sendMediaMutation.isPending) return;
      sendMediaMutation.mutate({ asset: pendingMedia, text: messageText });
      return;
    }

    if (!messageText.trim() || sendMessageMutation.isPending) return;

    // Handle reply
    if (replyToMessage) {
      const endpoint = type === 'group'
        ? `/api/chat/groups/${conversationId}/messages`
        : `/api/chat/direct/${conversationId}/messages`;
      apiRequest(endpoint, {
        method: 'POST',
        data: { text: messageText.trim(), replyToId: replyToMessage.id },
      }).then(() => {
        setMessageText('');
        setReplyToMessage(null);
        queryClient.invalidateQueries({ queryKey: ['chat-messages', type, conversationId] });
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }).catch((error: Error) => {
        Alert.alert('Unable to send reply', error.message || 'Please try again.');
      });
      return;
    }

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
      colors={[theme.colors.webChatBackground, theme.colors.webChatBackground]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={20} color="white" />
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
              const hasImage = message.messageType === 'image' && message.mediaUrl;

              return (
                <Pressable
                  key={message.id}
                  onLongPress={() => !isDeleted && handleMessageLongPress(message)}
                  delayLongPress={500}
                >
                  <View
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

                      {/* Reply context */}
                      {message.replyToMessage && (
                        <View style={styles.replyContext}>
                          <View style={styles.replyBar} />
                          <View style={styles.replyContent}>
                            <Text variant="small" color="primary" weight="semiBold" numberOfLines={1}>
                              {message.replyToMessage.senderName || 'Unknown'}
                            </Text>
                            <Text variant="small" color="muted" numberOfLines={1}>
                              {message.replyToMessage.messageType === 'image' ? '📷 Photo' : message.replyToMessage.text}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Image content */}
                      {hasImage && (
                        <TouchableOpacity onPress={() => setShowFullImage(message.mediaUrl || null)}>
                          <Image
                            source={{ uri: message.mediaUrl }}
                            style={styles.messageImage}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}

                      {(message.text || isDeleted) && (
                        <Text
                          variant="body"
                          color={isOwnMessage ? 'primary-foreground' : 'foreground'}
                          style={isDeleted ? styles.deletedText : undefined}
                        >
                          {isDeleted ? 'This message was deleted' : message.text}
                        </Text>
                      )}

                      <View style={styles.messageFooter}>
                        <Text
                          variant="small"
                          color={isOwnMessage ? 'primary-foreground' : 'muted'}
                          style={styles.messageTime}
                        >
                          {safeFormatDistance(message.createdAt)}
                        </Text>
                        {message.editedAt && !isDeleted && (
                          <Text variant="small" color="muted" style={styles.editedLabel}>
                            (edited)
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom || theme.spacing.md }]}>
          {/* Edit/Reply indicator */}
          {(editingMessage || replyToMessage) && (
            <View style={styles.editReplyIndicator}>
              <View style={styles.editReplyContent}>
                {editingMessage ? (
                  <>
                    <Edit2 size={14} color={theme.colors.primary} />
                    <Text variant="small" color="primary" weight="semiBold">Editing message</Text>
                  </>
                ) : replyToMessage ? (
                  <>
                    <Reply size={14} color={theme.colors.primary} />
                    <View style={styles.replyPreview}>
                      <Text variant="small" color="primary" weight="semiBold" numberOfLines={1}>
                        Replying to {replyToMessage.senderName || 'Unknown'}
                      </Text>
                      <Text variant="small" color="muted" numberOfLines={1}>
                        {replyToMessage.messageType === 'image' ? '📷 Photo' : replyToMessage.text}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
              <TouchableOpacity onPress={cancelEditOrReply} style={styles.cancelEditReply}>
                <X size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {pendingMedia && (
            <View style={styles.attachmentRow}>
              <Text variant="small" color="muted">
                1 image attached
              </Text>
              <TouchableOpacity onPress={() => setPendingMedia(null)} style={styles.attachmentRemove}>
                <FontAwesome5 name="times" size={14} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
          <Card style={styles.inputCard}>
            <CardContent style={styles.inputContent}>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={handleAttach}
                disabled={sendMediaMutation.isPending || sendMessageMutation.isPending || !!editingMessage}
              >
                <FontAwesome5 name="paperclip" size={16} color={editingMessage ? theme.colors.muted : theme.colors.textMuted} solid />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                value={messageText}
                onChangeText={setMessageText}
                placeholder={
                  editingMessage
                    ? 'Edit your message...'
                    : replyToMessage
                    ? `Reply to ${replyToMessage.senderName || 'message'}...`
                    : pendingMedia
                    ? 'Add a caption (optional)…'
                    : 'Type a message...'
                }
                placeholderTextColor={theme.colors.textMuted}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (pendingMedia || messageText.trim()) && !sendMessageMutation.isPending && !sendMediaMutation.isPending && !editMessageMutation.isPending
                    ? styles.sendButtonActive
                    : styles.sendButtonInactive
                ]}
                onPress={handleSend}
                disabled={(!pendingMedia && !messageText.trim()) || sendMessageMutation.isPending || sendMediaMutation.isPending || editMessageMutation.isPending}
              >
                {sendMessageMutation.isPending || sendMediaMutation.isPending || editMessageMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.colors.textMuted} />
                ) : (
                  <FontAwesome5
                    name={editingMessage ? 'check' : 'paper-plane'}
                    size={16}
                    color={pendingMedia || messageText.trim() ? 'white' : theme.colors.textMuted}
                    solid
                  />
                )}
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>
      </KeyboardAvoidingView>

      {/* Message Options Modal */}
      <Modal
        visible={showMessageOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMessageOptions(false)}
        >
          <View style={styles.optionsModal}>
            <TouchableOpacity style={styles.optionItem} onPress={handleReplyToMessage}>
              <Reply size={20} color={theme.colors.foreground} />
              <Text variant="body" color="foreground">Reply</Text>
            </TouchableOpacity>
            {selectedMessage?.senderId === user?.id && (
              <>
                <TouchableOpacity style={styles.optionItem} onPress={handleEditMessage}>
                  <Edit2 size={20} color={theme.colors.foreground} />
                  <Text variant="body" color="foreground">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={handleDeleteMessage}>
                  <Trash2 size={20} color="#ef4444" />
                  <Text variant="body" style={{ color: '#ef4444' }}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={[styles.optionItem, styles.cancelOption]} onPress={() => setShowMessageOptions(false)}>
              <Text variant="body" color="muted">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!showFullImage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullImage(null)}
      >
        <View style={styles.fullImageModal}>
          <TouchableOpacity style={styles.closeImageButton} onPress={() => setShowFullImage(null)}>
            <X size={28} color="white" />
          </TouchableOpacity>
          {showFullImage && (
            <Image
              source={{ uri: showFullImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    backgroundColor: 'white',
    borderBottomRightRadius: theme.borderRadius.sm,
  },
  otherMessageBubble: {
    backgroundColor: '#374151',
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
    color: '#93c5fd',
  },
  messageTime: {
    marginTop: theme.spacing.xs,
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopWidth: 1,
    borderTopColor: theme.colors.webBorderLight,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.colors.webBorderLight,
  },
  attachmentRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.muted,
  },
  inputCard: {
    marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: theme.colors.webBorderLight,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.colors.webBorderLight,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.sizes.base,
    color: 'white',
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
    backgroundColor: theme.colors.webPurpleStart,
    ...theme.shadows.sm,
  },
  sendButtonInactive: {
    backgroundColor: theme.colors.muted,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  editedLabel: {
    fontStyle: 'italic',
  },
  replyContext: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  replyBar: {
    width: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    marginRight: theme.spacing.sm,
  },
  replyContent: {
    flex: 1,
  },
  editReplyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  editReplyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  replyPreview: {
    flex: 1,
  },
  cancelEditReply: {
    padding: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    minWidth: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  cancelOption: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    justifyContent: 'center',
  },
  fullImageModal: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: theme.spacing.md,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
