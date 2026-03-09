import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = React.useRef(createClient()).current;
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockPrograms = [
  {
    id: 1,
    programId: 100,
    program: {
      id: 100,
      title: 'Sprint Training',
      category: 'sprint',
      importedFromSheet: true,
    },
    assignerName: 'Coach Bob',
  },
  {
    id: 2,
    programId: 200,
    program: {
      id: 200,
      title: 'Distance Plan',
      category: 'distance',
    },
  },
];

const mockTextProgram = [
  {
    id: 3,
    programId: 300,
    program: {
      id: 300,
      title: 'Text Program',
      isTextBased: true,
      textContent: 'Week 1: Run 5km daily',
    },
  },
];

const mockUploadedProgram = [
  {
    id: 4,
    programId: 400,
    program: {
      id: 400,
      title: 'Uploaded Program',
      isUploadedProgram: true,
      programFileUrl: 'https://example.com/program.pdf',
    },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  (global as any).__mockAsyncStorage._resetStore();
  mockedUseAuth.mockReturnValue({
    user: { id: 1, name: 'Test', username: 'test', isCoach: false },
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

function loadPracticeScreen() {
  return require('../PracticeScreen').PracticeScreen;
}

describe('PracticeScreen', () => {
  it('shows the program picker trigger', () => {
    mockedApiRequest.mockResolvedValue([]);
    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect(getByText('Assign Program')).toBeTruthy();
  });

  it('shows the target times FAB button', () => {
    mockedApiRequest.mockResolvedValue([]);
    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect(getByText('%')).toBeTruthy();
  });

  it('shows empty state when no programs are assigned to a guest user', () => {
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

    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect(getByText('No training program assigned')).toBeTruthy();
  });

  it('shows the empty assigned-program state when no purchases are available', async () => {
    mockedApiRequest.mockResolvedValue([]);
    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(getByText('No training program assigned')).toBeTruthy();
    });
  });

  it('auto-selects the first assigned program when programs load', async () => {
    mockedApiRequest
      .mockResolvedValueOnce(mockPrograms)
      .mockResolvedValue({ sessions: [] });

    const PracticeScreen = loadPracticeScreen();
    const { findByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect(await findByText('No workout sessions available')).toBeTruthy();
  });

  it('renders assigned programs inside the picker dropdown content', async () => {
    mockedApiRequest
      .mockResolvedValueOnce(mockPrograms)
      .mockResolvedValue({ sessions: [] });
    const PracticeScreen = loadPracticeScreen();
    const { findAllByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect((await findAllByText('Distance Plan')).length).toBeGreaterThan(0);
  });

  it('does not render unmatched historical sessions as the current workout', async () => {
    const sessionsWithUnmatchedDates = {
      sessions: [
        { id: 1, date: 'Jan-1', dayNumber: 1, title: 'Old Session' },
      ],
    };
    mockedApiRequest
      .mockResolvedValueOnce(mockPrograms)
      .mockResolvedValue(sessionsWithUnmatchedDates);

    const PracticeScreen = loadPracticeScreen();
    const { queryByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(queryByText('Old Session')).toBeNull();
    });
  });

  it('shows the no-sessions card when the selected program has no sessions', async () => {
    mockedApiRequest
      .mockResolvedValueOnce(mockPrograms)
      .mockResolvedValue({ sessions: [] });

    const PracticeScreen = loadPracticeScreen();
    const { findByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect(await findByText('No workout sessions available')).toBeTruthy();
  });

  it('shows the text-based program title and content', async () => {
    mockedApiRequest.mockResolvedValueOnce(mockTextProgram);

    const PracticeScreen = loadPracticeScreen();
    const { findAllByText, findByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect((await findAllByText('Text Program')).length).toBeGreaterThan(0);
    expect(await findByText('Week 1: Run 5km daily')).toBeTruthy();
  });

  it('shows the uploaded program in the embedded document viewer', async () => {
    mockedApiRequest.mockResolvedValueOnce(mockUploadedProgram);

    const PracticeScreen = loadPracticeScreen();
    const { findAllByText, findByText, getByTestId } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect((await findAllByText('Uploaded Program')).length).toBeGreaterThan(0);
    expect(await findByText('Loading document...')).toBeTruthy();
    expect(getByTestId('webview')).toBeTruthy();
  });

  it('shows View Available Programs in the empty state', async () => {
    mockedApiRequest.mockResolvedValue([]);
    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(getByText('View Available Programs')).toBeTruthy();
    });
  });

  it('shows loading state while fetching sessions', async () => {
    mockedApiRequest
      .mockResolvedValueOnce(mockPrograms)
      .mockImplementation(() => new Promise(() => {}));

    const PracticeScreen = loadPracticeScreen();
    const { findByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect(await findByText('Loading sessions...')).toBeTruthy();
  });
});
