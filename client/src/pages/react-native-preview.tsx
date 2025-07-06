import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
}

export const ReactNativePreview = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to TrackLit Native preview!',
      sender: 'other',
      timestamp: new Date(),
    },
    {
      id: '2',
      text: 'This shows how the React Native chat will look and behave.',
      sender: 'other',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setInputText('');
      setInputHeight(44);
      
      // Keep input focused after sending (Telegram-style)
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender === 'user';
    
    return (
      <div
        key={item.id}
        className={`my-1 p-3 rounded-2xl max-w-[80%] shadow-sm ${
          isOwn
            ? 'ml-[20%] bg-blue-500 self-end'
            : 'mr-[20%] bg-gray-700 self-start'
        }`}
      >
        <p className={`text-base leading-5 ${isOwn ? 'text-white' : 'text-white'}`}>
          {item.text}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center p-5 border-b border-gray-600">
        <ArrowLeft className="h-6 w-6 mr-3 text-white" />
        <h1 className="text-2xl font-bold text-white">React Native Preview</h1>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 pb-2 overflow-y-auto">
        <div className="flex flex-col">
          {messages.map((message) => renderMessage({ item: message }))}
        </div>
      </div>
      
      {/* Native-Style Input */}
      <div className="bg-gray-900 border-t border-gray-600 p-3 pb-4">
        <div className="flex items-end gap-3">
          <div 
            className="flex-1 mr-3 bg-gray-800 border-[1.5px] border-gray-600 rounded-[22px] px-4 py-1 justify-center"
            style={{ minHeight: inputHeight }}
          >
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="w-full bg-transparent text-white text-base leading-5 py-2 resize-none outline-none placeholder-gray-400"
              style={{ 
                height: Math.max(20, Math.min(100, inputHeight - 16)),
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              rows={1}
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck={true}
            />
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`px-5 py-3 rounded-[22px] min-w-[70px] h-11 shadow-sm transition-colors ${
              inputText.trim() 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Info Panel */}
      <div className="bg-gray-800 p-4 text-sm text-gray-300 border-t border-gray-600">
        <h3 className="font-semibold mb-2">React Native Features Preview:</h3>
        <ul className="space-y-1 text-xs">
          <li>• Native-style input with rounded corners and proper padding</li>
          <li>• Telegram-style keyboard persistence (input stays focused)</li>
          <li>• iOS/Android message bubble design with shadows</li>
          <li>• Native text input attributes (autoCorrect, autoCapitalize)</li>
          <li>• Enter key handling for quick message sending</li>
          <li>• Smooth animations and transitions</li>
        </ul>
      </div>
    </div>
  );
};