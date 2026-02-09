import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { ONBOARDING_STEPS } from '@/onboarding/steps';
import { getOnboardingKey, ONBOARDING_VERSION } from '@/onboarding/storage';

const Harness = () => {
  const { isReady, isActive, currentStepIndex, next, back, skip } = useOnboarding();
  return (
    <View>
      <Text testID="ready">{String(isReady)}</Text>
      <Text testID="active">{String(isActive)}</Text>
      <Text testID="step">{String(currentStepIndex)}</Text>
      <Pressable testID="next" onPress={() => void next()} />
      <Pressable testID="back" onPress={() => void back()} />
      <Pressable testID="skip" onPress={() => void skip()} />
    </View>
  );
};

const setAuthUser = (user: any, isLoading = false) => {
  const mod = require('@/contexts/AuthContext');
  (mod.useAuth as jest.Mock).mockReturnValue({
    user,
    isAuthenticated: !!user,
    isLoading,
    hasValidToken: true,
    login: jest.fn(),
    loginWithToken: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    continueAsGuest: jest.fn(),
    refreshUser: jest.fn(),
  });
};

describe('OnboardingContext', () => {
  beforeEach(async () => {
    (global as any).__mockAsyncStorage?._resetStore?.();
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('activates onboarding for a real user when no state exists', async () => {
    setAuthUser({ id: 42, username: 'u', name: 'User' }, false);

    const screen = render(
      <OnboardingProvider>
        <Harness />
      </OnboardingProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('ready').props.children).toBe('true'));
    await waitFor(() => expect(screen.getByTestId('active').props.children).toBe('true'));
    expect(screen.getByTestId('step').props.children).toBe('0');

    const raw = (global as any).__mockAsyncStorage?._getStore?.()[getOnboardingKey(42)];
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe(ONBOARDING_VERSION);
    expect(parsed.completed).toBe(false);
    expect(parsed.stepIndex).toBe(0);
  });

  it('does not activate onboarding for guest users', async () => {
    setAuthUser({ id: 'guest', username: 'guest' }, false);

    const screen = render(
      <OnboardingProvider>
        <Harness />
      </OnboardingProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('ready').props.children).toBe('true'));
    expect(screen.getByTestId('active').props.children).toBe('false');
    expect(screen.getByTestId('step').props.children).toBe('0');
  });

  it('persists stepIndex when advancing', async () => {
    setAuthUser({ id: 7, username: 'u', name: 'User' }, false);

    const screen = render(
      <OnboardingProvider>
        <Harness />
      </OnboardingProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('active').props.children).toBe('true'));

    fireEvent.press(screen.getByTestId('next'));

    await waitFor(() => expect(screen.getByTestId('step').props.children).toBe('1'));
    const raw = (global as any).__mockAsyncStorage?._getStore?.()[getOnboardingKey(7)];
    const parsed = JSON.parse(raw);
    expect(parsed.stepIndex).toBe(1);
    expect(parsed.completed).toBe(false);
  });

  it('marks completed and does not auto-activate on next mount', async () => {
    setAuthUser({ id: 9, username: 'u', name: 'User' }, false);

    const first = render(
      <OnboardingProvider>
        <Harness />
      </OnboardingProvider>,
    );

    await waitFor(() => expect(first.getByTestId('active').props.children).toBe('true'));
    fireEvent.press(first.getByTestId('skip'));
    await waitFor(() => expect(first.getByTestId('active').props.children).toBe('false'));

    const raw1 = (global as any).__mockAsyncStorage?._getStore?.()[getOnboardingKey(9)];
    expect(JSON.parse(raw1).completed).toBe(true);

    first.unmount();

    const second = render(
      <OnboardingProvider>
        <Harness />
      </OnboardingProvider>,
    );

    await waitFor(() => expect(second.getByTestId('ready').props.children).toBe('true'));
    expect(second.getByTestId('active').props.children).toBe('false');
  });

  it('restarts onboarding when version mismatches', async () => {
    setAuthUser({ id: 11, username: 'u', name: 'User' }, false);

    await AsyncStorage.setItem(
      getOnboardingKey(11),
      JSON.stringify({
        version: 0,
        completed: true,
        stepIndex: 5,
        updatedAt: '2026-02-09T00:00:00.000Z',
      }),
    );

    const screen = render(
      <OnboardingProvider>
        <Harness />
      </OnboardingProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('active').props.children).toBe('true'));
    expect(screen.getByTestId('step').props.children).toBe('0');

    const raw = (global as any).__mockAsyncStorage?._getStore?.()[getOnboardingKey(11)];
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe(ONBOARDING_VERSION);
    expect(parsed.completed).toBe(false);
    expect(parsed.stepIndex).toBe(0);
  });

  it('clamps an out-of-range stored stepIndex', async () => {
    setAuthUser({ id: 12, username: 'u', name: 'User' }, false);
    await AsyncStorage.setItem(
      getOnboardingKey(12),
      JSON.stringify({
        version: ONBOARDING_VERSION,
        completed: false,
        stepIndex: 999,
        updatedAt: '2026-02-09T00:00:00.000Z',
      }),
    );

    const screen = render(
      <OnboardingProvider>
        <Harness />
      </OnboardingProvider>,
    );

    const last = String(ONBOARDING_STEPS.length - 1);
    await waitFor(() => expect(screen.getByTestId('step').props.children).toBe(last));
  });
});

