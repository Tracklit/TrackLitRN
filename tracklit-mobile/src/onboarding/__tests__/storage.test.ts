import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ONBOARDING_VERSION,
  getOnboardingKey,
  readOnboardingState,
  writeOnboardingState,
} from '@/onboarding/storage';

describe('onboarding storage', () => {
  beforeEach(() => {
    (global as any).__mockAsyncStorage?._resetStore?.();
    jest.clearAllMocks();
  });

  it('writes and reads onboarding state', async () => {
    await writeOnboardingState(123, {
      version: ONBOARDING_VERSION,
      completed: false,
      stepIndex: 2,
      updatedAt: '2026-02-09T00:00:00.000Z',
    });

    const state = await readOnboardingState(123);
    expect(state).toEqual({
      version: ONBOARDING_VERSION,
      completed: false,
      stepIndex: 2,
      updatedAt: '2026-02-09T00:00:00.000Z',
    });
  });

  it('returns null for invalid json', async () => {
    await AsyncStorage.setItem(getOnboardingKey('u1'), '{not json');
    const state = await readOnboardingState('u1');
    expect(state).toBeNull();
  });

  it('returns null for missing fields', async () => {
    await AsyncStorage.setItem(
      getOnboardingKey('u2'),
      JSON.stringify({ version: 1, completed: true }),
    );
    const state = await readOnboardingState('u2');
    expect(state).toBeNull();
  });
});

