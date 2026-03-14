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
  id: 10,
  title: 'Editor Test Program',
  description: 'Test description',
  category: 'sprint',
  level: 'beginner',
  duration: 14,
  userId: 1,
  isUploadedProgram: false,
  sessions: [
    {
      id: 100,
      programId: 10,
      dayNumber: 1,
      date: '2025-06-01',
      title: 'Day 1 Speed',
      preActivation1: 'Drills',
      shortDistanceWorkout: '3x60m',
    },
    {
      id: 101,
      programId: 10,
      dayNumber: 3,
      date: '2025-06-03',
      title: 'Day 3 Rest',
      isRestDay: true,
    },
  ],
};

const uploadedProgram = {
  ...mockProgram,
  id: 20,
  title: 'Uploaded Program',
  isUploadedProgram: true,
  programFileUrl: 'https://example.com/file.pdf',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRoute.mockReturnValue({ params: { id: 10 }, key: 'test', name: 'ProgramEditor' } as any);
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
    setUserAndPersist: jest.fn(),
  });
});

function loadProgramEditorScreen() {
  return require('../ProgramEditorScreen').ProgramEditorScreen;
}

describe('ProgramEditorScreen', () => {
  it('shows the loading skeleton while fetching the program', () => {
    mockedApiRequest.mockImplementation(() => new Promise(() => {}));
    const Screen = loadProgramEditorScreen();
    const { getByTestId } = render(<Screen />, { wrapper: Wrapper });

    expect(getByTestId('program-editor-loading')).toBeTruthy();
  });

  it('shows error state with retry when fetch fails', async () => {
    mockedApiRequest.mockRejectedValue(new Error('fail'));
    const Screen = loadProgramEditorScreen();
    const { findByText, findByLabelText } = render(<Screen />, { wrapper: Wrapper });

    expect(await findByText('Unable to load program.')).toBeTruthy();
    expect(await findByText('Retry')).toBeTruthy();
    expect(await findByLabelText('Go back')).toBeTruthy();
  });

  it('pre-fills title, description and category from the program', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByDisplayValue } = render(<Screen />, { wrapper: Wrapper });

    expect(await findByDisplayValue('Editor Test Program')).toBeTruthy();
    expect(await findByDisplayValue('Test description')).toBeTruthy();
    expect(await findByDisplayValue('sprint')).toBeTruthy();
  });

  it('shows the derived start date and session count summary', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });

    expect(await findByText('Jun 1, 2025')).toBeTruthy();
    expect(await findByText(/14 days/)).toBeTruthy();
  });

  it('shows the editor header and section titles', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });

    expect(await findByText('Program Editor')).toBeTruthy();
    expect(await findByText('Program Details')).toBeTruthy();
    expect(await findByText('Sessions')).toBeTruthy();
  });

  it('shows day labels across the calendar grid', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });

    expect(await findByText('Sun')).toBeTruthy();
    expect(await findByText('Mon')).toBeTruthy();
    expect(await findByText('Sat')).toBeTruthy();
  });

  it('shows Save button for editable programs', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });

    expect(await findByText('Save')).toBeTruthy();
  });

  it('shows uploaded programs as read-only with a web CTA', async () => {
    mockedUseRoute.mockReturnValue({ params: { id: 20 }, key: 'test', name: 'ProgramEditor' } as any);
    mockedApiRequest.mockResolvedValue(uploadedProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText, queryByText } = render(<Screen />, { wrapper: Wrapper });

    expect(await findByText('Program Editor')).toBeTruthy();
    expect(await findByText('Read only')).toBeTruthy();
    expect(await findByText('View on web')).toBeTruthy();
    expect(queryByText('Save')).toBeNull();
  });

  it('shows read-only status for non-owners', async () => {
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
      setUserAndPersist: jest.fn(),
    });
    mockedApiRequest.mockResolvedValue(mockProgram);

    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });

    expect(await findByText('Read only')).toBeTruthy();
  });

  it('shows session summaries and rest days in the grid', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });

    expect(await findByText(/3x60m/)).toBeTruthy();
    expect(await findByText('Rest day')).toBeTruthy();
  });

  it('shows Add session for empty days', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findAllByText } = render(<Screen />, { wrapper: Wrapper });

    const addCells = await findAllByText('Add session');
    expect(addCells.length).toBeGreaterThan(0);
  });

  it('opens the day editor modal from an empty day', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findAllByText, findByText } = render(<Screen />, { wrapper: Wrapper });

    const addButtons = await findAllByText('Add session');
    fireEvent.press(addButtons[0]);

    expect(await findByText('Day 2')).toBeTruthy();
    expect(await findByText('Save Day')).toBeTruthy();
    expect(await findByText('Cancel')).toBeTruthy();
  });

  it('pre-fills the day editor with the selected session data', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText, findByDisplayValue } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(await findByText('Day 1 Speed'));

    expect(await findByText('Day 1')).toBeTruthy();
    expect(await findByDisplayValue('Day 1 Speed')).toBeTruthy();
    expect(await findByDisplayValue('Drills')).toBeTruthy();
    expect(await findByDisplayValue('3x60m')).toBeTruthy();
  });

  it('uses the back button action from the header', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByLabelText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(await findByLabelText('Go back'));

    await waitFor(() => {
      expect((global as any).__mockGoBack).toHaveBeenCalled();
    });
  });
});
