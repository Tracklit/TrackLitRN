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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  PaperPlaneRight,
  Paperclip,
  X as XIcon,
  PencilSimple,
  Trash,
  ArrowBendUpLeft,
  WarningCircle,
  ChatTeardropDots,
  Check,
} from 'phosphor-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';

import { Text } from '../components/ui/Text';
import { Avatar } from '../components/ui/Avatar';
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

const formatMsgTime = (dateStr: string) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'HH:mm');
};

const formatDateSeparator = (dateStr: string) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d');
};

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

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const endpoint =
      type === 'group'
        ? `/api/chat/groups/${conversationId}/mark-read`
        : `/api/chat/direct/${conversationId}/mark-read`;
    apiRequest(endpoint, { method: 'POST', rawResponse: true }).catch(() => {});
  }, [conversationId, type]);

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', type, conversationId],
    queryFn: () => {
      const endpoint = type === 'group'
        ? `/api/chat/groups/${conversationId}/messages`
        : `/api/chat/direct/${conversationId}/messages`;
      return apiRequest<Message[]>(endpoint);
    },
    enabled: !!conversationId,
    refetchInterval: 5000,
  });

  const infoQuery = useQuery({
    queryKey: ['chat-info', type, conversationId],
    queryFn: () => {
      if (type === 'group') {
        return apiRequest<GroupInfo>(`/api/chat/groups/${conversationId}`);
      }
      return null;
    },
    enabled: type === 'group' && !!conversationId,
  });

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
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  const sendMediaMutation = useMutation({
    mutationFn: async (payload: { asset: Asset; text?: string }) => {
      const token = await getToken();
      if (!token) throw new Error('Missing auth token');
      if (!payload.asset.uri) throw new Error('Missing media uri');

      const isGroup = type === 'group';
      const uploadField = isGroup ? 'media' : 'image';
      const endpoint = isGroup
        ? `/api/chat/groups/${conversationId}/messages`
        : `/api/chat/direct/${conversationId}/messages`;

      const formData = new FormData();
      if (payload.text?.trim()) formData.append('text', payload.text.trim());
      formData.append(uploadField, {
        uri: payload.asset.uri,
        name: payload.asset.fileName || 'upload.jpg',
        type: payload.asset.type || 'image/jpeg',
      } as any);

      const response = await fetch(`${env.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text() || 'Failed to send media');
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

  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, text }: { messageId: number; text: string }) => {
      const endpoint = type === 'group'
        ? `/api/chat/groups/${conversationId}/messages/${messageId}`
        : `/api/chat/direct/${conversationId}/messages/${messageId}`;
      return apiRequest(endpoint, { method: 'PATCH', data: { text } });
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

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const endpoint = type === 'group'
        ? `/api/chat/groups/${conversationId}/messages/${messageId}`
        : `/api/chat/direct/${conversationId}/messages/${messageId}`;
      return apiRequest(endpoint, { method: 'DELETE' });
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
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMessageMutation.mutate(selectedMessage.id);
          setShowMessageOptions(false);
        },
      },
    ]);
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
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8 });
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Unable to pick image', result.errorMessage || 'Please try again.');
      return;
    }
    const asset = result.assets?.[0] ?? null;
    if (!asset?.uri) return;
    setPendingMedia(asset);
  };

  const messages = messagesQuery.data ?? [];
  const groupInfo = type === 'group' ? infoQuery.data : null;

  const handleSend = () => {
    if (editingMessage) {
      if (!messageText.trim() || editMessageMutation.isPending) return;
      editMessageMutation.mutate({ messageId: editingMessage.id, text: messageText.trim() });
      return;
    }
    if (pendingMedia) {
      if (sendMediaMutation.isPending) return;
      sendMediaMutation.mutate({ asset: pendingMedia, text: messageText });
      return;
    }
    if (!messageText.trim() || sendMessageMutation.isPending) return;
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
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }).catch((error: Error) => {
        Alert.alert('Unable to send reply', error.message || 'Please try again.');
      });
      return;
    }
    sendMessageMutation.mutate(messageText.trim());
  };

  const getHeaderTitle = () => {
    if (type === 'group' && groupInfo) return groupInfo.name;
    const otherUserMessage = messages.find(m => m.senderId !== user?.id);
    return otherUserMessage?.senderName || 'Chat';
  };

  const getHeaderSubtitle = () => {
    if (type === 'group' && groupInfo?.memberCount) return `${groupInfo.memberCount} members`;
    return undefined;
  };

  const renderDateSeparator = (dateStr: string) => (
    <View style={styles.dateSeparator}>
      <View style={styles.datePill}>
        <Text style={styles.datePillText}>{formatDateSeparator(dateStr)}</Text>
      </View>
    </View>
  );

  const isSending = sendMessageMutation.isPending || sendMediaMutation.isPending || editMessageMutation.isPending;
  const canSend = (pendingMedia || messageText.trim()) && !isSending;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color="#fff" weight="bold" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text variant="body" weight="bold" color="foreground" numberOfLines={1}>
              {getHeaderTitle()}
            </Text>
            {getHeaderSubtitle() && (
              <Text variant="small" color="muted">{getHeaderSubtitle()}</Text>
            )}
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messagesQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="body" color="muted" style={{ marginTop: 12 }}>Loading messages...</Text>
            </View>
          ) : messagesQuery.isError ? (
            <View style={styles.centerState}>
              <WarningCircle size={32} color={theme.colors.textMuted} weight="fill" />
              <Text variant="body" color="muted" style={{ marginTop: 12 }}>Unable to load messages</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centerState}>
              <ChatTeardropDots size={32} color={theme.colors.textMuted} weight="fill" />
              <Text variant="body" color="muted" style={{ marginTop: 12 }}>No messages yet. Start the conversation!</Text>
            </View>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const isDeleted = message.isDeleted;
              const hasImage = message.messageType === 'image' && message.mediaUrl;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showDate = !prevMessage || !isSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt));

              return (
                <React.Fragment key={message.id}>
                  {showDate && renderDateSeparator(message.createdAt)}
                  <Pressable
                    onLongPress={() => !isDeleted && handleMessageLongPress(message)}
                    delayLongPress={500}
                  >
                    <View style={[styles.msgRow, isOwn ? styles.msgRowRight : styles.msgRowLeft]}>
                      {!isOwn && type === 'group' && (
                        <Avatar
                          size="sm"
                          src={message.senderProfileImage}
                          fallback={message.senderName?.[0] || '?'}
                          style={styles.msgAvatar}
                        />
                      )}
                      <View
                        style={[
                          styles.bubble,
                          isOwn ? styles.bubbleOwn : styles.bubbleOther,
                          isDeleted && styles.bubbleDeleted,
                        ]}
                      >
                        {!isOwn && type === 'group' && message.senderName && (
                          <Text style={styles.senderLabel}>{message.senderName}</Text>
                        )}

                        {message.replyToMessage && (
                          <View style={[styles.replyBlock, isOwn ? styles.replyBlockOwn : styles.replyBlockOther]}>
                            <Text style={[styles.replyAuthor, isOwn ? styles.replyAuthorOwn : styles.replyAuthorOther]}>
                              {message.replyToMessage.senderName || 'Unknown'}
                            </Text>
                            <Text
                              style={[styles.replyText, isOwn ? styles.replyTextOwn : styles.replyTextOther]}
                              numberOfLines={1}
                            >
                              {message.replyToMessage.messageType === 'image' ? '📷 Photo' : message.replyToMessage.text}
                            </Text>
                          </View>
                        )}

                        {hasImage && (
                          <TouchableOpacity onPress={() => setShowFullImage(message.mediaUrl || null)}>
                            <Image source={{ uri: message.mediaUrl }} style={styles.msgImage} resizeMode="cover" />
                          </TouchableOpacity>
                        )}

                        {(message.text || isDeleted) && (
                          <Text style={[styles.msgText, isOwn ? styles.msgTextOwn : styles.msgTextOther, isDeleted && styles.deletedText]}>
                            {isDeleted ? 'This message was deleted' : message.text}
                          </Text>
                        )}

                        <View style={styles.msgMeta}>
                          {message.editedAt && !isDeleted && (
                            <Text style={[styles.metaLabel, isOwn ? styles.metaOwn : styles.metaOther]}>edited</Text>
                          )}
                          <Text style={[styles.metaTime, isOwn ? styles.metaOwn : styles.metaOther]}>
                            {formatMsgTime(message.createdAt)}
                          </Text>
                          {isOwn && !isDeleted && (
                            <Check size={14} color="rgba(255,255,255,0.5)" weight="bold" style={{ marginLeft: 2 }} />
                          )}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </React.Fragment>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: insets.bottom || 12 }]}>
          {(editingMessage || replyToMessage) && (
            <View style={styles.editReplyBar}>
              <View style={styles.editReplyLeft}>
                <View style={styles.editReplyAccent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.editReplyTitle}>
                    {editingMessage ? 'Editing' : `Reply to ${replyToMessage?.senderName || 'message'}`}
                  </Text>
                  <Text style={styles.editReplyPreview} numberOfLines={1}>
                    {editingMessage
                      ? editingMessage.text
                      : replyToMessage?.messageType === 'image'
                      ? '📷 Photo'
                      : replyToMessage?.text}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={cancelEditOrReply} style={{ padding: 4 }}>
                <XIcon size={18} color="#94a3b8" weight="bold" />
              </TouchableOpacity>
            </View>
          )}

          {pendingMedia && (
            <View style={styles.attachPreview}>
              <Text variant="small" color="muted">1 image attached</Text>
              <TouchableOpacity onPress={() => setPendingMedia(null)}>
                <XIcon size={16} color="#94a3b8" weight="bold" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handleAttach}
              disabled={isSending || !!editingMessage}
            >
              <Paperclip size={20} color={editingMessage ? '#475569' : '#94a3b8'} weight="bold" />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder={
                editingMessage ? 'Edit your message...'
                : replyToMessage ? `Reply to ${replyToMessage.senderName || 'message'}...`
                : pendingMedia ? 'Add a caption...'
                : 'Message'
              }
              placeholderTextColor="#64748b"
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnInactive]}
              onPress={handleSend}
              disabled={!canSend}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#64748b" />
              ) : (
                <PaperPlaneRight
                  size={20}
                  color={canSend ? '#fff' : '#475569'}
                  weight="fill"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showMessageOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageOptions(false)}
      >
        <TouchableOpacity
          style={styles.optionsOverlay}
          activeOpacity={1}
          onPress={() => setShowMessageOptions(false)}
        >
          <View style={styles.optionsCard}>
            <TouchableOpacity style={styles.optionRow} onPress={handleReplyToMessage}>
              <ArrowBendUpLeft size={20} color="#e2e8f0" weight="bold" />
              <Text variant="body" color="foreground">Reply</Text>
            </TouchableOpacity>
            {selectedMessage?.senderId === user?.id && (
              <>
                <TouchableOpacity style={styles.optionRow} onPress={handleEditMessage}>
                  <PencilSimple size={20} color="#e2e8f0" weight="fill" />
                  <Text variant="body" color="foreground">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionRow} onPress={handleDeleteMessage}>
                  <Trash size={20} color="#ef4444" weight="fill" />
                  <Text variant="body" style={{ color: '#ef4444' }}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.optionRow, styles.optionCancel]}
              onPress={() => setShowMessageOptions(false)}
            >
              <Text variant="body" color="muted">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={!!showFullImage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullImage(null)}
      >
        <View style={styles.fullImageWrap}>
          <TouchableOpacity style={styles.closeImageBtn} onPress={() => setShowFullImage(null)}>
            <XIcon size={28} color="white" weight="bold" />
          </TouchableOpacity>
          {showFullImage && (
            <Image source={{ uri: showFullImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e1621',
  },
  keyboardAvoid: {
    flex: 1,
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
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 12,
  },
  datePill: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  datePillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
    marginRight: 48,
  },
  msgRowRight: {
    justifyContent: 'flex-end',
    marginLeft: 48,
  },
  msgAvatar: {
    marginRight: 6,
    alignSelf: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 14,
  },
  bubbleOwn: {
    backgroundColor: '#2b5278',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#1e2c3a',
    borderBottomLeftRadius: 4,
  },
  bubbleDeleted: {
    opacity: 0.55,
  },
  senderLabel: {
    color: '#7cacf8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 21,
  },
  msgTextOwn: {
    color: '#e8edf2',
  },
  msgTextOther: {
    color: '#e2e8f0',
  },
  deletedText: {
    fontStyle: 'italic',
    opacity: 0.6,
  },
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
    gap: 4,
  },
  metaTime: {
    fontSize: 11,
  },
  metaLabel: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  metaOwn: {
    color: 'rgba(255,255,255,0.45)',
  },
  metaOther: {
    color: 'rgba(148,163,184,0.6)',
  },
  msgImage: {
    width: 220,
    height: 165,
    borderRadius: 10,
    marginBottom: 4,
  },
  replyBlock: {
    paddingLeft: 10,
    paddingVertical: 4,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderRadius: 4,
  },
  replyBlockOwn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderLeftColor: '#7cacf8',
  },
  replyBlockOther: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftColor: '#7cacf8',
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 1,
  },
  replyAuthorOwn: {
    color: '#7cacf8',
  },
  replyAuthorOther: {
    color: '#7cacf8',
  },
  replyText: {
    fontSize: 12,
  },
  replyTextOwn: {
    color: 'rgba(255,255,255,0.5)',
  },
  replyTextOther: {
    color: 'rgba(148,163,184,0.7)',
  },
  inputBar: {
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: '#0e1621',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  editReplyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 8,
    marginBottom: 8,
    paddingVertical: 8,
    paddingRight: 8,
  },
  editReplyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 0,
  },
  editReplyAccent: {
    width: 3,
    height: '100%',
    backgroundColor: '#7cacf8',
    borderRadius: 2,
    marginRight: 10,
  },
  editReplyTitle: {
    color: '#7cacf8',
    fontSize: 13,
    fontWeight: '600',
  },
  editReplyPreview: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 1,
  },
  attachPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#e2e8f0',
    maxHeight: 100,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#FF9800',
  },
  sendBtnInactive: {
    backgroundColor: 'transparent',
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsCard: {
    backgroundColor: '#1a2332',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionCancel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    marginTop: 4,
    justifyContent: 'center',
  },
  fullImageWrap: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 12,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
