import React from 'react';
import { Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/contexts/OnboardingContext', () => ({
  useOnboarding: jest.fn(),
}));

import { OnboardingOverlay } from '@/onboarding/OnboardingOverlay';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { apiRequest } from '@/lib/api';

const withClient = (ui: React.ReactElement) => {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
};

describe('OnboardingOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the current step title and body', () => {
    (useOnboarding as jest.Mock).mockReturnValue({
      isReady: true,
      isActive: true,
      currentStepIndex: 0,
      steps: [
        {
          id: 'welcome',
          mode: 'intro',
          title: 'Welcome',
          body: <Text>Body</Text>,
        },
      ],
      next: jest.fn(),
      back: jest.fn(),
      skip: jest.fn(),
      complete: jest.fn(),
    });

    const screen = render(
      withClient(<OnboardingOverlay navigationRef={{ isReady: () => true }} />),
    );

    expect(screen.getByText('Welcome')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('wires Back / Skip / Next buttons to context actions', () => {
    const next = jest.fn();
    const back = jest.fn();
    const skip = jest.fn();

    (useOnboarding as jest.Mock).mockReturnValue({
      isReady: true,
      isActive: true,
      currentStepIndex: 1,
      steps: [
        { id: 's0', mode: 'intro', title: 'S0', body: <Text /> },
        { id: 's1', mode: 'intro', title: 'S1', body: <Text /> },
        { id: 's2', mode: 'intro', title: 'S2', body: <Text /> },
      ],
      next,
      back,
      skip,
      complete: jest.fn(),
    });

    const screen = render(
      withClient(<OnboardingOverlay navigationRef={{ isReady: () => true }} />),
    );

    fireEvent.press(screen.getByTestId('onboarding-back'));
    fireEvent.press(screen.getByTestId('onboarding-skip'));
    fireEvent.press(screen.getByTestId('onboarding-next'));

    expect(back).toHaveBeenCalledTimes(1);
    expect(skip).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('claims welcome spikes and shows claimed state', async () => {
    const refreshUser = jest.fn();
    const { useAuth } = require('@/contexts/AuthContext');
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1 },
      isAuthenticated: true,
      isLoading: false,
      hasValidToken: true,
      login: jest.fn(),
      loginWithToken: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      continueAsGuest: jest.fn(),
      refreshUser,
    });

    (apiRequest as jest.Mock).mockResolvedValue({ success: true, bonus: 100 });

    (useOnboarding as jest.Mock).mockReturnValue({
      isReady: true,
      isActive: true,
      currentStepIndex: 0,
      steps: [
        {
          id: 'spikes',
          mode: 'intro',
          title: 'Meet Spikes',
          body: <Text>Spikes</Text>,
          showClaimSpikes: true,
        },
      ],
      next: jest.fn(),
      back: jest.fn(),
      skip: jest.fn(),
      complete: jest.fn(),
    });

    const screen = render(
      withClient(<OnboardingOverlay navigationRef={{ isReady: () => true }} />),
    );

    fireEvent.press(screen.getByTestId('onboarding-claim'));

    await waitFor(() => expect(screen.getByTestId('onboarding-claimed')).toBeTruthy());
    expect(apiRequest).toHaveBeenCalledWith('/api/claim-welcome-spikes', { method: 'POST' });
    expect(refreshUser).toHaveBeenCalled();
  });
});

