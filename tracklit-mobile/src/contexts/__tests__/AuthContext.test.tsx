import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.unmock('@/contexts/AuthContext');

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import {
  clearAuthStorage,
  clearStoredUser,
  debugAuthStorage,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '@/lib/tokenStorage';

jest.mock('@/lib/api', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('@/lib/tokenStorage', () => ({
  getToken: jest.fn(),
  setToken: jest.fn(),
  clearAuthStorage: jest.fn(),
  getStoredUser: jest.fn(),
  setStoredUser: jest.fn(),
  debugAuthStorage: jest.fn(),
  clearStoredUser: jest.fn(),
}));

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;
const mockedSetToken = setToken as jest.MockedFunction<typeof setToken>;
const mockedGetStoredUser = getStoredUser as jest.MockedFunction<typeof getStoredUser>;
const mockedSetStoredUser = setStoredUser as jest.MockedFunction<typeof setStoredUser>;
const mockedClearAuthStorage = clearAuthStorage as jest.MockedFunction<typeof clearAuthStorage>;
const mockedClearStoredUser = clearStoredUser as jest.MockedFunction<typeof clearStoredUser>;
const mockedDebugAuthStorage = debugAuthStorage as jest.MockedFunction<typeof debugAuthStorage>;

const Harness = () => {
  const { user, isAuthenticated, isLoading, loginWithToken } = useAuth();

  return (
    <View>
      <Text testID="loading">{String(isLoading)}</Text>
      <Text testID="auth">{String(isAuthenticated)}</Text>
      <Text testID="user">{user?.username ?? 'none'}</Text>
      <Pressable testID="loginWithToken" onPress={() => void loginWithToken('jwt-token')}>
        <Text>Login with token</Text>
      </Pressable>
    </View>
  );
};

describe('AuthContext', () => {
  let urlListener: ((event: { url: string }) => void | Promise<void>) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    urlListener = null;

    mockedSetToken.mockResolvedValue(undefined);
    mockedGetStoredUser.mockResolvedValue(null);
    mockedSetStoredUser.mockResolvedValue(undefined);
    mockedClearAuthStorage.mockResolvedValue(undefined);
    mockedClearStoredUser.mockResolvedValue(undefined);
    mockedDebugAuthStorage.mockResolvedValue(undefined);
    mockedApiRequest.mockResolvedValue({
      id: 42,
      username: 'sprinter',
      email: 'sprinter@example.com',
    });

    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    jest.spyOn(Linking, 'addEventListener').mockImplementation((type, listener) => {
      if (type === 'url') {
        urlListener = listener as (event: { url: string }) => void | Promise<void>;
      }

      return {
        remove: jest.fn(),
      } as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps a deep-link token login when the initial no-token bootstrap resolves later', async () => {
    let resolveInitialToken: ((value: string | null) => void) | null = null;

    mockedGetToken.mockImplementationOnce(
      () =>
        new Promise<string | null>((resolve) => {
          resolveInitialToken = resolve;
        }),
    );

    const screen = render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(urlListener).not.toBeNull());

    await act(async () => {
      await urlListener?.({ url: 'tracklitmobile://auth?token=jwt-token' });
    });

    expect(mockedSetToken).toHaveBeenCalledWith('jwt-token');
    expect(mockedApiRequest).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/user\?_=/),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        }),
      }),
    );

    await act(async () => {
      resolveInitialToken?.(null);
    });

    await waitFor(() => expect(screen.getByTestId('auth').props.children).toBe('true'));
    expect(screen.getByTestId('user').props.children).toBe('sprinter');
    expect(mockedClearAuthStorage).not.toHaveBeenCalled();
  });

  it('supports direct token login calls', async () => {
    mockedGetToken.mockResolvedValue(null);

    const screen = render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    fireEvent.press(screen.getByTestId('loginWithToken'));

    await waitFor(() => expect(screen.getByTestId('auth').props.children).toBe('true'));
    expect(screen.getByTestId('user').props.children).toBe('sprinter');
    expect(mockedSetToken).toHaveBeenCalledWith('jwt-token');
  });
});
