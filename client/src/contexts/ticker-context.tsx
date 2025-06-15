import React, { createContext, useContext, useState, useEffect } from 'react';

interface TickerContextType {
  isTickerVisible: boolean;
  toggleTickerVisibility: (visible: boolean) => void;
}

const TickerContext = createContext<TickerContextType | undefined>(undefined);

export function TickerProvider({ children }: { children: React.ReactNode }) {
  const [isTickerVisible, setIsTickerVisible] = useState(() => {
    const saved = localStorage.getItem('tickerVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });

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