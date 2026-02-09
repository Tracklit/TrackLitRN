import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_VERSION = 1;

export type OnboardingState = {
  version: number;
  completed: boolean;
  stepIndex: number;
  updatedAt: string;
};

export const getOnboardingKey = (userId: string | number) =>
  `@tracklit_onboarding_state:${String(userId)}`;

export async function readOnboardingState(
  userId: string | number,
): Promise<OnboardingState | null> {
  try {
    const raw = await AsyncStorage.getItem(getOnboardingKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<OnboardingState> | null;
    if (!parsed || typeof parsed !== 'object') return null;

    if (typeof parsed.version !== 'number') return null;
    if (typeof parsed.completed !== 'boolean') return null;
    if (typeof parsed.stepIndex !== 'number') return null;
    if (typeof parsed.updatedAt !== 'string') return null;

    return {
      version: parsed.version,
      completed: parsed.completed,
      stepIndex: parsed.stepIndex,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function writeOnboardingState(
  userId: string | number,
  state: Omit<OnboardingState, 'updatedAt'> & { updatedAt?: string },
): Promise<void> {
  const next: OnboardingState = {
    version: state.version,
    completed: state.completed,
    stepIndex: state.stepIndex,
    updatedAt: state.updatedAt ?? new Date().toISOString(),
  };

  await AsyncStorage.setItem(getOnboardingKey(userId), JSON.stringify(next));
}

export async function clearOnboardingState(userId: string | number): Promise<void> {
  await AsyncStorage.removeItem(getOnboardingKey(userId));
}

