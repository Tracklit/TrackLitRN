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

const authUser = {
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
};

const coachUser = {
  ...authUser,
  user: { ...authUser.user, isCoach: true },
};

const guestUser = {
  ...authUser,
  user: { id: 'guest', name: 'Guest', username: 'guest' },
  hasValidToken: false,
};

const mockMyPrograms = [
  {
    id: 1,
    title: 'Sprint Plan',
    description: 'Sprint training program',
    level: 'Beginner' as const,
    coachName: 'Coach A',
    durationWeeks: 4,
    events: ['100m', '200m'],
  },
  {
    id: 2,
    title: 'Distance Plan',
    description: 'Distance training',
    level: 'Advanced' as const,
    coachName: 'Coach B',
  },
];

const mockPurchasedPrograms = [
  {
    id: 10,
    programId: 100,
    program: { id: 100, title: 'Purchased Sprint', level: 'Intermediate', coachName: 'Coach C' },
    isAssigned: true,
    assignerName: 'Coach C',
  },
  {
    id: 11,
    programId: 101,
    program: { id: 101, title: 'Bought Program', price: 25 },
    isAssigned: false,
    isCreated: false,
  },
];

const mockWorkoutLibrary = {
  workouts: [
    { id: 50, title: 'Speed Drills', description: 'Quick drills', category: 'sprint' },
    { id: 51, title: 'Core Work', description: null, category: null },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseAuth.mockReturnValue(authUser as any);
});

function loadProgramsScreen() {
  return require('../ProgramsScreen').ProgramsScreen;
}

function setupDefaultApi() {
  mockedApiRequest.mockImplementation((path: string) => {
    if (path === '/api/programs') return Promise.resolve(mockMyPrograms);
    if (path === '/api/purchased-programs') return Promise.resolve(mockPurchasedPrograms);
    if (path === '/api/workout-library') return Promise.resolve(mockWorkoutLibrary);
    return Promise.resolve([]);
  });
}

describe('ProgramsScreen', () => {
  it('renders tabs and filter controls', () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, getByPlaceholderText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    expect(getByText('My Programs')).toBeTruthy();
    expect(getByText('Purchased')).toBeTruthy();
    expect(getByText('Library')).toBeTruthy();
    expect(getByPlaceholderText('Search programs...')).toBeTruthy();
    expect(getByText('Filter')).toBeTruthy();
  });

  it('renders the screen shell while programs are loading', () => {
    mockedApiRequest.mockImplementation(() => new Promise(() => {}));
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, queryByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    expect(getByText('My Programs')).toBeTruthy();
    expect(queryByText('Unable to load programs. Pull to refresh.')).toBeNull();
    expect(queryByText('No Programs Yet')).toBeNull();
  });

  it('shows error state when my programs query fails', async () => {
    mockedApiRequest.mockRejectedValue(new Error('fail'));
    const ProgramsScreen = loadProgramsScreen();
    const { findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    expect(await findByText('Unable to load programs. Pull to refresh.')).toBeTruthy();
  });

  it('shows empty state when no programs are available', async () => {
    mockedApiRequest.mockImplementation((path: string) => {
      if (path === '/api/programs') return Promise.resolve([]);
      if (path === '/api/purchased-programs') return Promise.resolve([]);
      if (path === '/api/workout-library') return Promise.resolve({ workouts: [] });
      return Promise.resolve([]);
    });

    const ProgramsScreen = loadProgramsScreen();
    const { findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    expect(await findByText('No Programs Yet')).toBeTruthy();
  });

  it('shows guest state when the user is not signed in', () => {
    mockedUseAuth.mockReturnValue(guestUser as any);
    const ProgramsScreen = loadProgramsScreen();
    const { getByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    expect(getByText('Sign In Required')).toBeTruthy();
  });

  it('renders program cards with title, coach and event badges', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    expect(await findByText('Sprint Plan')).toBeTruthy();
    expect(await findByText(/Coach A/)).toBeTruthy();
    expect(await findByText('100m')).toBeTruthy();
  });

  it('renders programs in list view when toggled', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findByText, getByLabelText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    await findByText('Sprint Plan');
    fireEvent.press(getByLabelText('List view'));

    expect(await findByText('Sprint Plan')).toBeTruthy();
  });

  it('switches to purchased tab and shows purchased programs', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Purchased'));

    expect(await findByText('Purchased Sprint')).toBeTruthy();
    expect(await findByText('Assigned')).toBeTruthy();
    expect(await findByText(/Coach: Coach C/)).toBeTruthy();
  });

  it('shows purchased badge for directly purchased programs', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Purchased'));

    expect(await findByText('Purchased')).toBeTruthy();
  });

  it('shows empty purchased state when there are no purchases', async () => {
    mockedApiRequest.mockImplementation((path: string) => {
      if (path === '/api/programs') return Promise.resolve([]);
      if (path === '/api/purchased-programs') return Promise.resolve([]);
      if (path === '/api/workout-library') return Promise.resolve({ workouts: [] });
      return Promise.resolve([]);
    });

    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Purchased'));

    expect(await findByText('No Purchased Programs')).toBeTruthy();
  });

  it('switches to library tab and shows saved workouts', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Library'));

    expect(await findByText('Speed Drills')).toBeTruthy();
    expect(await findByText('sprint')).toBeTruthy();
    expect(await findByText('Workout')).toBeTruthy();
  });

  it('shows empty library state when no workouts are saved', async () => {
    mockedApiRequest.mockImplementation((path: string) => {
      if (path === '/api/workout-library') return Promise.resolve({ workouts: [] });
      return Promise.resolve([]);
    });

    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Library'));

    expect(await findByText('No workouts saved')).toBeTruthy();
  });

  it('filters programs by search text after narrowing category', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findByText, getByText, getByPlaceholderText, queryByText } = render(
      <ProgramsScreen />,
      { wrapper: Wrapper },
    );

    await findByText('Sprint Plan');

    fireEvent.press(getByText('Filter'));
    fireEvent.press(getByText('Sprint Programs'));
    fireEvent.changeText(getByPlaceholderText('Search programs...'), 'Distance');

    await waitFor(() => {
      expect(queryByText('Sprint Plan')).toBeNull();
      expect(queryByText('Distance Plan')).toBeTruthy();
    });
  });

  it('opens the filter modal', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findByText, getByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    await findByText('Sprint Plan');
    fireEvent.press(getByText('Filter'));

    expect(getByText('All Programs')).toBeTruthy();
    expect(getByText('Sprint Programs')).toBeTruthy();
  });

  it('shows the create FAB for authenticated users', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findByLabelText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    expect(await findByLabelText('Create program')).toBeTruthy();
  });

  it('hides the create FAB for guest users', () => {
    mockedUseAuth.mockReturnValue(guestUser as any);
    const ProgramsScreen = loadProgramsScreen();
    const { queryByLabelText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    expect(queryByLabelText('Create program')).toBeNull();
  });

  it('navigates coaches directly to ProgramCreate from the FAB', async () => {
    setupDefaultApi();
    mockedUseAuth.mockReturnValue(coachUser as any);
    const ProgramsScreen = loadProgramsScreen();
    const { findByLabelText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(await findByLabelText('Create program'));

    expect((global as any).__mockNavigate).toHaveBeenCalledWith('ProgramCreate');
  });

  it('opens the create menu for non-coaches', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findByLabelText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(await findByLabelText('Create program'));

    expect(await findByText('Create a Program')).toBeTruthy();
    expect(await findByText('Find a Coach')).toBeTruthy();
  });

  it('navigates to ProgramEditor from the primary my-programs action', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findAllByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    const editButtons = await findAllByText('Edit Program');
    fireEvent.press(editButtons[0]);

    expect((global as any).__mockNavigate).toHaveBeenCalledWith('ProgramEditor', { id: 1 });
  });

  it('navigates to Practice from the purchased assign action', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findAllByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Purchased'));
    const assignButtons = await findAllByText('Assign');
    fireEvent.press(assignButtons[0]);

    await waitFor(() => {
      expect((global as any).__mockNavigate).toHaveBeenCalledWith('MainTabs', { screen: 'Practice' });
    });
  });
});
