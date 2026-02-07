import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRoute } from '@react-navigation/native';

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseRoute = useRoute as jest.MockedFunction<typeof useRoute>;

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = React.useRef(createClient()).current;
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockProgram = {
  id: 42,
  title: 'Test Sprint Program',
  description: 'A test description for the program.',
  userId: 1,
  coachName: 'Coach Smith',
  durationWeeks: 8,
  level: 'Intermediate',
  category: 'sprint',
  events: ['100m', '200m', '400m'],
  sessions: [
    {
      id: 1,
      programId: 42,
      title: 'Speed Work',
      description: 'Short sprints and drills',
      weekNumber: 1,
      dayNumber: 1,
      workoutType: 'Sprint',
      exercises: 'Drills, 4x60m',
      duration: 90,
    },
    {
      id: 2,
      programId: 42,
      title: 'Endurance',
      weekNumber: 1,
      dayNumber: 3,
    },
    {
      id: 3,
      programId: 42,
      title: 'Recovery Run',
      weekNumber: 2,
      dayNumber: 8,
      duration: 60,
    },
  ],
  createdAt: '2025-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRoute.mockReturnValue({ params: { id: 42 }, key: 'test', name: 'ProgramDetail' } as any);
  mockedUseAuth.mockReturnValue({
    user: { id: 1, name: 'Test', username: 'test' },
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

function loadProgramDetailScreen() {
  return require('../ProgramDetailScreen').ProgramDetailScreen;
}

describe('ProgramDetailScreen', () => {
  // ─── Loading / Error ───
  it('shows loading indicator while fetching', () => {
    mockedApiRequest.mockImplementation(() => new Promise(() => {}));
    const Screen = loadProgramDetailScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });
    expect(getByText('Loading program...')).toBeTruthy();
  });

  it('shows error state with retry button when fetch fails', async () => {
    mockedApiRequest.mockRejectedValue(new Error('fail'));
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Unable to load program. Please try again.')).toBeTruthy();
    expect(await findByText('Retry')).toBeTruthy();
  });

  it('retry button triggers refetch', async () => {
    mockedApiRequest
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(mockProgram);

    const Screen = loadProgramDetailScreen();
    const { findByText, findAllByText } = render(<Screen />, { wrapper: Wrapper });

    const retryBtn = await findByText('Retry');
    fireEvent.press(retryBtn);

    // Title appears in both header and overview card
    const titles = await findAllByText('Test Sprint Program', {}, { timeout: 3000 });
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('back button is present in error state', async () => {
    mockedApiRequest.mockRejectedValue(new Error('fail'));
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    // The back arrow icon renders as text "arrow-left" from our mock
    expect(await findByText('arrow-left')).toBeTruthy();
  });

  // ─── Program display ───
  it('shows program title in header', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findAllByText } = render(<Screen />, { wrapper: Wrapper });
    const titles = await findAllByText('Test Sprint Program');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('shows level badge', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Intermediate')).toBeTruthy();
  });

  it('shows coach name', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('by Coach Smith')).toBeTruthy();
  });

  it('shows duration formatted as "X weeks"', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('8 weeks')).toBeTruthy();
  });

  it('shows session count', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('3 sessions')).toBeTruthy();
  });

  it('shows category', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('sprint')).toBeTruthy();
  });

  it('shows description', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('A test description for the program.')).toBeTruthy();
  });

  it('shows events as badges', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('100m')).toBeTruthy();
    expect(await findByText('200m')).toBeTruthy();
    expect(await findByText('400m')).toBeTruthy();
  });

  // ─── Sessions display ───
  it('shows "Week N" headers', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Week 1')).toBeTruthy();
    expect(await findByText('Week 2')).toBeTruthy();
  });

  it('shows session title and description', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Speed Work')).toBeTruthy();
    expect(await findByText('Short sprints and drills')).toBeTruthy();
  });

  it('shows workout type badge', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Sprint')).toBeTruthy();
  });

  it('shows exercises text', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Drills, 4x60m')).toBeTruthy();
  });

  it('shows duration for sessions', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('90 min')).toBeTruthy();
  });

  it('shows day badges in sessions', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Day 1')).toBeTruthy();
    expect(await findByText('Day 3')).toBeTruthy();
  });

  it('shows empty state when no sessions', async () => {
    mockedApiRequest.mockResolvedValue({ ...mockProgram, sessions: [] });
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('No sessions have been added to this program yet.')).toBeTruthy();
  });

  // ─── Owner actions ───
  it('shows "Edit Program" button for owner', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram); // userId matches user.id
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Edit Program')).toBeTruthy();
  });

  it('hides "Edit Program" button for non-owner', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 999, name: 'Other' },
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

    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findAllByText, queryByText } = render(<Screen />, { wrapper: Wrapper });
    // Title appears in both header and overview card
    const titles = await findAllByText('Test Sprint Program', {}, { timeout: 3000 });
    expect(titles.length).toBeGreaterThanOrEqual(1);
    expect(queryByText('Edit Program')).toBeNull();
  });

  it('Edit button navigates to ProgramEditor', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(await findByText('Edit Program'));
    expect((global as any).__mockNavigate).toHaveBeenCalledWith('ProgramEditor', { id: 42 });
  });

  // ─── Training Schedule title ───
  it('shows "Training Schedule" section header', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Training Schedule')).toBeTruthy();
  });

  // ─── Flexible duration fallback ───
  it('shows "Flexible duration" when durationWeeks is missing', async () => {
    mockedApiRequest.mockResolvedValue({ ...mockProgram, durationWeeks: undefined });
    const Screen = loadProgramDetailScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Flexible duration')).toBeTruthy();
  });
});
