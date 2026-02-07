import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
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
  });
});

// Lazy-import PracticeScreen to pick up fresh mocks each time
function loadPracticeScreen() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../PracticeScreen').PracticeScreen;
}

describe('PracticeScreen', () => {
  // ─── Render states ───
  it('shows "Practice" header', async () => {
    mockedApiRequest.mockResolvedValue([]);
    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });
    expect(getByText('Practice')).toBeTruthy();
  });

  it('shows "Your Programs" button', async () => {
    mockedApiRequest.mockResolvedValue([]);
    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });
    expect(getByText('Your Programs')).toBeTruthy();
  });

  it('shows target times FAB button with % text', async () => {
    mockedApiRequest.mockResolvedValue([]);
    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });
    expect(getByText('%')).toBeTruthy();
  });

  it('shows empty state when no programs (guest user)', async () => {
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
    });

    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });
    expect(getByText('No training program assigned')).toBeTruthy();
  });

  it('shows empty state when no purchased programs (authenticated)', async () => {
    mockedApiRequest.mockResolvedValue([]);
    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(getByText('No training program assigned')).toBeTruthy();
    });
  });

  // ─── Program selection ───
  it('auto-selects first program when loaded', async () => {
    // First call: purchased-programs, subsequent calls: program sessions API
    mockedApiRequest
      .mockResolvedValueOnce(mockPrograms)
      .mockResolvedValue({ sessions: [] });

    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(getByText('No workout sessions available')).toBeTruthy();
    });
  });

  it('opens ProgramPickerModal when "Your Programs" pressed', async () => {
    mockedApiRequest.mockResolvedValue([]);
    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Your Programs'));
    // The modal with "Your Programs" as title should now be visible
    await waitFor(() => {
      expect(getByText('Select a training program to view or switch between your assigned programs.')).toBeTruthy();
    });
  });

  // ─── Content rendering ───
  it('shows "Rest Day" when session data is null', async () => {
    // Provide sessions that exist but won't match any current dates,
    // so workoutCards are built but findSessionForDate returns null for each card
    const sessionsWithUnmatchedDates = {
      sessions: [
        { id: 1, date: 'Jan-1', dayNumber: 1, title: 'Old Session' },
      ],
    };
    mockedApiRequest
      .mockResolvedValueOnce(mockPrograms)
      .mockResolvedValue(sessionsWithUnmatchedDates);

    const PracticeScreen = loadPracticeScreen();
    const { findAllByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    // With sessions present but no date matches, cards show "Rest Day"
    const restDays = await findAllByText('Rest Day');
    expect(restDays.length).toBeGreaterThan(0);
  });

  it('shows "No workout sessions available" when sessions empty', async () => {
    mockedApiRequest
      .mockResolvedValueOnce(mockPrograms)
      .mockResolvedValue({ sessions: [] });

    const PracticeScreen = loadPracticeScreen();
    const { findByText } = render(<PracticeScreen />, { wrapper: Wrapper });
    expect(await findByText('No workout sessions available')).toBeTruthy();
  });

  // ─── Text-based program ───
  it('shows text content card when program is text-based', async () => {
    mockedApiRequest.mockResolvedValueOnce(mockTextProgram);

    const PracticeScreen = loadPracticeScreen();
    const { findByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect(await findByText('Program Content')).toBeTruthy();
    expect(await findByText('Week 1: Run 5km daily')).toBeTruthy();
  });

  it('shows scroll instruction note for text programs', async () => {
    mockedApiRequest.mockResolvedValueOnce(mockTextProgram);

    const PracticeScreen = loadPracticeScreen();
    const { findByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect(
      await findByText(/Scroll through the content above/)
    ).toBeTruthy();
  });

  // ─── Uploaded program ───
  it('shows document card when program is uploaded', async () => {
    mockedApiRequest.mockResolvedValueOnce(mockUploadedProgram);

    const PracticeScreen = loadPracticeScreen();
    const { findByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect(await findByText('Program Document')).toBeTruthy();
  });

  it('shows "open on web" note for uploaded programs', async () => {
    mockedApiRequest.mockResolvedValueOnce(mockUploadedProgram);

    const PracticeScreen = loadPracticeScreen();
    const { findByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect(
      await findByText(/Open the document on web/)
    ).toBeTruthy();
  });

  // ─── View Available Programs button in empty state ───
  it('shows View Available Programs button in empty state', async () => {
    mockedApiRequest.mockResolvedValue([]);
    const PracticeScreen = loadPracticeScreen();
    const { getByText } = render(<PracticeScreen />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(getByText('View Available Programs')).toBeTruthy();
    });
  });

  // ─── Loading state ───
  it('shows loading state while fetching sessions', async () => {
    mockedApiRequest
      .mockResolvedValueOnce(mockPrograms)
      .mockImplementation(() => new Promise(() => {})); // Never resolves

    const PracticeScreen = loadPracticeScreen();
    const { findByText } = render(<PracticeScreen />, { wrapper: Wrapper });

    expect(await findByText('Loading sessions...')).toBeTruthy();
  });
});
