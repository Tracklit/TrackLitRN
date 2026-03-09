import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = React.useRef(createClient()).current;
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseAuth.mockReturnValue({
    user: { id: 1, name: 'Test', username: 'test', isCoach: true },
    isAuthenticated: true,
    isLoading: false,
    hasValidToken: true,
    login: jest.fn(),
    loginWithToken: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    continueAsGuest: jest.fn(),
    refreshUser: jest.fn(),
    setUserAndPersist: jest.fn(),
  });
});

function loadProgramCreateScreen() {
  return require('../ProgramCreateScreen').ProgramCreateScreen;
}

describe('ProgramCreateScreen', () => {
  it('shows the current creation methods', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    expect(getByText('Import / Upload')).toBeTruthy();
    expect(getByText('Program Builder')).toBeTruthy();
    expect(getByText('Text Based')).toBeTruthy();
    expect(getByText('Sprinthia AI')).toBeTruthy();
  });

  it('shows header and page title', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    expect(getByText('Create Program')).toBeTruthy();
    expect(getByText('Create New Program')).toBeTruthy();
  });

  it('shows the builder form after selecting Program Builder', () => {
    const Screen = loadProgramCreateScreen();
    const { getAllByText, getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));

    expect(getByText('Build Custom Program')).toBeTruthy();
    expect(getByPlaceholderText('Program title')).toBeTruthy();
    expect(getByPlaceholderText('Description')).toBeTruthy();
    expect(getByText('Visibility')).toBeTruthy();
    expect(getByText('Duration')).toBeTruthy();
    expect(getAllByText('Create Program').length).toBeGreaterThanOrEqual(2);
  });

  it('creates a builder program with the expected payload', async () => {
    mockedApiRequest.mockResolvedValue({ id: 99 });
    const Screen = loadProgramCreateScreen();
    const { getAllByText, getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    fireEvent.changeText(getByPlaceholderText('Program title'), 'My Sprint Plan');
    fireEvent.changeText(getByPlaceholderText('Description'), 'A custom plan');

    const createButtons = getAllByText('Create Program');
    fireEvent.press(createButtons[createButtons.length - 1]);

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledWith('/api/programs', expect.objectContaining({
        method: 'POST',
        data: expect.objectContaining({
          title: 'My Sprint Plan',
          description: 'A custom plan',
          visibility: 'public',
        }),
      }));
    });
  });

  it('replaces to ProgramEditor after builder creation succeeds', async () => {
    mockedApiRequest.mockResolvedValue({ id: 99 });
    const Screen = loadProgramCreateScreen();
    const { getAllByText, getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    fireEvent.changeText(getByPlaceholderText('Program title'), 'Test');

    const createButtons = getAllByText('Create Program');
    fireEvent.press(createButtons[createButtons.length - 1]);

    await waitFor(() => {
      expect((global as any).__mockReplace).toHaveBeenCalledWith('ProgramEditor', { id: 99 });
    });
  });

  it('shows the text-based form when selected', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Text Based'));

    expect(getByText('Text Based Program')).toBeTruthy();
    expect(getByPlaceholderText('Program content')).toBeTruthy();
  });

  it('creates a text-based program', async () => {
    mockedApiRequest.mockResolvedValue({ id: 88 });
    const Screen = loadProgramCreateScreen();
    const { getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Text Based'));
    fireEvent.changeText(getByPlaceholderText('Program title'), 'Text Plan');
    fireEvent.changeText(getByPlaceholderText('Program content'), 'Week 1 content');
    fireEvent.press(getByText('Create Text Program'));

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledWith('/api/programs', expect.objectContaining({
        data: expect.objectContaining({
          isTextBased: true,
          textContent: 'Week 1 content',
        }),
      }));
    });
  });

  it('routes import/upload selection to ProgramImport', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Import / Upload'));

    expect((global as any).__mockNavigate).toHaveBeenCalledWith('ProgramImport');
  });

  it('shows the Sprinthia form when selected', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Sprinthia AI'));

    expect(getByText('Build With Sprinthia AI')).toBeTruthy();
    expect(getByText('Program Length')).toBeTruthy();
    expect(getByText('Block Focus')).toBeTruthy();
    expect(getByPlaceholderText('Describe your goals and AI prompt')).toBeTruthy();
  });

  it('calls the Sprinthia generation API', async () => {
    mockedApiRequest.mockResolvedValue({ content: 'Generated program content...' });
    const Screen = loadProgramCreateScreen();
    const { getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Sprinthia AI'));
    fireEvent.changeText(getByPlaceholderText('Program title'), 'AI Plan');
    fireEvent.changeText(getByPlaceholderText('Describe your goals and AI prompt'), 'Build speed');
    fireEvent.press(getByText('Generate Training Program'));

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledWith('/api/sprinthia/generate-program', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('shows generated program content after AI generation', async () => {
    mockedApiRequest.mockResolvedValue({ content: 'Week 1: Speed drills...' });
    const Screen = loadProgramCreateScreen();
    const { getByText, getByPlaceholderText, findByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Sprinthia AI'));
    fireEvent.changeText(getByPlaceholderText('Program title'), 'AI Plan');
    fireEvent.changeText(getByPlaceholderText('Describe your goals and AI prompt'), 'Build speed');
    fireEvent.press(getByText('Generate Training Program'));

    expect(await findByText('Week 1: Speed drills...')).toBeTruthy();
    expect(await findByText('Continue to Edit')).toBeTruthy();
    expect(await findByText('Rewrite')).toBeTruthy();
  });

  it('shows an error when a builder title is missing', async () => {
    mockedApiRequest.mockRejectedValue(new Error('Program title is required'));
    const Screen = loadProgramCreateScreen();
    const { getAllByText, getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    const createButtons = getAllByText('Create Program');
    fireEvent.press(createButtons[createButtons.length - 1]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Unable to create program', expect.any(String));
    });
  });

  it('shows an error when the create API fails', async () => {
    mockedApiRequest.mockRejectedValue(new Error('Server error'));
    const Screen = loadProgramCreateScreen();
    const { getAllByText, getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    fireEvent.changeText(getByPlaceholderText('Program title'), 'Test');
    const createButtons = getAllByText('Create Program');
    fireEvent.press(createButtons[createButtons.length - 1]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Unable to create program', expect.any(String));
    });
  });

  it('returns to the method grid after choosing a different method', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    fireEvent.press(getByText('Choose Different Method'));

    expect(getByText('Import / Upload')).toBeTruthy();
    expect(getByText('Program Builder')).toBeTruthy();
  });

  it('shows pricing fields when visibility is premium', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    fireEvent.press(getByText('premium'));

    expect(getByText('Pricing')).toBeTruthy();
    expect(getByText('spikes')).toBeTruthy();
    expect(getByText('money')).toBeTruthy();
  });

  it('shows a guest helper message when an unauthenticated guest tries to create', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'guest', name: 'Guest' },
      isAuthenticated: true,
      isLoading: false,
      hasValidToken: false,
      login: jest.fn(),
      loginWithToken: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      continueAsGuest: jest.fn(),
      refreshUser: jest.fn(),
      setUserAndPersist: jest.fn(),
    });

    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));

    expect(getByText('Sign in to create programs.')).toBeTruthy();
  });
});
