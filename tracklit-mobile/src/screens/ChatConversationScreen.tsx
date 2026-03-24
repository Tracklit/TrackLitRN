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
import * as ImagePicker from 'expo-image-picker';
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

import { Text } from '../components/ui/Text';
import { Avatar } from '../components/ui/Avatar';
import { SkeletonMessageList } from '@/components/Skeleton';
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

interface GroupInfoApi {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  avatar_url?: string | null;
  memberCount?: number | null;
  member_count?: number | null;
  member_ids?: number[] | null;
  members?: unknown[] | null;
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

const normalizeGroupInfo = (group: GroupInfoApi): GroupInfo => {
  const memberIds = Array.isArray(group.member_ids) ? group.member_ids : [];
  const members = Array.isArray(group.members) ? group.members : [];
  const derivedMemberCount = memberIds.length > 0 ? memberIds.length : members.length;
  return {
    id: group.id,
    name: group.name,
    description: group.description ?? undefined,
    imageUrl: group.imageUrl ?? group.avatar_url ?? undefined,
    memberCount: group.memberCount ?? group.member_count ?? derivedMemberCount,
  };
};

// Normalise raw server message — handles both camelCase and snake_case API responses
const normalizeMessage = (raw: any): Message => {
  // Broad sender ID lookup — cover every naming convention the server might use
  const rawSenderId =
    raw.senderId ??
    raw.sender_id ??
    raw.userId ??
    raw.user_id ??
    raw.authorId ??
    raw.author_id ??
    raw.fromUserId ??
    raw.from_user_id ??
    raw.user?.id ??
    0;

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[MSG]', JSON.stringify({ keys: Object.keys(raw), senderId: rawSenderId, id: raw.id }));
  }

  const replyRaw = raw.replyToMessage ?? raw.reply_to_message ?? null;
  return {
    id: raw.id,
    text: raw.text ?? raw.content ?? undefined,
    senderId: Number(rawSenderId),
    senderName: raw.senderName ?? raw.sender_name ?? raw.user?.name ?? raw.user?.username ?? undefined,
    senderProfileImage:
      raw.senderProfileImage ??
      raw.sender_profile_image ??
      raw.senderAvatar ??
      raw.sender_avatar ??
      raw.user?.profileImageUrl ??
      raw.user?.profile_image_url ??
      undefined,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    messageType: raw.messageType ?? raw.message_type ?? 'text',
    mediaUrl: raw.mediaUrl ?? raw.media_url ?? raw.imageUrl ?? raw.image_url ?? undefined,
    isDeleted: raw.isDeleted ?? raw.is_deleted ?? false,
    editedAt: raw.editedAt ?? raw.edited_at ?? undefined,
    replyToId: raw.replyToId ?? raw.reply_to_id ?? undefined,
    replyToMessage: replyRaw ? {
      id: replyRaw.id,
      text: replyRaw.text ?? replyRaw.content ?? undefined,
      senderName: replyRaw.senderName ?? replyRaw.sender_name ?? replyRaw.user?.name ?? undefined,
      messageType: replyRaw.messageType ?? replyRaw.message_type ?? 'text',
    } : undefined,
  };
};

export const ChatConversationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ChatConversationRouteProp>();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const { conversationId, type } = route.params || { conversationId: 0, type: 'direct' as const };
  const [messageText, setMessageText] = useState('');
  const [pendingMedia, setPendingMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
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
    queryFn: async () => {
      const endpoint = type === 'group'
        ? `/api/chat/groups/${conversationId}/messages`
        : `/api/chat/direct/${conversationId}/messages`;
      const raw = await apiRequest<any[]>(endpoint);
      return (raw ?? []).map(normalizeMessage);
    },
    enabled: !!conversationId,
    refetchInterval: 5000,
  });

  const infoQuery = useQuery({
    queryKey: ['chat-info', type, conversationId],
    queryFn: () => {
      if (type === 'group') {
        return apiRequest<GroupInfoApi>(`/api/chat/groups/${conversationId}`).then(normalizeGroupInfo);
      }
      return null;
    },
    enabled: type === 'group' && !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, replyToId }: { text: string; replyToId?: number }) => {
      const endpoint = type === 'group'
        ? `/api/chat/groups/${conversationId}/messages`
        : `/api/chat/direct/${conversationId}/messages`;
      return apiRequest(endpoint, {
        method: 'POST',
        data: { text, ...(replyToId ? { replyToId } : {}) },
      });
    },
    onSuccess: () => {
      setMessageText('');
      setReplyToMessage(null);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', type, conversationId] });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  const sendMediaMutation = useMutation({
    mutationFn: async (payload: { asset: ImagePicker.ImagePickerAsset; text?: string; replyToId?: number }) => {
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
      if (payload.replyToId) formData.append('replyToId', String(payload.replyToId));
      const filename = payload.asset.fileName || `upload_${Date.now()}.jpg`;
      const mimeType = payload.asset.mimeType || 'image/jpeg';
      formData.append(uploadField, {
        uri: payload.asset.uri,
        name: filename,
        type: mimeType,
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
      setReplyToMessage(null);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', type, conversationId] });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (error: Error) => {
      Alert.alert('Unable to send image', error.message || 'Please try again.');
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
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
      sendMediaMutation.mutate({
        asset: pendingMedia,
        text: messageText,
        replyToId: replyToMessage?.id,
      });
      return;
    }
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ text: messageText.trim(), replyToId: replyToMessage?.id });
  };

  const getHeaderTitle = () => {
    if (type === 'group' && groupInfo) return groupInfo.name;
    const otherUserMessage = messages.find(m => Number(m.senderId) !== Number(user?.id));
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
  const subtitle = getHeaderSubtitle();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color="#fff" weight="bold" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.groupNamePill}>
              <Text style={styles.groupNameText} numberOfLines={1}>{getHeaderTitle()}</Text>
              {subtitle && (
                <Text style={styles.groupSubtitleText}>{subtitle}</Text>
              )}
            </View>
          </View>

          <View style={styles.headerRight} />
        </View>

        {/* Messages */}
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
              <SkeletonMessageList count={5} />
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
              const isOwn = Number(message.senderId) === Number(user?.id);
              if (__DEV__ && index === 0) {
                // eslint-disable-next-line no-console
                console.log('[isOwn debug]', { msgSenderId: message.senderId, userId: user?.id, isOwn });
              }
              const isDeleted = message.isDeleted;
              const hasImage = message.messageType === 'image' && message.mediaUrl;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
              const showDate = !prevMessage || !isSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt));
              const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId;

              return (
                <React.Fragment key={message.id}>
                  {showDate && renderDateSeparator(message.createdAt)}
                  <Pressable
                    onLongPress={() => !isDeleted && handleMessageLongPress(message)}
                    delayLongPress={400}
                  >
                    <View style={[styles.msgRow, isOwn ? styles.msgRowRight : styles.msgRowLeft]}>
                      {/* Avatar — other users in group, only on last message of a group */}
                      {!isOwn && type === 'group' && (
                        <View style={styles.avatarSlot}>
                          {isLastInGroup && (
                            <Avatar
                              size="sm"
                              src={message.senderProfileImage}
                              fallback={message.senderName?.[0] || '?'}
                            />
                          )}
                        </View>
                      )}

                      <View
                        style={[
                          styles.bubble,
                          isOwn ? styles.bubbleOwn : styles.bubbleOther,
                          isDeleted && styles.bubbleDeleted,
                        ]}
                      >
                        {/* Sender name — others in group, first message of chain */}
                        {!isOwn && type === 'group' && message.senderName && (
                          <Text style={styles.senderLabel}>{message.senderName}</Text>
                        )}

                        {/* Reply preview */}
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

                        {/* Image */}
                        {hasImage && (
                          <TouchableOpacity onPress={() => setShowFullImage(message.mediaUrl || null)}>
                            <Image source={{ uri: message.mediaUrl }} style={styles.msgImage} resizeMode="cover" />
                          </TouchableOpacity>
                        )}

                        {/* Text */}
                        {(message.text || isDeleted) && (
                          <Text style={[
                            styles.msgText,
                            isOwn ? styles.msgTextOwn : styles.msgTextOther,
                            isDeleted && styles.deletedText,
                          ]}>
                            {isDeleted ? 'This message was deleted' : message.text}
                          </Text>
                        )}

                        {/* Meta row */}
                        <View style={styles.msgMeta}>
                          {message.editedAt && !isDeleted && (
                            <Text style={[styles.metaLabel, isOwn ? styles.metaOwn : styles.metaOther]}>edited</Text>
                          )}
                          <Text style={[styles.metaTime, isOwn ? styles.metaOwn : styles.metaOther]}>
                            {formatMsgTime(message.createdAt)}
                          </Text>
                          {isOwn && !isDeleted && (
                            <Check size={13} color={isOwn ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)'} weight="bold" style={{ marginLeft: 1 }} />
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

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom || 12 }]}>

          {/* Edit / Reply banner */}
          {(editingMessage || replyToMessage) && (
            <View style={styles.editReplyBar}>
              <View style={styles.editReplyAccent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.editReplyTitle}>
                  {editingMessage ? 'Editing message' : `Reply to ${replyToMessage?.senderName || 'message'}`}
                </Text>
                <Text style={styles.editReplyPreview} numberOfLines={1}>
                  {editingMessage
                    ? editingMessage.text
                    : replyToMessage?.messageType === 'image'
                    ? '📷 Photo'
                    : replyToMessage?.text}
                </Text>
              </View>
              <TouchableOpacity onPress={cancelEditOrReply} style={styles.editReplyClose}>
                <XIcon size={18} color="#94a3b8" weight="bold" />
              </TouchableOpacity>
            </View>
          )}

          {/* Image preview thumbnail */}
          {pendingMedia && (
            <View style={styles.attachPreview}>
              <Image source={{ uri: pendingMedia.uri }} style={styles.attachThumb} resizeMode="cover" />
              <Text variant="small" color="muted" style={{ flex: 1, marginLeft: 10 }}>
                Image ready to send
              </Text>
              <TouchableOpacity onPress={() => setPendingMedia(null)} style={{ padding: 4 }}>
                <XIcon size={16} color="#94a3b8" weight="bold" />
              </TouchableOpacity>
            </View>
          )}

          {/* Row: attach + input + send */}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handleAttach}
              disabled={isSending || !!editingMessage}
            >
              <Paperclip size={21} color={editingMessage ? '#475569' : '#94a3b8'} weight="bold" />
            </TouchableOpacity>

            <View style={styles.textInputWrap}>
              <TextInput
                style={styles.textInput}
                value={messageText}
                onChangeText={setMessageText}
                placeholder={
                  editingMessage ? 'Edit message…'
                  : replyToMessage ? `Reply to ${replyToMessage.senderName || 'message'}…`
                  : pendingMedia ? 'Add a caption…'
                  : 'Message'
                }
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                maxLength={1000}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnInactive]}
              onPress={handleSend}
              disabled={!canSend}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
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

      {/* Message options modal */}
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

      {/* Full-screen image viewer */}
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

  // ── Header ──────────────────────────────────────────────
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupNamePill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  groupNameText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  groupSubtitleText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 1,
  },
  headerRight: {
    width: 36,
  },

  // ── Messages ─────────────────────────────────────────────
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 14,
  },
  datePill: {
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    marginBottom: 2,
    alignItems: 'flex-end',
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
    marginRight: 48,
  },
  msgRowRight: {
    justifyContent: 'flex-end',
    marginLeft: 48,
  },
  avatarSlot: {
    width: 32,
    height: 32,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: '#FF7A00',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  bubbleDeleted: {
    opacity: 0.5,
  },
  senderLabel: {
    color: '#FF7A00',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 21,
  },
  msgTextOwn: {
    color: '#ffffff',
  },
  msgTextOther: {
    color: '#1a1a2e',
  },
  deletedText: {
    fontStyle: 'italic',
    opacity: 0.6,
  },
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 3,
  },
  metaTime: {
    fontSize: 11,
  },
  metaLabel: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  metaOwn: {
    color: 'rgba(255,255,255,0.65)',
  },
  metaOther: {
    color: 'rgba(0,0,0,0.4)',
  },
  msgImage: {
    width: 220,
    height: 165,
    borderRadius: 12,
    marginBottom: 4,
  },

  // ── Reply block inside bubble ─────────────────────────────
  replyBlock: {
    paddingLeft: 10,
    paddingVertical: 5,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderRadius: 6,
  },
  replyBlockOwn: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderLeftColor: 'rgba(255,255,255,0.7)',
  },
  replyBlockOther: {
    backgroundColor: 'rgba(255,122,0,0.1)',
    borderLeftColor: '#FF7A00',
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  replyAuthorOwn: {
    color: 'rgba(255,255,255,0.85)',
  },
  replyAuthorOther: {
    color: '#FF7A00',
  },
  replyText: {
    fontSize: 12,
  },
  replyTextOwn: {
    color: 'rgba(255,255,255,0.6)',
  },
  replyTextOther: {
    color: 'rgba(0,0,0,0.55)',
  },

  // ── Input bar ────────────────────────────────────────────
  inputBar: {
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: '#0e1621',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  editReplyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 8,
    paddingVertical: 8,
    paddingLeft: 0,
    paddingRight: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  editReplyAccent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: '#FF7A00',
    borderRadius: 2,
    marginRight: 10,
  },
  editReplyTitle: {
    color: '#FF7A00',
    fontSize: 13,
    fontWeight: '600',
  },
  editReplyPreview: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 1,
  },
  editReplyClose: {
    padding: 4,
    marginLeft: 8,
  },
  attachPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  attachThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputWrap: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 2,
    minHeight: 42,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    color: '#ffffff',
    maxHeight: 100,
    padding: 0,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#FF7A00',
  },
  sendBtnInactive: {
    backgroundColor: 'transparent',
  },

  // ── Options modal ────────────────────────────────────────
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsCard: {
    backgroundColor: '#1a2332',
    borderRadius: 16,
    paddingVertical: 4,
    minWidth: 200,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionCancel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },

  // ── Full image viewer ─────────────────────────────────────
  fullImageWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
