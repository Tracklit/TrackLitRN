import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface TickerContextType {
  isTickerVisible: boolean;
  toggleTickerVisibility: (visible: boolean) => void;
}

const TickerContext = createContext<TickerContextType | undefined>(undefined);

export function TickerProvider({ children }: { children: ReactNode }) {
  const [isTickerVisible, setIsTickerVisible] = useState(true);

  const toggleTickerVisibility = (visible: boolean) => {
    setIsTickerVisible(visible);
    localStorage.setItem('tickerVisible', JSON.stringify(visible));
  };

  return (
    <TickerContext.Provider value={{ isTickerVisible, toggleTickerVisibility }}>
      {children}
    </TickerContext.Provider>
  );
}

export function useTicker() {
  const context = useContext(TickerContext);
  if (context === undefined) {
    throw new Error('useTicker must be used within a TickerProvider');
  }
  return context;
}