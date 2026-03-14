import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/contexts/AuthContext';

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockPromptAsync = jest.fn();
let mockResponse: any = null;
let mockGoogleRequest: any = {};

jest.mock('@/lib/googleSignIn', () => ({
  useGoogleAuthRequest: () => ({
    request: mockGoogleRequest,
    response: mockResponse,
    promptAsync: mockPromptAsync,
  }),
  handleGoogleResponse: jest.fn(),
  googleSignInStatusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));

describe('AuthScreen (Google Expo auth-session sign-in)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = null;
    mockGoogleRequest = {};
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
      setUserAndPersist: jest.fn(),
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

  it('does not call promptAsync when the Google request is unavailable', () => {
    mockGoogleRequest = null;
    const Screen = require('../AuthScreen').AuthScreen;
    const { getByText } = render(<Screen />);

    fireEvent.press(getByText('Continue with Google'));

    expect(mockPromptAsync).not.toHaveBeenCalled();
  });
});
