import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Keyboard,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Mic, StopCircle, Volume2, VolumeX, Languages } from 'lucide-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
// import Voice from '@react-native-voice/voice';
const Voice = {
  start: async (_: any) => { Alert.alert('Feature Disabled', 'Voice input is temporarily disabled on Android.'); },
  stop: async () => { },
  destroy: async () => { },
  removeAllListeners: () => { },
  onSpeechStart: null as any,
  onSpeechEnd: null as any,
  onSpeechResults: null as any,
  onSpeechError: null as any,
};
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';

import { Text } from '../components/ui/Text';
import { InlineRefreshHeader } from '@/components/refresh/InlineRefreshHeader';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import theme from '../utils/theme';
import { FormattedSprinthiaText } from '../utils/sprinthiaFormat';
import { getBottomNavOverlayHeight, getScreenContentBottomPadding } from '../utils/layoutPadding';
import { cleanSpeechText } from '../utils/speechText';
import poweredByAria from '../assets/powered-by-aria.png';

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  text: string;
  role: Role;
  timestamp: Date;
}

interface SprinthiaConversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

interface ChatResponse {
  response: string;
  conversationId: number;
}

const suggestions = [
  'Create a sprint workout',
  'Race strategy for 400m',
  'Hamstring injury recovery',
  'Pre-race nutrition',
];

const languageOptions = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'pt-BR', label: 'Português' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
];

const WHITE = '#ffffff';

const TypingDots: React.FC = () => {
  const dots = useMemo(
    () => [
      new Animated.Value(0.3),
      new Animated.Value(0.3),
      new Animated.Value(0.3),
    ],
    [],
  );

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay: index * 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach((anim) => anim.start());
    return () => animations.forEach((anim) => anim.stop());
  }, [dots]);

  return (
    <View style={styles.typingDots}>
      {dots.map((dot, idx) => (
        <Animated.View
          key={`dot-${idx}`}
          style={[
            styles.typingDot,
            {
              opacity: dot,
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0.3, 1],
                    outputRange: [0, -2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

export const SprinthiaScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const isGuest = user?.id === 'guest';
  const isStar = user?.subscriptionTier === 'star';

  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);
  const [inlineWarning, setInlineWarning] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const micPulse = useRef(new Animated.Value(1)).current;
  const micPulseAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const isVoiceActiveRef = useRef(false);

  const remainingPrompts = isStar ? 'Unlimited' : user?.sprinthiaPrompts ?? 0;
  const isOutOfPrompts = !isStar && ((user?.sprinthiaPrompts ?? 0) <= 0);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, [messages, isThinking]);

  useEffect(() => {
    if (!isListening) {
      micPulseAnimation.current?.stop();
      micPulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, {
          toValue: 1.08,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(micPulse, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    micPulseAnimation.current = animation;
    animation.start();

    return () => {
      animation.stop();
      micPulse.setValue(1);
    };
  }, [isListening, micPulse]);

  const startVoiceInput = useCallback(async () => {
    if (isVoiceActiveRef.current) return;
    try {
      isVoiceActiveRef.current = true;
      setIsListening(true);
      // await Voice.start(selectedLanguage);
      Alert.alert('Voice Disabled', 'Voice input is temporarily unavailable.');
      setIsListening(false);
      isVoiceActiveRef.current = false;
    } catch (error: any) {
      const message = error?.message?.toLowerCase?.() || '';
      if (message.includes('already started')) {
        setIsListening(true);
        isVoiceActiveRef.current = true;
        return;
      }
      console.error('Voice start error:', error);
      isVoiceActiveRef.current = false;
      setIsListening(false);
      Alert.alert('Voice input failed', error?.message || 'Unable to start voice input.');
    }
  }, [selectedLanguage]);

  const stopVoiceInput = useCallback(async () => {
    if (!isVoiceActiveRef.current) {
      setIsListening(false);
      return;
    }
    try {
      await Voice.stop();
    } catch (error: any) {
      console.error('Voice stop error:', error);
    } finally {
      isVoiceActiveRef.current = false;
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    Voice.onSpeechStart = () => {
      isVoiceActiveRef.current = true;
      setIsListening(true);
    };
    Voice.onSpeechEnd = () => {
      // Do not flip UI off; user explicitly stops recording.
    };
    Voice.onSpeechResults = (event: any) => {
      const transcript = event.value?.[0];
      if (transcript) {
        setInputText(transcript);
      }
      // Keep listening until the user explicitly stops.
    };
    Voice.onSpeechError = (event: any) => {
      const message = event.error?.message || '';
      console.error('Speech recognition error:', event.error);
      if (message.toLowerCase().includes('already started')) {
        isVoiceActiveRef.current = true;
        setIsListening(true);
        return;
      }
      isVoiceActiveRef.current = false;
      setIsListening(false);
      Alert.alert('Voice input failed', message || 'Unable to capture voice input.');
    };

    return () => {
      isVoiceActiveRef.current = false;
      Voice.destroy().then(Voice.removeAllListeners).catch(() => undefined);
      Speech.stop();
    };
  }, [stopVoiceInput]);

  const conversationsQuery = useQuery({
    queryKey: ['sprinthia-conversations'],
    queryFn: () => apiRequest<SprinthiaConversation[]>('/api/sprinthia/conversations'),
    enabled: isAuthenticated && !isGuest,
  });

  const loadConversationMutation = useMutation({
    mutationFn: async (id: number) =>
      apiRequest<Array<{ id: number; role: Role; content: string; createdAt: string }>>(
        `/api/sprinthia/conversations/${id}/messages`,
      ),
    onSuccess: (items, id) => {
      const mapped: Message[] = items.map((m) => ({
        id: String(m.id),
        text: m.content,
        role: m.role,
        timestamp: new Date(m.createdAt),
      }));
      setMessages(mapped);
      setConversationId(id);
      setShowHistory(false);
      setIsThinking(false);
      setInlineWarning(null);
    },
    onError: () => {
      Alert.alert('Unable to load conversation', 'Please try again.');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const payload: { message: string; conversationId?: number } = {
        message,
        conversationId: conversationId || undefined,
      };

      return apiRequest<ChatResponse>('/api/sprinthia/chat', {
        method: 'POST',
        data: payload,
      });
    },
    onSuccess: async (data) => {
      const aiMessage: Message = {
        id: `${Date.now()}-ai`,
        text: data.response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setConversationId(data.conversationId);
      setIsThinking(false);
      setInlineWarning(null);
      queryClient.invalidateQueries({ queryKey: ['sprinthia-conversations'] });

      if (!isStar) {
        // Refresh user to keep Remaining badge accurate
        refreshUser?.();
      }
    },
    onError: (error: Error & { status?: number }) => {
      console.error('Sprinthia API error:', error);
      setIsThinking(false);

      const lowerMessage = error.message?.toLowerCase?.() || '';
      const isUnauthorized = error.status === 401 || lowerMessage.includes('unauthorized');

      if (isUnauthorized) {
        setInlineWarning('Session expired. Please sign in again to keep chatting with Sprinthia.');
        refreshUser?.();
        Alert.alert('Sign in required', 'Your session expired. Please sign in again to continue.');
        return;
      }

      if (lowerMessage.includes('prompt')) {
        setInlineWarning('No prompts remaining. Purchase more to continue using Sprinthia.');
        return;
      }

      const fallback: Message = {
        id: `${Date.now()}-error`,
        text: "I'm sorry, I couldn't process your request right now. Please try again shortly.",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallback]);
      Alert.alert('Connection issue', error.message || 'Failed to send message to Sprinthia.');
    },
  });

  const handleSendMessage = () => {
    if (!inputText.trim() || isThinking) return;

    if (!isAuthenticated || isGuest) {
      Alert.alert('Sign In Required', 'Please sign in to chat with Sprinthia AI.');
      return;
    }

    if (isOutOfPrompts) {
      setInlineWarning('No prompts remaining. Purchase more to continue using Sprinthia.');
      return;
    }

    const messageText = inputText.trim();
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      text: messageText,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);
    setInlineWarning(null);
    setInputText('');
    sendMessageMutation.mutate(messageText);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
    Keyboard.dismiss();
  };

  const speakText = useCallback(
    (text: string) => {
      const cleaned = cleanSpeechText(text);
      if (!cleaned.trim()) return;
      Speech.stop();
      setIsSpeaking(true);
      Speech.speak(cleaned, {
        language: selectedLanguage,
        rate: 1.0,
        pitch: 1.0,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [selectedLanguage]
  );

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
    setInlineWarning(null);
  };

  useEffect(() => {
    if (!autoSpeak || isThinking || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      speakText(lastMessage.text);
    }
  }, [autoSpeak, isThinking, messages, speakText]);

  const handleCopyMessage = async (messageId: string, text: string) => {
    try {
      if (!Clipboard) {
        Alert.alert('Copy unavailable', 'Clipboard module is not installed in this build.');
        return;
      }
      await Clipboard.setStringAsync(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      Alert.alert('Copy failed', 'Could not copy response to clipboard.');
    }
  };

  const handleSaveProgram = async (messageId: string, content: string) => {
    if (!isAuthenticated || isGuest) {
      Alert.alert('Sign In Required', 'Please sign in to save programs.');
      return;
    }

    setSavingMessageId(messageId);
    try {
      await apiRequest('/api/programs', {
        method: 'POST',
        data: {
          title: 'Training Plan from Sprinthia',
          description: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
          category: 'training',
          level: 'intermediate',
          duration: 1,
          isTextBased: true,
          textContent: content,
        },
      });
      setTimeout(() => setSavingMessageId(null), 1500);
    } catch (err: any) {
      console.error('Save program error:', err);
      setSavingMessageId(null);
      Alert.alert('Unable to save', err?.message || 'Failed to save training plan.');
    }
  };

  const formattedRemaining =
    typeof remainingPrompts === 'number' ? `${remainingPrompts} prompts` : remainingPrompts;

  const showGreeting = messages.length === 0 && !isThinking;

  const { isRefreshing, onRefresh } = usePullToRefresh(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sprinthia-conversations'] }),
      refreshUser(),
    ]);
  });

  return (
    <View
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header (mobile-first, 2 rows) */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTopRow}>
            <View style={styles.titleGroup}>
              <Image source={poweredByAria} style={styles.poweredBy} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.headerBottomRow}>
            <Text color="muted" style={styles.subtitle} numberOfLines={1}>
              Your AI track and field coach • Always available
            </Text>

            <View style={styles.headerControls}>
              <TouchableOpacity
                style={[
                  styles.iconToggle,
                  autoSpeak ? styles.autoSpeakActive : styles.autoSpeakInactive,
                ]}
                onPress={() => setAutoSpeak((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={autoSpeak ? 'Disable auto speak' : 'Enable auto speak'}
              >
                {autoSpeak ? (
                  <Volume2 size={16} color={WHITE} />
                ) : (
                  <VolumeX size={16} color={WHITE} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconToggle, styles.languageButton]}
                onPress={() => setShowLanguageMenu(true)}
                accessibilityRole="button"
                accessibilityLabel="Change language"
              >
                <Languages size={16} color={WHITE} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => setShowHistory(true)}
                accessibilityRole="button"
                accessibilityLabel="Open conversation history"
              >
                <FontAwesome5 name="history" size={14} color="#FF7A00" />
                <Text weight="semiBold" color="foreground" style={styles.historyLabel}>
                  History
                </Text>
              </TouchableOpacity>
              <View style={styles.remainingBadge}>
                <Text color="muted" style={styles.remainingLabel}>
                  Remaining
                </Text>
                <Text weight="semiBold" color="foreground" numberOfLines={1} style={styles.remainingValue}>
                  {formattedRemaining}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Modal
          visible={showLanguageMenu}
          animationType="fade"
          transparent
          onRequestClose={() => setShowLanguageMenu(false)}
        >
          <Pressable style={styles.languageOverlay} onPress={() => setShowLanguageMenu(false)}>
            <Pressable style={[styles.languageMenu, { marginTop: insets.top + 80 }]} onPress={() => undefined}>
              {languageOptions.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === lang.code && styles.languageOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedLanguage(lang.code);
                    setShowLanguageMenu(false);
                  }}
                >
                  <Text
                    weight={selectedLanguage === lang.code ? 'semiBold' : 'regular'}
                    color="foreground"
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        {/* History Panel */}
        <Modal
          visible={showHistory}
          animationType="slide"
          transparent
          onRequestClose={() => setShowHistory(false)}
        >
          <View style={styles.historyOverlay}>
            <View style={[styles.historyPanel, { paddingTop: insets.top + theme.spacing.lg }]}>
              <View style={styles.historyHeader}>
                <Text weight="semiBold" color="foreground" style={styles.historyTitle}>
                  Conversation History
                </Text>
                <View style={styles.historyHeaderActions}>
                  <TouchableOpacity style={styles.newButton} onPress={handleNewConversation}>
                    <FontAwesome5 name="plus" size={14} color="#FF7A00" />
                    <Text weight="semiBold" color="foreground" style={{ color: '#FF7A00' }}>
                      New
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowHistory(false)}>
                    <FontAwesome5 name="times" size={16} color={theme.colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.historyContent}>
                {!isAuthenticated || isGuest ? (
                  <Text color="muted">Sign in to view conversation history.</Text>
                ) : conversationsQuery.isLoading ? (
                  <Text color="muted">Loading conversations...</Text>
                ) : conversationsQuery.isError ? (
                  <Text color="muted">Unable to load conversations.</Text>
                ) : (conversationsQuery.data?.length || 0) === 0 ? (
                  <Text color="muted">No conversations yet.</Text>
                ) : (
                  (conversationsQuery.data || []).map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.historyRow,
                        conversationId === c.id && styles.historyRowActive,
                      ]}
                      onPress={() => {
                        if (loadConversationMutation.isPending) return;
                        loadConversationMutation.mutate(c.id);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text weight="semiBold" color="foreground" numberOfLines={1}>
                          {c.title || 'Conversation'}
                        </Text>
                        <Text color="muted" style={styles.historyDate}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <FontAwesome5
                        name="chevron-right"
                        size={14}
                        color={theme.colors.textMuted}
                      />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            {
              paddingBottom: getScreenContentBottomPadding(insets.bottom, {
                includeBottomNav: true,
                extra: 80, // space for composer above tab bar
              }),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              tintColor="#fff"
              refreshing={isRefreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <InlineRefreshHeader visible={isRefreshing} />
          {showGreeting && (
            <View style={styles.greetingCard}>
              <Text weight="semiBold" color="foreground" style={styles.greetingTitle}>
                Hi {user?.name?.split(' ')[0] || 'there'}, how can I help you today?
              </Text>
              <Text color="muted" style={styles.greetingSubtitle}>
                Ask me about training plans, race preparation, injury rehabilitation, or nutrition advice.
              </Text>
              <View style={styles.suggestionsGrid}>
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestionGridItem}
                    onPress={() => handleQuickPrompt(s)}
                    activeOpacity={0.85}
                  >
                    <Text color="foreground" weight="semiBold" style={styles.suggestionText} numberOfLines={2}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((message) => (
            <View key={message.id} style={styles.messageBlock}>
              <Text
                color="muted"
                weight="semiBold"
                style={message.role === 'user' ? styles.messageLabelUser : styles.messageLabelAI}
              >
                {message.role === 'user' ? 'You' : 'Sprinthia'}
              </Text>
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <FormattedSprinthiaText content={message.text} />
                <View style={styles.messageFooter}>
                  <Text color="muted" style={styles.messageTime}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {message.role === 'assistant' && (
                    <View style={styles.messageActions}>
                      <TouchableOpacity
                        onPress={() => (isSpeaking ? stopSpeaking() : speakText(message.text))}
                        style={styles.actionButton}
                      >
                        {isSpeaking ? (
                          <VolumeX size={14} color={theme.colors.primary} />
                        ) : (
                          <Volume2 size={14} color={theme.colors.foreground} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleCopyMessage(message.id, message.text)}
                        style={styles.actionButton}
                      >
                        <FontAwesome5
                          name={copiedMessageId === message.id ? 'check' : 'copy'}
                          size={14}
                          color={copiedMessageId === message.id ? theme.colors.success : theme.colors.foreground}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleSaveProgram(message.id, message.text)}
                        style={styles.actionButton}
                      >
                        <FontAwesome5
                          name={savingMessageId === message.id ? 'check' : 'save'}
                          size={14}
                          color={savingMessageId === message.id ? theme.colors.success : theme.colors.foreground}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}

          {isThinking && (
            <View style={styles.messageBlock}>
              <Text color="muted" weight="semiBold" style={styles.messageLabelAI}>
                Sprinthia
              </Text>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.typingRow}>
                  <Text color="muted" style={styles.typingLabel}>
                    Thinking
                  </Text>
                  <TypingDots />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View
          style={[
            styles.inputWrapper,
            { paddingBottom: getBottomNavOverlayHeight(insets.bottom) + 12 },
          ]}
        >
          <View style={styles.inputRow}>
            <Animated.View style={{ transform: [{ scale: micPulse }] }}>
              <TouchableOpacity
                style={[
                  styles.micButton,
                  isListening ? styles.micButtonActive : styles.micButtonInactive,
                ]}
                onPress={isListening ? stopVoiceInput : startVoiceInput}
                disabled={isGuest || isOutOfPrompts || (!isListening && isThinking)}
                accessibilityRole="button"
                accessibilityLabel={isListening ? 'Stop recording' : 'Start recording'}
                accessibilityHint={isListening ? 'Tap to stop and use the transcription' : 'Tap to start recording'}
              >
                {isListening ? <StopCircle size={20} color={WHITE} /> : <Mic size={18} color={WHITE} />}
              </TouchableOpacity>
            </Animated.View>
            <View style={styles.inputShell}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  isListening
                    ? 'Listening... tap mic to stop'
                    : isGuest
                      ? 'Sign in to chat with Sprinthia...'
                      : 'Ask Sprinthia about training, races, rehabilitation, or nutrition...'
                }
                placeholderTextColor={theme.colors.textMuted}
                multiline
                maxLength={800}
                editable={!isGuest && !isOutOfPrompts && !isListening && !isThinking}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  inputText.trim() && !isThinking && !isOutOfPrompts && !isListening
                    ? styles.sendButtonActive
                    : styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isThinking || isOutOfPrompts || isGuest || isListening}
              >
                <FontAwesome5
                  name="paper-plane"
                  size={16}
                  color={
                    inputText.trim() && !isThinking && !isOutOfPrompts && !isListening
                      ? 'white'
                      : theme.colors.textMuted
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
          {(inlineWarning || isOutOfPrompts) && (
            <Text color="muted" style={styles.promptWarning}>
              {inlineWarning ||
                "You've used all your prompts. Upgrade to Pro or Star to continue using Sprinthia."}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F14',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,122,0,0.15)',
    backgroundColor: '#0E0F14',
    gap: theme.spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  drawerButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  titleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  titleText: {
    fontSize: 20,
    lineHeight: 24,
    flex: 1,
  },
  poweredBy: {
    width: 78,
    height: 22,
  },
  subtitle: {
    marginTop: 2,
    flex: 1,
    minWidth: 180,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  iconToggle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  autoSpeakActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  autoSpeakInactive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  languageButton: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 9,
    backgroundColor: 'rgba(255,122,0,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
  },
  historyLabel: {
    color: '#FF7A00',
    fontSize: 14,
  },
  remainingBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    height: 44,
    paddingHorizontal: 12,
    paddingVertical: 0,
    paddingBottom: 3,
    borderRadius: 9,
    minWidth: 110,
    justifyContent: 'center',
  },
  remainingLabel: {
    fontSize: 11,
    marginBottom: 0,
    lineHeight: 13,
  },
  remainingValue: {
    lineHeight: 18,
    marginTop: -1,
  },
  languageOverlay: {
    flex: 1,
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingRight: theme.spacing.lg,
  },
  languageMenu: {
    width: 200,
    backgroundColor: '#1C1F2B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  languageOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  languageOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  historyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  historyPanel: {
    backgroundColor: '#0E0F14',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    minHeight: '65%',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  historyTitle: {
    fontSize: 18,
  },
  historyHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,122,0,0.12)',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
  },
  historyContent: {
    gap: theme.spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#1C1F2B',
  },
  historyRowActive: {
    borderColor: 'rgba(255,122,0,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  historyDate: {
    marginTop: 4,
    fontSize: 12,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  greetingCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#1C1F2B',
    borderRadius: 16,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  greetingTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  greetingSubtitle: {
    lineHeight: 20,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  suggestionGridItem: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#1C1F2B',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
  suggestionChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#1C1F2B',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionText: {
    fontSize: 14,
  },
  messageBlock: {
    gap: 6,
  },
  messageLabelUser: {
    color: WHITE,
  },
  messageLabelAI: {
    color: WHITE,
  },
  messageBubble: {
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  userBubble: {
    backgroundColor: 'rgba(255,122,0,0.08)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderLeftColor: '#FF7A00',
  },
  aiBubble: {
    backgroundColor: '#1C1F2B',
    borderColor: 'rgba(255,255,255,0.06)',
    borderLeftColor: 'rgba(255,255,255,0.2)',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageTime: {
    fontSize: 12,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    padding: 6,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typingLabel: {
    fontSize: 14,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: WHITE,
  },
  inputWrapper: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(14,15,20,0.95)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  micButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  micButtonInactive: {
    backgroundColor: 'rgba(255,122,0,0.12)',
    borderColor: 'rgba(255,122,0,0.25)',
  },
  inputShell: {
    position: 'relative',
    backgroundColor: '#1C1F2B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingRight: 56,
    paddingLeft: 14,
    paddingVertical: 6,
    flex: 1,
  },
  textInput: {
    minHeight: 48,
    maxHeight: 140,
    color: theme.colors.foreground,
    fontSize: 15,
    lineHeight: 22,
  },
  sendButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: 'rgba(255,122,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.4)',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  promptWarning: {
    marginTop: 8,
    fontSize: 13,
  },
});
