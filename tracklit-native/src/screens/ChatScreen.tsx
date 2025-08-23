import React, { useState, useRef, useEffect, useCallback } from 'react';
// Mock React Native imports for TypeScript compatibility
// In production, these would come from react-native packages
const View = 'div' as any;
const Text = 'span' as any;
const StyleSheet = { create: (styles: any) => styles };
const FlatList = 'div' as any;
const Platform = { OS: 'ios' as const };
const Keyboard = { dismiss: () => {} };
const TouchableWithoutFeedback = 'div' as any;
const Pressable = 'button' as any;
const TextInput = 'input' as any;
const Alert = { alert: (title: string, message?: string, buttons?: any[]) => console.log('Alert:', title, message) };
const RefreshControl = (props: any) => null;
const StatusBar = (props: any) => null;
const Dimensions = { get: () => ({ width: 375, height: 812 }) };
const SafeAreaView = ({ children }: { children: any }) => children;
const PanGestureHandler = ({ children }: { children: any }) => children;
const State = { BEGAN: 'BEGAN', ACTIVE: 'ACTIVE', END: 'END' };
const useSharedValue = (initial: any) => ({ value: initial });
const useAnimatedGestureHandler = (handler: any) => handler;
const useAnimatedStyle = (style: any) => style;
const runOnJS = (fn: any) => fn;
const withSpring = (value: any) => value;
const withTiming = (value: any, config?: any, callback?: any) => { if (callback) callback(); return value; };
const Animated = { View: 'div' as any };
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { ChatChannel, ChatMessage, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import ChatInput from '../components/ChatInput';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

interface ChatScreenProps {
  route?: {
    params?: {
      groupId?: number;
      channelType?: 'group' | 'direct';
      userName?: string;
    };
  };
  navigation?: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const [selectedChat, setSelectedChat] = useState<{ type: 'group' | 'direct'; id: number } | null>(
    route?.params?.groupId 
      ? { type: route.params.channelType || 'group', id: route.params.groupId }
      : null
  );
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewState, setViewState] = useState<'list' | 'chat'>(
    route?.params?.groupId ? 'chat' : 'list'
  );
  const [groupFilter, setGroupFilter] = useState<'my' | 'public'>('my');
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Animated values for swipe navigation
  const translateX = useSharedValue(0);
  const gestureActive = useSharedValue(false);

  // Fetch chat channels
  const { data: chatChannels = [], isLoading: channelsLoading, refetch: refetchChannels } = useQuery({
    queryKey: ['chatChannels'],
    queryFn: () => apiService.getChatChannels(),
    staleTime: 60000, // 1 minute
  });
  
  const typedChatChannels = (chatChannels as any[]) || [];

  // Fetch unread counts
  const { data: unreadCounts = {} } = useQuery({
    queryKey: ['unreadCounts'],
    queryFn: () => apiService.getUnreadCounts(),
    enabled: !!user,
    refetchInterval: 30000,
  });
  
  const typedUnreadCounts = (unreadCounts as Record<string, number>) || {};

  // Fetch messages for selected chat
  const { 
    data: messages = [], 
    isLoading: messagesLoading, 
    refetch: refetchMessages 
  } = useQuery({
    queryKey: ['messages', selectedChat?.type, selectedChat?.id],
    queryFn: () => selectedChat 
      ? apiService.getChannelMessages(selectedChat.id, selectedChat.type)
      : Promise.resolve([]),
    enabled: !!selectedChat,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  const typedMessages = (messages as ChatMessage[]) || [];

  // Filter channels
  const filteredChannels = typedChatChannels?.filter((channel: ChatChannel) => {
    let matchesFilter = false;
    if (groupFilter === 'my') {
      matchesFilter = channel.is_member || channel.is_admin || channel.is_owner;
    } else {
      matchesFilter = !channel.is_private;
    }
    
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { text: string; replyToId?: number }) => {
      if (!selectedChat) throw new Error('No chat selected');
      return apiService.sendMessage(
        selectedChat.id,
        data.text,
        selectedChat.type,
        data.replyToId
      );
    },
    onSuccess: () => {
      setMessageText('');
      setReplyToMessage(null);
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to send message');
      console.error('Send message error:', error);
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async (data: { messageId: number; text: string }) => {
      if (!selectedChat) throw new Error('No chat selected');
      return apiService.editMessage(data.messageId, data.text, selectedChat.type);
    },
    onSuccess: () => {
      setEditingMessage(null);
      refetchMessages();
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to edit message');
      console.error('Edit message error:', error);
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      if (!selectedChat) throw new Error('No chat selected');
      return apiService.deleteMessage(messageId, selectedChat.type);
    },
    onSuccess: () => {
      refetchMessages();
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to delete message');
      console.error('Delete message error:', error);
    },
  });

  // Handle sending message
  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim() || !selectedChat) return;

    if (editingMessage) {
      editMessageMutation.mutate({ messageId: editingMessage.id, text: text.trim() });
    } else {
      sendMessageMutation.mutate({ 
        text: text.trim(), 
        replyToId: replyToMessage?.id 
      });
    }
  }, [selectedChat, editingMessage, replyToMessage, editMessageMutation, sendMessageMutation]);

  // Handle chat selection
  const handleChatSelect = useCallback((channel: ChatChannel) => {
    setSelectedChat({ 
      type: channel.channel_type || 'group', 
      id: channel.id 
    });
    setViewState('chat');
  }, []);

  // Handle back to list
  const handleBackToList = useCallback(() => {
    setSelectedChat(null);
    setViewState('list');
    setEditingMessage(null);
    setReplyToMessage(null);
  }, []);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchChannels();
      if (selectedChat) {
        await refetchMessages();
      }
    } finally {
      setRefreshing(false);
    }
  }, [refetchChannels, refetchMessages, selectedChat]);

  // Pan gesture handler for swipe navigation
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      gestureActive.value = true;
    },
    onActive: (event: any) => {
      // Only allow right swipe when in chat view
      if (viewState === 'chat' && event.translationX > 0) {
        translateX.value = Math.min(event.translationX, SCREEN_WIDTH * 0.7);
      }
    },
    onEnd: (event: any) => {
      gestureActive.value = false;
      
      if (viewState === 'chat' && event.translationX > SWIPE_THRESHOLD) {
        // Complete the swipe - go back to list
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 }, () => {
          runOnJS(handleBackToList)();
          translateX.value = 0;
        });
      } else {
        // Spring back
        translateX.value = withSpring(0);
      }
    },
  });

  // Animated style for swipe
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (flatListRef.current && typedMessages.length > 0 && viewState === 'chat') {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [typedMessages, viewState]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const renderChannelItem = ({ item }: { item: ChatChannel }) => {
    const unreadCount = typedUnreadCounts[item.id] || 0;
    
    return (
      <Pressable
        style={styles.channelItem}
        onPress={() => handleChatSelect(item)}
      >
        <View style={styles.channelAvatar}>
          <Text style={styles.channelAvatarText}>
            {item.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.channelInfo}>
          <Text style={styles.channelName}>{item.name}</Text>
          {item.last_message && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.user_id === user?.id;
    
    return (
      <Pressable
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage
        ]}
        onLongPress={() => {
          if (isOwn) {
            Alert.alert(
              'Message Options',
              'What would you like to do?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Edit', 
                  onPress: () => {
                    setEditingMessage(item);
                    setMessageText(item.text);
                  }
                },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => deleteMessageMutation.mutate(item.id)
                },
              ]
            );
          } else {
            setReplyToMessage(item);
          }
        }}
      >
        {!isOwn && (
          <View style={styles.messageHeader}>
            <Text style={styles.senderName}>
              {item.user?.name || 'Unknown User'}
            </Text>
          </View>
        )}
        
        {item.reply_to_message && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyText} numberOfLines={1}>
              Replying to: {item.reply_to_message.text}
            </Text>
          </View>
        )}
        
        <Text style={[
          styles.messageText,
          isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {item.text}
        </Text>
        
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </Text>
          {item.edited_at && (
            <Text style={styles.editedText}>edited</Text>
          )}
        </View>
      </Pressable>
    );
  };

  const renderListView = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <View style={styles.filterToggle}>
          <Pressable
            style={[styles.filterButton, groupFilter === 'my' && styles.activeFilter]}
            onPress={() => setGroupFilter('my')}
          >
            <Text style={[styles.filterText, groupFilter === 'my' && styles.activeFilterText]}>
              My Groups
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterButton, groupFilter === 'public' && styles.activeFilter]}
            onPress={() => setGroupFilter('public')}
          >
            <Text style={[styles.filterText, groupFilter === 'public' && styles.activeFilterText]}>
              Public
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search channels..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredChannels}
        renderItem={renderChannelItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.channelsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderChatView = () => {
    const selectedChannel = typedChatChannels.find((ch: ChatChannel) => ch.id === selectedChat?.id);
    
    return (
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <Pressable style={styles.backButton} onPress={handleBackToList}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.chatTitle}>
            {selectedChannel?.name || route?.params?.userName || 'Chat'}
          </Text>
        </View>

        {replyToMessage && (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText} numberOfLines={1}>
              Replying to: {replyToMessage.text}
            </Text>
            <Pressable onPress={() => setReplyToMessage(null)}>
              <Text style={styles.cancelReply}>✕</Text>
            </Pressable>
          </View>
        )}

        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <FlatList
            ref={flatListRef}
            data={typedMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#007AFF"
              />
            }
          />
        </TouchableWithoutFeedback>

        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder={editingMessage ? "Edit message..." : "Type a message..."}
          maxLength={1000}
          initialValue={editingMessage ? editingMessage.text : messageText}
          onTextChange={setMessageText}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <PanGestureHandler onGestureEvent={panGestureHandler}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {viewState === 'list' ? renderListView() : renderChatView()}
        </Animated.View>
      </PanGestureHandler>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  filterToggle: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  channelsList: {
    flex: 1,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  channelAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  channelAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  chatTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  replyBannerText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 14,
    fontStyle: 'italic',
  },
  cancelReply: {
    color: '#9CA3AF',
    fontSize: 16,
    padding: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    marginLeft: '20%',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
    marginRight: '20%',
  },
  messageHeader: {
    marginBottom: 4,
  },
  senderName: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  replyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  replyText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#ffffff',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
    color: '#D1D5DB',
  },
  editedText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default ChatScreen;