import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { useProgramSessions } from '../use-program-sessions';

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useProgramSessions', () => {
  it('returns empty array when programId is null', () => {
    const { result } = renderHook(() => useProgramSessions(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.programSessions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it('returns empty array when programId is undefined', () => {
    const { result } = renderHook(
      () => useProgramSessions(undefined as any),
      { wrapper: createWrapper() },
    );
    expect(result.current.programSessions).toEqual([]);
  });

  it('fetches and parses sessions for a valid programId', async () => {
    mockedApiRequest.mockResolvedValue({
      sessions: [
        {
          id: 1,
          dayNumber: 1,
          date: 'May-16',
          columnB: 'Drills warm-up',
          columnD: '4x60m',
          title: 'Day 1',
        },
      ],
    });

    const { result } = renderHook(() => useProgramSessions(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.programSessions.length).toBe(1));

    expect(mockedApiRequest).toHaveBeenCalledWith('/api/programs/42');
    const session = result.current.programSessions[0];
    expect(session.preActivation1).toBe('Drills warm-up');
    expect(session.shortDistanceWorkout).toBe('4x60m');
    expect(session.dayNumber).toBe(1);
    expect(session.date).toBe('May-16');
  });

  it('normalizes ISO date to Mon-DD format', async () => {
    mockedApiRequest.mockResolvedValue({
      sessions: [
        { id: 2, date: '2025-05-29', columnB: 'Warmup' },
      ],
    });

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.programSessions.length).toBe(1));

    const session = result.current.programSessions[0];
    expect(session.date).toBe('May-29');
    expect(session.dayNumber).toBe(1);
    expect(session.preActivation1).toBe('Warmup');
  });

  it('keeps already-formatted dates unchanged', async () => {
    mockedApiRequest.mockResolvedValue({
      sessions: [{ id: 3, date: 'Jun-10', dayNumber: 5 }],
    });

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.programSessions.length).toBe(1));
    expect(result.current.programSessions[0].date).toBe('Jun-10');
  });

  it('maps spreadsheet columns to session fields', async () => {
    mockedApiRequest.mockResolvedValue({
      sessions: [
        {
          id: 4,
          columnA: 'Jun-15',
          columnB: 'Pre-act 1',
          columnC: 'Pre-act 2',
          columnD: 'Short dist',
          columnE: 'Medium dist',
          columnF: 'Long dist',
          columnG: 'Extra',
        },
      ],
    });

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.programSessions.length).toBe(1));

    const s = result.current.programSessions[0];
    expect(s.preActivation1).toBe('Pre-act 1');
    expect(s.preActivation2).toBe('Pre-act 2');
    expect(s.shortDistanceWorkout).toBe('Short dist');
    expect(s.mediumDistanceWorkout).toBe('Medium dist');
    expect(s.longDistanceWorkout).toBe('Long dist');
    expect(s.extraSession).toBe('Extra');
  });

  it('normalizes ISO timestamp dates to Mon-DD format', async () => {
    mockedApiRequest.mockResolvedValue({
      sessions: [{ id: 5, date: '2026-02-07T00:00:00.000Z' }],
    });

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.programSessions.length).toBe(1));

    const s = result.current.programSessions[0];
    expect(s.date).toBe('Feb-7');
  });

  it('falls back to session fields when columns are empty', async () => {
    mockedApiRequest.mockResolvedValue({
      sessions: [
        {
          id: 6,
          date: 'Jun-20',
          dayNumber: 10,
          preActivation1: 'Fallback Pre',
          shortDistanceWorkout: 'Fallback Short',
          title: 'Custom Title',
          description: 'Custom Desc',
        },
      ],
    });

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.programSessions.length).toBe(1));

    const s = result.current.programSessions[0];
    expect(s.preActivation1).toBe('Fallback Pre');
    expect(s.shortDistanceWorkout).toBe('Fallback Short');
    expect(s.title).toBe('Custom Title');
    expect(s.description).toBe('Custom Desc');
  });

  it('handles empty sessions array from API', async () => {
    mockedApiRequest.mockResolvedValue({ sessions: [] });

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.programSessions).toEqual([]);
  });

  it('handles API returning no sessions property', async () => {
    mockedApiRequest.mockResolvedValue({});

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.programSessions).toEqual([]);
  });

  it('handles API error (network failure)', async () => {
    mockedApiRequest.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.programSessions).toEqual([]);
  });

  it('sets isLoading correctly during fetch', async () => {
    let resolve: (value: any) => void;
    const promise = new Promise((r) => {
      resolve = r;
    });
    mockedApiRequest.mockReturnValue(promise as any);

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);

    resolve!({ sessions: [{ id: 1, date: 'Jun-1' }] });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.programSessions.length).toBe(1);
  });

  it('accepts string programId', async () => {
    mockedApiRequest.mockResolvedValue({ sessions: [] });

    const { result } = renderHook(() => useProgramSessions('abc'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/programs/abc');
  });

  it('defaults title and description for sessions missing them', async () => {
    mockedApiRequest.mockResolvedValue({
      sessions: [{ id: 7, date: 'Jul-1' }],
    });

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.programSessions.length).toBe(1));
    expect(result.current.programSessions[0].title).toBe('Day Training');
    expect(result.current.programSessions[0].description).toBe('Training Session');
  });

  it('extraSession prefers columnG over extraSession field', async () => {
    mockedApiRequest.mockResolvedValue({
      sessions: [
        {
          id: 8,
          date: 'Jul-2',
          columnG: 'Column G value',
          extraSession: 'Extra field value',
        },
      ],
    });

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.programSessions.length).toBe(1));
    expect(result.current.programSessions[0].extraSession).toBe('Column G value');
  });

  it('extraSession falls back to extraSession field when columnG is empty', async () => {
    mockedApiRequest.mockResolvedValue({
      sessions: [
        {
          id: 9,
          date: 'Jul-3',
          columnG: '   ',
          extraSession: 'Actual extra',
        },
      ],
    });

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.programSessions.length).toBe(1));
    expect(result.current.programSessions[0].extraSession).toBe('Actual extra');
  });

  it('uses index+1 as dayNumber when dateToDay and dayNumber are missing', async () => {
    mockedApiRequest.mockResolvedValue({
      sessions: [
        { id: 10, date: 'Aug-1' },
        { id: 11, date: 'Aug-2' },
      ],
    });

    const { result } = renderHook(() => useProgramSessions(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.programSessions.length).toBe(2));
    expect(result.current.programSessions[0].dayNumber).toBe(1);
    expect(result.current.programSessions[1].dayNumber).toBe(2);
  });
});
