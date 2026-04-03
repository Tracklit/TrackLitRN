import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { ONBOARDING_STEPS, type OnboardingStep } from '@/onboarding/steps';
import {
  ONBOARDING_VERSION,
  readOnboardingState,
  writeOnboardingState,
} from '@/onboarding/storage';

type OnboardingContextType = {
  isReady: boolean;
  isActive: boolean;
  currentStepIndex: number;
  steps: OnboardingStep[];
  start: () => Promise<void>;
  skip: () => Promise<void>;
  next: () => Promise<void>;
  back: () => Promise<void>;
  complete: () => Promise<void>;
  resetAndStart: () => Promise<void>;
  goToStep: (index: number) => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const steps = ONBOARDING_STEPS;

  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const persist = useCallback(
    async (userId: string, next: { completed: boolean; stepIndex: number }) => {
      await writeOnboardingState(userId, {
        version: ONBOARDING_VERSION,
        completed: next.completed,
        stepIndex: next.stepIndex,
      });
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (authLoading) {
        setIsReady(false);
        return;
      }

      const rawUserId = user?.id;
      if (!rawUserId || rawUserId === 'guest') {
        setActiveUserId(null);
        setIsActive(false);
        setCurrentStepIndex(0);
        setIsReady(true);
        return;
      }

      const userId = String(rawUserId);
      setActiveUserId(userId);

      const stored = await readOnboardingState(userId);
      if (cancelled) return;

      // TEMP: always show onboarding for testing — remove before release
      const hasCompleted = false;
      void stored;

      if (hasCompleted) {
        setIsActive(false);
        setCurrentStepIndex(clamp(stored?.stepIndex ?? 0, 0, steps.length - 1));
        setIsReady(true);
        return;
      }

      // If the version changed, restart at the beginning.
      const baseIndex =
        stored?.version === ONBOARDING_VERSION ? (stored?.stepIndex ?? 0) : 0;
      const stepIndex = clamp(baseIndex, 0, steps.length - 1);

      setCurrentStepIndex(stepIndex);
      setIsActive(true);
      setIsReady(true);

      // Ensure we have an up-to-date state persisted so onboarding resumes cleanly.
      await persist(userId, { completed: false, stepIndex });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, steps.length, persist]);

  const start = useCallback(async () => {
    if (!activeUserId) return;
    const stepIndex = 0;
    setIsActive(true);
    setCurrentStepIndex(stepIndex);
    await persist(activeUserId, { completed: false, stepIndex });
  }, [activeUserId, persist]);

  const complete = useCallback(async () => {
    if (!activeUserId) {
      setIsActive(false);
      return;
    }
    setIsActive(false);
    await persist(activeUserId, { completed: true, stepIndex: currentStepIndex });
  }, [activeUserId, currentStepIndex, persist]);

  const skip = useCallback(async () => {
    await complete();
  }, [complete]);

  const next = useCallback(async () => {
    if (!activeUserId) return;
    if (currentStepIndex >= steps.length - 1) {
      await complete();
      return;
    }
    const stepIndex = clamp(currentStepIndex + 1, 0, steps.length - 1);
    setCurrentStepIndex(stepIndex);
    await persist(activeUserId, { completed: false, stepIndex });
  }, [activeUserId, complete, currentStepIndex, persist, steps.length]);

  const back = useCallback(async () => {
    if (!activeUserId) return;
    const stepIndex = clamp(currentStepIndex - 1, 0, steps.length - 1);
    setCurrentStepIndex(stepIndex);
    await persist(activeUserId, { completed: false, stepIndex });
  }, [activeUserId, currentStepIndex, persist, steps.length]);

  const resetAndStart = useCallback(async () => {
    if (!activeUserId) return;
    const stepIndex = 0;
    setIsActive(true);
    setCurrentStepIndex(stepIndex);
    await persist(activeUserId, { completed: false, stepIndex });
  }, [activeUserId, persist]);

  const goToStep = useCallback(async (index: number) => {
    if (!activeUserId) return;
    const stepIndex = clamp(index, 0, steps.length - 1);
    setCurrentStepIndex(stepIndex);
    await persist(activeUserId, { completed: false, stepIndex });
  }, [activeUserId, persist, steps.length]);

  const value = useMemo<OnboardingContextType>(
    () => ({
      isReady,
      isActive,
      currentStepIndex,
      steps,
      start,
      skip,
      next,
      back,
      complete,
      resetAndStart,
      goToStep,
    }),
    [
      isReady,
      isActive,
      currentStepIndex,
      steps,
      start,
      skip,
      next,
      back,
      complete,
      resetAndStart,
      goToStep,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = (): OnboardingContextType => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
};

