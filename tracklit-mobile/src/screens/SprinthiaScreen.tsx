import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Text } from '../components/ui/Text';
import { Card, CardContent } from '../components/ui/Card';
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
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);

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
            {/* New Conversation Button */}
            {messages.length > 1 && (
              <TouchableOpacity 
                style={styles.newChatButton}
                onPress={handleNewConversation}
              >
                <FontAwesome5 name="plus" size={16} color={theme.colors.primary} solid />
              </TouchableOpacity>
            )}
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
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom || theme.spacing.md }]}>
          <Card style={styles.inputCard}>
            <CardContent style={styles.inputContent}>
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
                    size={16} 
                    color={inputText.trim() ? 'white' : theme.colors.textMuted}
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
  },
  aiAvatarContainer: {
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
