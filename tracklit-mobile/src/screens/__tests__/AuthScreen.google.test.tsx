import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('@/lib/googleSignIn', () => ({
  nativeGoogleSignIn: jest.fn(),
  googleSignInStatusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));

const { nativeGoogleSignIn } = require('@/lib/googleSignIn');

describe('AuthScreen (Google native sign-in)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('exchanges native Google idToken for a JWT and logs in', async () => {
    nativeGoogleSignIn.mockResolvedValue({ idToken: 'google-id-token' });
    mockedApiRequest.mockResolvedValue({ token: 'jwt-token' } as any);

    const Screen = require('../AuthScreen').AuthScreen;
    const { getByText } = render(<Screen />);

    fireEvent.press(getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledWith(
        '/api/auth/google/mobile',
        expect.objectContaining({
          method: 'POST',
          data: { idToken: 'google-id-token' },
          skipAuth: true,
        }),
      );
    });

    const auth = mockedUseAuth.mock.results[0].value;
    await waitFor(() => {
      expect(auth.loginWithToken).toHaveBeenCalledWith('jwt-token');
    });
  });
});

