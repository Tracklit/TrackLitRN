import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';

import { Text } from '../components/ui/Text';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import theme from '../utils/theme';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface SprinthiaConversation {
  id: number;
  title: string;
  createdAt: string;
}

interface ChatResponse {
  response: string;
  conversationId: number;
}

const quickPrompts = [
  "Create a 400m workout plan",
  "Analyze my sprint technique", 
  "Plan my competition schedule",
  "Recovery tips after hard training",
  "Nutrition advice for sprinters",
  "Mental preparation strategies"
];

const welcomeMessage: Message = {
  id: 'welcome',
  text: "Hi! I'm Sprinthia, your AI athletics coach. I'm here to help you train smarter, compete better, and reach your full potential. What can I help you with today?",
  isUser: false,
  timestamp: new Date(),
};

export const SprinthiaScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  // Fetch conversation history (optional - for future conversation list feature)
  const conversationsQuery = useQuery({
    queryKey: ['sprinthia-conversations'],
    queryFn: () => apiRequest<SprinthiaConversation[]>('/api/sprinthia/conversations'),
    enabled: isAuthenticated && !isGuest,
  });

  // Send message mutation - connects to real backend
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const payload: { message: string; conversationId?: number } = { message };
      if (conversationId) {
        payload.conversationId = conversationId;
      }
      
      return apiRequest<ChatResponse>('/api/sprinthia/chat', {
        method: 'POST',
        data: payload,
      });
    },
    onSuccess: (data) => {
      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setConversationId(data.conversationId);
      setIsTyping(false);
      
      // Invalidate conversations cache to update history
      queryClient.invalidateQueries({ queryKey: ['sprinthia-conversations'] });
    },
    onError: (error: Error) => {
      console.error('Sprinthia API error:', error);
      setIsTyping(false);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        text: "I'm sorry, I couldn't process your request right now. Please check your connection and try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      Alert.alert(
        'Connection Error',
        error.message || 'Failed to send message to Sprinthia. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    // Check if user is authenticated
    if (!isAuthenticated || isGuest) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to chat with Sprinthia AI.',
        [{ text: 'OK' }]
      );
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    // Send to real backend API
    sendMessageMutation.mutate(inputText.trim());
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const handleNewConversation = () => {
    setMessages([welcomeMessage]);
    setConversationId(null);
    setViewMode('chat');
  };

  const loadConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      const items = await apiRequest<Array<{ id: number; role: string; content: string; createdAt: string }>>(
        `/api/sprinthia/conversations/${id}/messages`,
      );
      return items;
    },
    onSuccess: (items) => {
      const mapped: Message[] = items.map((m) => ({
        id: String(m.id),
        text: m.content,
        isUser: m.role === 'user',
        timestamp: new Date(m.createdAt),
      }));
      setMessages(mapped.length ? mapped : [welcomeMessage]);
      setIsTyping(false);
      setViewMode('chat');
    },
    onError: () => {
      Alert.alert('Unable to load conversation', 'Please try again.');
    },
  });

  const toggleViewMode = () => {
    Keyboard.dismiss();
    setViewMode((prev) => (prev === 'chat' ? 'history' : 'chat'));
  };

  const handleOpenDrawer = () => {
    navigation.getParent?.()?.openDrawer?.();
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
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleOpenDrawer}
              accessibilityRole="button"
              accessibilityLabel="Open drawer"
            >
              <FontAwesome5 name="bars" size={18} color={theme.colors.primary} solid />
            </TouchableOpacity>
            <View style={styles.aiAvatarContainer}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.deepGold]}
                style={styles.aiAvatar}
              >
                <FontAwesome5 name="robot" size={24} color="white" solid />
              </LinearGradient>
            </View>
            <View style={styles.headerText}>
              <Text variant="h3" weight="bold" color="foreground">
                Sprinthia AI
              </Text>
              <Text variant="small" color="success" weight="medium">
                ● Online
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconButton} onPress={toggleViewMode}>
                <FontAwesome5
                  name={viewMode === 'chat' ? 'keyboard' : 'comments'}
                  size={18}
                  color={theme.colors.primary}
                  solid
                />
              </TouchableOpacity>
              {/* New Conversation Button */}
              {messages.length > 1 && viewMode === 'chat' && (
                <TouchableOpacity style={styles.headerIconButton} onPress={handleNewConversation}>
                  <FontAwesome5 name="plus" size={18} color={theme.colors.primary} solid />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {viewMode === 'chat' ? (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <View style={styles.aiMessageContainer}>
                  <View style={styles.aiAvatarSmall}>
                    <FontAwesome5 name="robot" size={16} color={theme.colors.primary} solid />
                  </View>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text variant="small" color="muted" style={styles.typingText}>
                      Sprinthia is thinking...
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Quick Prompts - show only on welcome screen */}
              {messages.length === 1 && !isTyping && (
                <View style={styles.quickPromptsContainer}>
                  <Text variant="small" color="muted" weight="medium" style={styles.quickPromptsTitle}>
                    Try asking about:
                  </Text>
                  <View style={styles.quickPrompts}>
                    {quickPrompts.map((prompt, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.quickPrompt}
                        onPress={() => handleQuickPrompt(prompt)}
                        data-testid={`quick-prompt-${index}`}
                      >
                        <Text variant="small" color="primary" weight="medium">
                          {prompt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.historyContainer}>
              <Text variant="h4" weight="semiBold" color="foreground">
                Quick prompts
              </Text>
              <View style={styles.quickPrompts}>
                {quickPrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickPrompt}
                    onPress={() => {
                      setInputText(prompt);
                      setViewMode('chat');
                    }}
                  >
                    <Text variant="small" color="primary" weight="medium">
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text variant="h4" weight="semiBold" color="foreground" style={{ marginTop: theme.spacing.lg }}>
                Conversations
              </Text>
              {!isAuthenticated || isGuest ? (
                <Text variant="body" color="muted">
                  Sign in to view conversation history.
                </Text>
              ) : conversationsQuery.isLoading ? (
                <View style={styles.historyLoadingRow}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="body" color="muted">
                    Loading conversations...
                  </Text>
                </View>
              ) : conversationsQuery.isError ? (
                <Text variant="body" color="muted">
                  Unable to load conversations.
                </Text>
              ) : (conversationsQuery.data?.length || 0) === 0 ? (
                <Text variant="body" color="muted">
                  No saved conversations yet.
                </Text>
              ) : (
                <View style={styles.historyList}>
                  {(conversationsQuery.data || []).map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.historyItem}
                      onPress={() => {
                        if (loadConversationMutation.isPending) return;
                        setConversationId(c.id);
                        loadConversationMutation.mutate(c.id);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                          {c.title || 'Conversation'}
                        </Text>
                        <Text variant="small" color="muted">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {loadConversationMutation.isPending && conversationId === c.id ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                      ) : (
                        <FontAwesome5 name="chevron-right" size={14} color={theme.colors.textMuted} solid />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Input Area (only in chat mode) */}
        {viewMode === 'chat' && (
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom || theme.spacing.md }]}>
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={isGuest ? "Sign in to chat with Sprinthia..." : "Ask Sprinthia anything about athletics..."}
                placeholderTextColor={theme.colors.textMuted}
                multiline
                maxLength={500}
                editable={!isGuest}
                data-testid="input-message"
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  inputText.trim() && !isTyping ? styles.sendButtonActive : styles.sendButtonInactive
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isTyping || isGuest}
                data-testid="button-send-message"
              >
                {isTyping ? (
                  <ActivityIndicator size="small" color={theme.colors.textMuted} />
                ) : (
                  <FontAwesome5 
                    name="paper-plane" 
                    size={18} 
                    color={inputText.trim() ? 'white' : theme.colors.textMuted}
                    solid
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  if (message.isUser) {
    return (
      <View style={styles.userMessageContainer}>
        <View style={styles.userMessageBubble}>
          <Text variant="body" color="primary-foreground">
            {message.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiMessageContainer}>
      <View style={styles.aiAvatarSmall}>
        <FontAwesome5 name="robot" size={16} color={theme.colors.primary} solid />
      </View>
      <View style={styles.aiMessageBubble}>
        <Text variant="body" color="foreground">
          {message.text}
        </Text>
      </View>
    </View>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  aiAvatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  aiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  userMessageBubble: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.sm,
    maxWidth: '80%',
    ...theme.shadows.sm,
  },
  aiMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  aiAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
  },
  aiMessageBubble: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.borderRadius.sm,
    flex: 1,
    maxWidth: '85%',
    ...theme.shadows.sm,
  },
  typingBubble: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  typingText: {
    marginLeft: theme.spacing.sm,
  },
  quickPromptsContainer: {
    marginTop: theme.spacing.xl,
  },
  quickPromptsTitle: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  quickPrompt: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  historyContainer: {
    gap: theme.spacing.md,
  },
  historyLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  historyList: {
    gap: theme.spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    // Avoid iOS shadow perf warning on large dynamic views
    ...theme.shadows.none,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.sizes.base,
    lineHeight: 20,
    color: theme.colors.foreground,
    maxHeight: 100,
    minHeight: 44,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
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
