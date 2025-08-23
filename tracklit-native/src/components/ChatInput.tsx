import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Platform, 
  Keyboard,
  Animated,
  Easing 
} from 'react-native';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  initialValue?: string;
  onTextChange?: (text: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  placeholder = 'Type a message...', 
  maxLength = 1000,
  initialValue = '',
  onTextChange,
  disabled = false
}) => {
  const [inputText, setInputText] = useState(initialValue);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [inputHeight, setInputHeight] = useState(44);
  const inputRef = useRef<TextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setInputText(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        setKeyboardHeight(0);
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, [animatedValue]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
      setInputHeight(44);
      // Keep keyboard open and input focused (Telegram behavior)
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    onTextChange?.(text);
  };

  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.max(44, Math.min(120, event.nativeEvent.contentSize.height + 20));
    setInputHeight(newHeight);
  };

  const animatedBottomMargin = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Platform.OS === 'ios' ? keyboardHeight - 34 : 0],
  });

  const animatedInputOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          marginBottom: animatedBottomMargin,
          opacity: animatedInputOpacity,
        }
      ]}
    >
      <View style={styles.inputContainer}>
        <View style={[styles.textInputContainer, { height: inputHeight }]}>
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { height: inputHeight - 8 }]}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={maxLength}
            onContentSizeChange={handleContentSizeChange}
            textAlignVertical="top"
            returnKeyType="send"
            blurOnSubmit={false}
            enablesReturnKeyAutomatically={true}
            onSubmitEditing={handleSend}
            autoCorrect={true}
            spellCheck={true}
            keyboardType="default"
            autoCapitalize="sentences"
            underlineColorAndroid="transparent"
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
          ]} 
          onPress={handleSend}
          disabled={!inputText.trim() || disabled}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.sendButtonText, 
              inputText.trim() ? styles.sendButtonTextActive : styles.sendButtonTextInactive
            ]}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
    alignItems: 'flex-end',
  },
  textInputContainer: {
    flex: 1,
    marginRight: 12,
    backgroundColor: '#1f2937',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  textInput: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: 8,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    minWidth: 70,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  sendButtonInactive: {
    backgroundColor: '#374151',
  },
  sendButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  sendButtonTextActive: {
    color: '#ffffff',
  },
  sendButtonTextInactive: {
    color: '#6b7280',
  },
});

export default ChatInput;