import { createContext, useContext, useState, ReactNode } from 'react';

interface KeyboardContextType {
  isKeyboardVisible: boolean;
  setKeyboardVisible: (visible: boolean) => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const setKeyboardVisible = (visible: boolean) => {
    setIsKeyboardVisible(visible);
  };

  return (
    <KeyboardContext.Provider value={{ isKeyboardVisible, setKeyboardVisible }}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (context === undefined) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}