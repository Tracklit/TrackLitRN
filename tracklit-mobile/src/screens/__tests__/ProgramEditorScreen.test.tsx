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
  });
});

function loadProgramEditorScreen() {
  return require('../ProgramEditorScreen').ProgramEditorScreen;
}

describe('ProgramEditorScreen', () => {
  // ─── Loading / Error ───
  it('shows loading while fetching program', () => {
    mockedApiRequest.mockImplementation(() => new Promise(() => {}));
    const Screen = loadProgramEditorScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });
    expect(getByText('Loading program...')).toBeTruthy();
  });

  it('shows error with retry when fetch fails', async () => {
    mockedApiRequest.mockRejectedValue(new Error('fail'));
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Unable to load program.')).toBeTruthy();
    expect(await findByText('Retry')).toBeTruthy();
  });

  // ─── Form display ───
  it('pre-fills title from program data', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByDisplayValue } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByDisplayValue('Editor Test Program')).toBeTruthy();
  });

  it('pre-fills description from program data', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByDisplayValue } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByDisplayValue('Test description')).toBeTruthy();
  });

  it('pre-fills category and level', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByDisplayValue } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByDisplayValue('sprint')).toBeTruthy();
    expect(await findByDisplayValue('beginner')).toBeTruthy();
  });

  it('pre-fills duration', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByDisplayValue } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByDisplayValue('14')).toBeTruthy();
  });

  it('shows "Program Editor" header', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Program Editor')).toBeTruthy();
  });

  it('shows "Program Details" card title', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Program Details')).toBeTruthy();
  });

  it('shows "Sessions" card title', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Sessions')).toBeTruthy();
  });

  it('shows day labels (Sun-Sat)', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Sun')).toBeTruthy();
    expect(await findByText('Mon')).toBeTruthy();
    expect(await findByText('Sat')).toBeTruthy();
  });

  // ─── Save button ───
  it('shows Save button for owner of non-uploaded program', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Save')).toBeTruthy();
  });

  it('hides Save button for uploaded programs', async () => {
    mockedUseRoute.mockReturnValue({ params: { id: 20 }, key: 'test', name: 'ProgramEditor' } as any);
    mockedApiRequest.mockResolvedValue(uploadedProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText, queryByText } = render(<Screen />, { wrapper: Wrapper });
    await findByText('Program Editor');
    expect(queryByText('Save')).toBeNull();
  });

  it('shows "View on web" button for uploaded programs', async () => {
    mockedUseRoute.mockReturnValue({ params: { id: 20 }, key: 'test', name: 'ProgramEditor' } as any);
    mockedApiRequest.mockResolvedValue(uploadedProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('View on web')).toBeTruthy();
  });

  // ─── Read-only badge for non-owners ───
  it('shows "Read only" badge for non-owners', async () => {
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
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    expect(await findByText('Read only')).toBeTruthy();
  });

  // ─── Session summaries ───
  it('shows session summaries in grid cells', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    // Day 1 session should show the shortDistanceWorkout as summary
    expect(await findByText('3x60m')).toBeTruthy();
    // Day 3 rest session
    expect(await findByText('Rest day')).toBeTruthy();
  });

  it('shows "Add session" for empty days', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findAllByText } = render(<Screen />, { wrapper: Wrapper });
    const addCells = await findAllByText('Add session');
    expect(addCells.length).toBeGreaterThan(0);
  });

  // ─── Day editor modal ───
  it('opens day editor modal when day cell is pressed', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findAllByText, findByText } = render(<Screen />, { wrapper: Wrapper });

    // Press an empty day cell ("Add session")
    const addButtons = await findAllByText('Add session');
    fireEvent.press(addButtons[0]);

    // Modal should show a day title
    expect(await findByText(/Day \d+/)).toBeTruthy();
    expect(await findByText('Save day')).toBeTruthy();
    expect(await findByText('Cancel')).toBeTruthy();
  });

  it('pre-fills day editor with existing session data', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText, findByDisplayValue } = render(<Screen />, { wrapper: Wrapper });

    // Press on day 1 which has "3x60m" summary
    fireEvent.press(await findByText('3x60m'));

    expect(await findByText('Day 1')).toBeTruthy();
    expect(await findByDisplayValue('Day 1 Speed')).toBeTruthy();
    expect(await findByDisplayValue('Drills')).toBeTruthy();
    expect(await findByDisplayValue('3x60m')).toBeTruthy();
  });

  // ─── Back button ───
  it('back button calls goBack', async () => {
    mockedApiRequest.mockResolvedValue(mockProgram);
    const Screen = loadProgramEditorScreen();
    const { findByText } = render(<Screen />, { wrapper: Wrapper });
    // Our mock renders icon name as text
    fireEvent.press(await findByText('arrow-left'));
    expect((global as any).__mockGoBack).toHaveBeenCalled();
  });
});
