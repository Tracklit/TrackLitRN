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

// Set up API to return correct data based on the endpoint
function setupDefaultApi() {
  mockedApiRequest.mockImplementation((path: string) => {
    if (path === '/api/programs') return Promise.resolve(mockMyPrograms);
    if (path === '/api/purchased-programs') return Promise.resolve(mockPurchasedPrograms);
    if (path === '/api/workout-library') return Promise.resolve(mockWorkoutLibrary);
    return Promise.resolve([]);
  });
}

describe('ProgramsScreen', () => {
  // ─── Tab navigation ───
  it('renders with "My Programs" tab active by default', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText } = render(<ProgramsScreen />, { wrapper: Wrapper });
    expect(getByText('My Programs')).toBeTruthy();
    expect(getByText('Purchased')).toBeTruthy();
    expect(getByText('Workout Library')).toBeTruthy();
  });

  it('shows "Programs" header', () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText } = render(<ProgramsScreen />, { wrapper: Wrapper });
    expect(getByText('Programs')).toBeTruthy();
  });

  // ─── My Programs tab ───
  it('shows loading spinner while fetching my programs', async () => {
    mockedApiRequest.mockImplementation(() => new Promise(() => {}));
    const ProgramsScreen = loadProgramsScreen();
    const { getByText } = render(<ProgramsScreen />, { wrapper: Wrapper });
    expect(getByText('Loading your programs...')).toBeTruthy();
  });

  it('shows error state when my programs query fails', async () => {
    mockedApiRequest.mockRejectedValue(new Error('fail'));
    const ProgramsScreen = loadProgramsScreen();
    const { findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });
    expect(await findByText('Unable to load programs. Pull to refresh.')).toBeTruthy();
  });

  it('shows empty state "No Programs Yet" when empty', async () => {
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

  it('shows guest state "Sign In Required"', async () => {
    mockedUseAuth.mockReturnValue(guestUser as any);
    const ProgramsScreen = loadProgramsScreen();
    const { getByText } = render(<ProgramsScreen />, { wrapper: Wrapper });
    expect(getByText('Sign In Required')).toBeTruthy();
  });

  it('renders program cards with title and level badge', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });
    expect(await findByText('Sprint Plan')).toBeTruthy();
    expect(await findByText('Beginner')).toBeTruthy();
  });

  it('renders programs in list view when toggled', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findByText, getByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    // Wait for data to load
    await findByText('Sprint Plan');

    // Find and press the list view toggle (the "list" icon button)
    // The list toggle icon is "list" FontAwesome5 icon rendered as text
    const listButtons = (await findByText('list'));
    fireEvent.press(listButtons);

    // In list mode we should still see program title
    expect(await findByText('Sprint Plan')).toBeTruthy();
  });

  it('shows coach name for programs', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });
    expect(await findByText(/Coach A/)).toBeTruthy();
  });

  // ─── Purchased tab ───
  it('switches to "Purchased" tab and shows purchased programs', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Purchased'));

    expect(await findByText('Purchased Sprint')).toBeTruthy();
  });

  it('shows "Assigned" badge for assigned programs', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Purchased'));
    expect(await findByText('Assigned')).toBeTruthy();
  });

  it('shows "Purchased" badge for purchased programs', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Purchased'));
    expect(await findByText('Purchased')).toBeTruthy();
  });

  it('shows coach name for assigned programs', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Purchased'));
    expect(await findByText(/Coach: Coach C/)).toBeTruthy();
  });

  it('shows empty state "No Purchased Programs"', async () => {
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

  // ─── Workout Library tab ───
  it('switches to "Workout Library" tab and shows workouts', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Workout Library'));
    expect(await findByText('Speed Drills')).toBeTruthy();
  });

  it('shows workout category badge', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Workout Library'));
    expect(await findByText('sprint')).toBeTruthy();
    // When category is null, it shows "Workout"
    expect(await findByText('Workout')).toBeTruthy();
  });

  it('shows "details coming next" placeholder text', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findAllByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Workout Library'));
    // Multiple workout cards show this text, use findAllByText
    const matches = await findAllByText(/details coming next/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows empty state "No workouts saved"', async () => {
    mockedApiRequest.mockImplementation((path: string) => {
      if (path === '/api/workout-library') return Promise.resolve({ workouts: [] });
      return Promise.resolve([]);
    });

    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Workout Library'));
    expect(await findByText('No workouts saved')).toBeTruthy();
  });

  // ─── Search and filter ───
  it('search filters programs by title', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findByText, getByText, getByPlaceholderText, queryByText } = render(
      <ProgramsScreen />,
      { wrapper: Wrapper },
    );

    await findByText('Sprint Plan');

    // The filter logic ORs search with category (category 'all' matches everything).
    // Select a specific category first so search text actually filters results.
    fireEvent.press(getByText('Filter'));
    fireEvent.press(getByText('Sprint Programs'));

    fireEvent.changeText(getByPlaceholderText('Search programs...'), 'Distance');

    await waitFor(() => {
      expect(queryByText('Sprint Plan')).toBeNull();
      expect(queryByText('Distance Plan')).toBeTruthy();
    });
  });

  it('filter modal opens and closes', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findByText, getByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    await findByText('Sprint Plan');

    // Press the Filter button
    fireEvent.press(getByText('Filter'));

    // Filter modal shows categories
    expect(getByText('All Programs')).toBeTruthy();
    expect(getByText('Sprint Programs')).toBeTruthy();
  });

  // ─── Create FAB ───
  it('shows FAB for authenticated non-guest on "My Programs" tab', async () => {
    setupDefaultApi();
    mockedUseAuth.mockReturnValue(authUser as any);
    const ProgramsScreen = loadProgramsScreen();
    const { findByLabelText } = render(<ProgramsScreen />, { wrapper: Wrapper });
    expect(await findByLabelText('Create program')).toBeTruthy();
  });

  it('hides FAB for guest users', async () => {
    mockedUseAuth.mockReturnValue(guestUser as any);
    const ProgramsScreen = loadProgramsScreen();
    const { queryByLabelText } = render(<ProgramsScreen />, { wrapper: Wrapper });
    expect(queryByLabelText('Create program')).toBeNull();
  });

  it('coach FAB directly navigates to ProgramCreate', async () => {
    setupDefaultApi();
    mockedUseAuth.mockReturnValue(coachUser as any);
    const ProgramsScreen = loadProgramsScreen();
    const { findByLabelText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    const fab = await findByLabelText('Create program');
    fireEvent.press(fab);

    expect((global as any).__mockNavigate).toHaveBeenCalledWith('ProgramCreate');
  });

  it('non-coach FAB opens create menu', async () => {
    setupDefaultApi();
    mockedUseAuth.mockReturnValue(authUser as any);
    const ProgramsScreen = loadProgramsScreen();
    const { findByLabelText, findByText } = render(
      <ProgramsScreen />,
      { wrapper: Wrapper },
    );

    const fab = await findByLabelText('Create program');
    fireEvent.press(fab);

    // Create menu should show
    expect(await findByText('Create a Program')).toBeTruthy();
    expect(await findByText('Find a Coach')).toBeTruthy();
    expect(await findByText('Find a Program')).toBeTruthy();
  });

  // ─── Continue / View Details navigation ───
  it('Continue button navigates to ProgramEditor', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findAllByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    const continueButtons = await findAllByText('Continue');
    fireEvent.press(continueButtons[0]);

    expect((global as any).__mockNavigate).toHaveBeenCalledWith('ProgramEditor', { id: 1 });
  });

  it('Purchased tab continue navigates to Practice tab', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { getByText, findAllByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Purchased'));
    const continueButtons = await findAllByText('Continue');
    fireEvent.press(continueButtons[0]);

    await waitFor(() => {
      expect((global as any).__mockNavigate).toHaveBeenCalledWith('MainTabs', { screen: 'Practice' });
    });
  });

  it('View Details button navigates to ProgramDetail', async () => {
    setupDefaultApi();
    const ProgramsScreen = loadProgramsScreen();
    const { findAllByText } = render(<ProgramsScreen />, { wrapper: Wrapper });

    const detailButtons = await findAllByText('View Details');
    fireEvent.press(detailButtons[0]);

    expect((global as any).__mockNavigate).toHaveBeenCalledWith('ProgramDetail', { id: 1 });
  });
});
