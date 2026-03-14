import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import * as DocumentPicker from 'expo-document-picker';

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
  });
});

function loadProgramCreateScreen() {
  return require('../ProgramCreateScreen').ProgramCreateScreen;
}

describe('ProgramCreateScreen', () => {
  // ─── Method selection ───
  it('shows all creation methods', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });
    expect(getByText('Upload Document')).toBeTruthy();
    expect(getByText('Program Builder')).toBeTruthy();
    expect(getByText('Text Based')).toBeTruthy();
    expect(getByText('Build With Sprinthia')).toBeTruthy();
    expect(getByText('Import from Sheets')).toBeTruthy();
  });

  it('shows "Create Program" header', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });
    expect(getByText('Create Program')).toBeTruthy();
  });

  it('shows "Create New Program" page title', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });
    expect(getByText('Create New Program')).toBeTruthy();
  });

  // ─── Builder method ───
  it('selecting builder method shows builder form', () => {
    const Screen = loadProgramCreateScreen();
    const { getAllByText, getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));

    expect(getByText('Build Custom Program')).toBeTruthy();
    expect(getByPlaceholderText('Program title')).toBeTruthy();
    expect(getByPlaceholderText('Description')).toBeTruthy();
    expect(getByText('Visibility')).toBeTruthy();
    expect(getByText('Duration')).toBeTruthy();
    // "Create Program" appears in both header and form button
    expect(getAllByText('Create Program').length).toBeGreaterThanOrEqual(2);
  });

  it('builder Create button calls API with correct payload', async () => {
    mockedApiRequest.mockResolvedValue({ id: 99 });
    const Screen = loadProgramCreateScreen();
    const { getAllByText, getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    fireEvent.changeText(getByPlaceholderText('Program title'), 'My Sprint Plan');
    fireEvent.changeText(getByPlaceholderText('Description'), 'A custom plan');

    // Press Create Program button (the last one is the form button, first is header)
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

  it('builder navigates to ProgramEditor on success', async () => {
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

  // ─── Text method ───
  it('selecting text method shows text content form', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Text Based'));

    expect(getByText('Text Based Program')).toBeTruthy();
    expect(getByPlaceholderText('Program content')).toBeTruthy();
  });

  it('text method creates text-based program', async () => {
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

  // ─── Upload method ───
  it('selecting upload method shows upload form', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Upload Document'));

    expect(getByText('Upload Program Document')).toBeTruthy();
    expect(getByText('Choose file')).toBeTruthy();
  });

  it('picking file updates UI with filename', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ name: 'training.pdf', uri: 'file:///training.pdf', size: 1024 }],
    });

    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Upload Document'));
    fireEvent.press(getByText('Choose file'));

    expect(await waitFor(() => getByText('training.pdf'))).toBeTruthy();
  });

  // ─── Import method ───
  it('selecting import opens import modal', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Import from Sheets'));

    expect(getByText('Import Program from Google Sheet')).toBeTruthy();
  });

  it('import modal has required fields', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Import from Sheets'));

    expect(getByPlaceholderText('Program title')).toBeTruthy();
    expect(getByPlaceholderText('Google Sheet URL')).toBeTruthy();
    expect(getByPlaceholderText('Duration (days)')).toBeTruthy();
  });

  it('import button calls correct API', async () => {
    mockedApiRequest.mockResolvedValue({ program: { id: 77 }, importedSessions: 10 });
    const Screen = loadProgramCreateScreen();
    const { getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Import from Sheets'));
    fireEvent.changeText(getByPlaceholderText('Program title'), 'Sheet Program');
    fireEvent.changeText(getByPlaceholderText('Google Sheet URL'), 'https://docs.google.com/spreadsheets/d/abc');

    fireEvent.press(getByText('Import Program'));

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledWith('/api/programs/import-sheet', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  // ─── Sprinthia method ───
  it('selecting sprinthia method shows AI form', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Build With Sprinthia'));

    expect(getByText('Build With Sprinthia AI')).toBeTruthy();
    expect(getByText('Program Length')).toBeTruthy();
    expect(getByText('Block Focus')).toBeTruthy();
    expect(getByPlaceholderText('Describe your goals and AI prompt')).toBeTruthy();
  });

  it('generate button calls Sprinthia API', async () => {
    mockedApiRequest.mockResolvedValue({ content: 'Generated program content...' });
    const Screen = loadProgramCreateScreen();
    const { getByText, getByPlaceholderText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Build With Sprinthia'));
    fireEvent.changeText(getByPlaceholderText('Program title'), 'AI Plan');
    fireEvent.changeText(getByPlaceholderText('Describe your goals and AI prompt'), 'Build speed');

    fireEvent.press(getByText('Generate Training Program'));

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledWith('/api/sprinthia/generate-program', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('shows generated program content after generation', async () => {
    mockedApiRequest.mockResolvedValue({ content: 'Week 1: Speed drills...' });
    const Screen = loadProgramCreateScreen();
    const { getByText, getByPlaceholderText, findByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Build With Sprinthia'));
    fireEvent.changeText(getByPlaceholderText('Program title'), 'AI Plan');
    fireEvent.changeText(getByPlaceholderText('Describe your goals and AI prompt'), 'Build speed');
    fireEvent.press(getByText('Generate Training Program'));

    expect(await findByText('Week 1: Speed drills...')).toBeTruthy();
    expect(await findByText('Continue to Edit')).toBeTruthy();
    expect(await findByText('Rewrite')).toBeTruthy();
  });

  // ─── Validation ───
  it('shows error when builder title is empty', async () => {
    mockedApiRequest.mockRejectedValue(new Error('Program title is required'));
    const Screen = loadProgramCreateScreen();
    const { getAllByText, getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    // Don't fill title
    const createButtons = getAllByText('Create Program');
    fireEvent.press(createButtons[createButtons.length - 1]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Unable to create program', expect.any(String));
    });
  });

  it('shows error on API failure', async () => {
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

  // ─── Choose Different Method button ───
  it('shows "Choose Different Method" after selecting a method', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    expect(getByText('Choose Different Method')).toBeTruthy();
  });

  it('pressing "Choose Different Method" returns to method grid', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    fireEvent.press(getByText('Choose Different Method'));

    // Method grid should be visible again
    expect(getByText('Upload Document')).toBeTruthy();
    expect(getByText('Program Builder')).toBeTruthy();
  });

  // ─── Visibility and pricing ───
  it('shows pricing fields when visibility is premium', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    fireEvent.press(getByText('premium'));

    expect(getByText('Pricing')).toBeTruthy();
    expect(getByText('spikes')).toBeTruthy();
    expect(getByText('money')).toBeTruthy();
  });

  it('hides pricing fields when visibility is public', () => {
    const Screen = loadProgramCreateScreen();
    const { getByText, queryByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    // Default is public
    expect(queryByText('Pricing')).toBeNull();
  });

  // ─── Guest user ───
  it('shows "Sign in to create programs" for guest', () => {
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

    const Screen = loadProgramCreateScreen();
    const { getByText } = render(<Screen />, { wrapper: Wrapper });

    fireEvent.press(getByText('Program Builder'));
    expect(getByText('Sign in to create programs.')).toBeTruthy();
  });
});
