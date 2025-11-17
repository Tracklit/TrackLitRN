import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '../components/ui/Text';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import theme from '../utils/theme';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const quickPrompts = [
  "Create a 400m workout plan",
  "Analyze my sprint technique", 
  "Plan my competition schedule",
  "Recovery tips after hard training",
  "Nutrition advice for sprinters",
  "Mental preparation strategies"
];

const sampleMessages: Message[] = [
  {
    id: '1',
    text: "Hi! I'm Sprinthia, your AI athletics coach. I'm here to help you train smarter, compete better, and reach your full potential. What can I help you with today?",
    isUser: false,
    timestamp: new Date(),
  }
];

export const SprinthiaScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now().toString() + '_ai',
        text: getAIResponse(inputText),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('400m') || input.includes('workout')) {
      return "Here's a great 400m workout plan:\n\n1. Warm-up: 800m easy jog + dynamic stretches\n2. Main set: 3x300m at race pace (90s rest)\n3. Speed work: 4x100m accelerations\n4. Cool-down: 400m easy + static stretches\n\nFocus on maintaining form throughout. What's your current 400m PR?";
    }
    
    if (input.includes('technique') || input.includes('sprint')) {
      return "Great question! Here are key sprint technique points:\n\n• Drive phase: Low body angle, powerful arm drive\n• Acceleration: Gradual rise to upright position\n• Max speed: Tall posture, quick turnover\n• Relaxation: Stay loose, especially in shoulders\n\nWould you like me to analyze a specific part of your technique?";
    }
    
    if (input.includes('competition') || input.includes('schedule')) {
      return "Planning your competition schedule is crucial! Here's my approach:\n\n• Start with local meets for experience\n• Build toward your main season goal\n• Allow 7-10 days between important meets\n• Include tune-up races before championships\n\nWhat's your main competitive goal this season?";
    }
    
    if (input.includes('recovery') || input.includes('rest')) {
      return "Recovery is where you get faster! Here's what I recommend:\n\n• Active recovery: Light jogging or walking\n• Hydration: 2-3L water daily, more if training hard\n• Sleep: 7-9 hours for optimal adaptation\n• Nutrition: Protein + carbs within 30min post-workout\n• Listen to your body - rest when needed\n\nHow are you feeling after your recent training?";
    }
    
    if (input.includes('nutrition') || input.includes('food')) {
      return "Sprinter nutrition basics:\n\n• Pre-training: Light carbs 1-2 hours before\n• During long sessions: Sports drink if 90+ minutes\n• Post-workout: 3:1 carb to protein ratio\n• Daily: Lean proteins, complex carbs, healthy fats\n• Hydration: Clear/light yellow urine is the goal\n\nAny specific nutrition questions about race day or training?";
    }
    
    if (input.includes('mental') || input.includes('mindset')) {
      return "Mental game is huge in sprinting! Try these strategies:\n\n• Visualization: Run perfect races in your mind\n• Process goals: Focus on technique, not just times\n• Positive self-talk: Replace doubts with affirmations\n• Race routine: Same warm-up builds confidence\n• Breathing: Deep breaths to manage pre-race nerves\n\nWhat mental challenges are you facing in training or competition?";
    }
    
    return "That's a great question! I'm here to help with all aspects of track and field training - workouts, technique, nutrition, mental preparation, race strategy, and more. Can you tell me more about your specific goals or what you'd like to work on?";
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
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
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {messages.length === 1 && (
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
              placeholder="Ask Sprinthia anything about athletics..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={500}
              autoFocus
              data-testid="input-message"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              data-testid="button-send-message"
            >
              <FontAwesome5 
                name="paper-plane" 
                size={16} 
                color={inputText.trim() ? 'white' : theme.colors.textMuted}
                solid
              />
            </TouchableOpacity>
          </CardContent>
        </Card>
      </View>
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