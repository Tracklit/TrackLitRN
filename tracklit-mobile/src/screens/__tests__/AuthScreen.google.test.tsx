import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const mockPromptAsync = jest.fn();
let mockResponse: any = null;

jest.mock('@/lib/googleSignIn', () => ({
  useGoogleAuthRequest: () => ({
    request: {},
    response: mockResponse,
    promptAsync: mockPromptAsync,
  }),
  handleGoogleResponse: jest.fn(),
  googleSignInStatusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));

const { handleGoogleResponse } = require('@/lib/googleSignIn');

describe('AuthScreen (Google Expo auth-session sign-in)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = null;
    mockedUseAuth.mockReturnValue({
      user: null as any,
      isAuthenticated: false,
      isLoading: false,
      hasValidToken: false,
      login: jest.fn(),
      loginWithToken: jest.fn(() => Promise.resolve(true)),
      register: jest.fn(),
      logout: jest.fn(),
      continueAsGuest: jest.fn(),
      refreshUser: jest.fn(),
    });
  });

  it('calls promptAsync when Continue with Google is pressed', async () => {
    const Screen = require('../AuthScreen').AuthScreen;
    const { getByText } = render(<Screen />);

    fireEvent.press(getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockPromptAsync).toHaveBeenCalled();
    });
  });

  it('does not crash when Google button is pressed with no request', async () => {
    jest.resetModules();
    jest.doMock('@/lib/googleSignIn', () => ({
      useGoogleAuthRequest: () => ({
        request: null,
        response: null,
        promptAsync: mockPromptAsync,
      }),
      handleGoogleResponse: jest.fn(),
      googleSignInStatusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
    }));

    const Screen = require('../AuthScreen').AuthScreen;
    const { getByText } = render(<Screen />);

    fireEvent.press(getByText('Continue with Google'));

    expect(mockPromptAsync).not.toHaveBeenCalled();
  });
});
