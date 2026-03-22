import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/contexts/AuthContext';

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedOpenAuthSessionAsync =
  WebBrowser.openAuthSessionAsync as jest.MockedFunction<typeof WebBrowser.openAuthSessionAsync>;

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('AuthScreen (Google backend OAuth sign-in)', () => {
  const mockLoginWithToken = jest.fn(() => Promise.resolve(true));

  beforeEach(() => {
    jest.clearAllMocks();
    mockedOpenAuthSessionAsync.mockResolvedValue({ type: 'cancel' } as any);
    mockedUseAuth.mockReturnValue({
      user: null as any,
      isAuthenticated: false,
      isLoading: false,
      hasValidToken: false,
      login: jest.fn(),
      loginWithToken: mockLoginWithToken,
      register: jest.fn(),
      logout: jest.fn(),
      continueAsGuest: jest.fn(),
      refreshUser: jest.fn(),
    });
  });

  it('opens the backend mobile OAuth flow when Continue with Google is pressed', async () => {
    const Screen = require('../AuthScreen').AuthScreen;
    const { getByText } = render(<Screen />);

    fireEvent.press(getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockedOpenAuthSessionAsync).toHaveBeenCalledWith(
        'https://api.test.com/api/auth/google/mobile',
        'tracklitmobile://auth',
      );
    });
  });

  it('logs in with the deep-linked token after successful Google auth', async () => {
    mockedOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'tracklitmobile://auth?token=test-google-token',
    } as any);

    const Screen = require('../AuthScreen').AuthScreen;
    const { getByText } = render(<Screen />);

    fireEvent.press(getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockLoginWithToken).toHaveBeenCalledWith('test-google-token');
    });
  });
});
