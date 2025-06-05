import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';

interface StagedNavigationState {
  isTransitioning: boolean;
  targetRoute: string | null;
  currentStage: 'idle' | 'starting' | 'loading_new' | 'completing';
}

export function useStagedNavigation() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<StagedNavigationState>({
    isTransitioning: false,
    targetRoute: null,
    currentStage: 'idle'
  });

  const navigateWithStaging = useCallback((href: string) => {
    if (state.isTransitioning) return;

    setState({
      isTransitioning: true,
      targetRoute: href,
      currentStage: 'starting'
    });

    // Stage 1: Start transition (0-90%)
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentStage: 'loading_new'
      }));
      
      // Load new page at 90% completion
      setLocation(href);
    }, 90); // 90ms = 90% of 100ms transition

    // Stage 2: Complete transition (90-100%)
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentStage: 'completing'
      }));
    }, 100);

    // Stage 3: Reset state
    setTimeout(() => {
      setState({
        isTransitioning: false,
        targetRoute: null,
        currentStage: 'idle'
      });
    }, 110);
  }, [state.isTransitioning, setLocation]);

  return {
    navigateWithStaging,
    transitionState: state
  };
}