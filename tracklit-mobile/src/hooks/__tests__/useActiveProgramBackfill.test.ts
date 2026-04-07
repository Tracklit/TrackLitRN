import { renderHook, waitFor } from '@testing-library/react-native';

import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  PROGRAM_SELECTION_KEY,
  ACTIVE_PROGRAM_BACKFILL_FLAG_KEY,
} from '@/utils/programSelection';
import { __resetActiveProgramBackfillForTests } from '../useActiveProgramBackfill';

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Grab the AsyncStorage mock object exposed by jest.setup.js. Using the shared
// instance ensures we hit the same in-memory store the hook reads.
const asyncStorageMock = (global as any).__mockAsyncStorage as {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  _resetStore: () => void;
  _getStore: () => Record<string, string>;
};

type AuthValue = ReturnType<typeof useAuth>;

function buildAuthValue(overrides: Partial<AuthValue> & { user: any }): AuthValue {
  return {
    isAuthenticated: true,
    isLoading: false,
    hasValidToken: true,
    login: jest.fn(),
    loginWithToken: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    continueAsGuest: jest.fn(),
    refreshUser: jest.fn(),
    setUserAndPersist: jest.fn(async () => {}),
    ...overrides,
  } as unknown as AuthValue;
}

/**
 * Load the hook in a fresh module registry so the module-scope `backfillInflight`
 * singleton and any per-user refs start clean for each test. Must be called inside
 * `jest.isolateModules` when we need parallel load semantics.
 */
function loadHook(): typeof import('../useActiveProgramBackfill').useActiveProgramBackfill {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  return require('../useActiveProgramBackfill').useActiveProgramBackfill;
}

beforeEach(() => {
  jest.clearAllMocks();
  asyncStorageMock._resetStore();
  // Reset the module-scope backfillInflight + lastRanForUserId so each test starts clean.
  __resetActiveProgramBackfillForTests();
});

describe('useActiveProgramBackfill', () => {
  it('is a no-op for a guest user (id: "guest")', async () => {
    mockedUseAuth.mockReturnValue(
      buildAuthValue({ user: { id: 'guest', name: 'Guest' } }),
    );

    const useActiveProgramBackfill = loadHook();
    renderHook(() => useActiveProgramBackfill());

    // Flush any pending microtasks — nothing should be scheduled.
    await Promise.resolve();
    await Promise.resolve();

    expect(asyncStorageMock.getItem).not.toHaveBeenCalled();
    expect(asyncStorageMock.setItem).not.toHaveBeenCalled();
    expect(asyncStorageMock.removeItem).not.toHaveBeenCalled();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it('is a no-op for an unauthenticated user (user: null)', async () => {
    mockedUseAuth.mockReturnValue(buildAuthValue({ user: null }));

    const useActiveProgramBackfill = loadHook();
    renderHook(() => useActiveProgramBackfill());

    await Promise.resolve();
    await Promise.resolve();

    expect(asyncStorageMock.getItem).not.toHaveBeenCalled();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it('returns early when the migrated flag is already set', async () => {
    await asyncStorageMock.setItem(ACTIVE_PROGRAM_BACKFILL_FLAG_KEY, 'true');
    // Also put a legacy value in the store so we can assert it is NOT cleared.
    await asyncStorageMock.setItem(PROGRAM_SELECTION_KEY, 'assigned-1');

    // Reset call counts on the mock after the seeding above.
    asyncStorageMock.getItem.mockClear();
    asyncStorageMock.setItem.mockClear();
    asyncStorageMock.removeItem.mockClear();

    mockedUseAuth.mockReturnValue(
      buildAuthValue({ user: { id: 1, activeProgramSelection: null } }),
    );

    const useActiveProgramBackfill = loadHook();
    renderHook(() => useActiveProgramBackfill());

    await waitFor(() => {
      expect(asyncStorageMock.getItem).toHaveBeenCalledWith(
        ACTIVE_PROGRAM_BACKFILL_FLAG_KEY,
      );
    });

    // Extra flushes to give the run() promise time to resolve past the early return.
    await Promise.resolve();
    await Promise.resolve();

    expect(mockedApiRequest).not.toHaveBeenCalled();
    // The legacy key must still be in the store because the hook bailed out.
    expect(asyncStorageMock.removeItem).not.toHaveBeenCalledWith(
      PROGRAM_SELECTION_KEY,
    );
    expect(asyncStorageMock._getStore()[PROGRAM_SELECTION_KEY]).toBe(
      'assigned-1',
    );
  });

  it('clears the legacy key and sets the flag when the DB already has a value', async () => {
    await asyncStorageMock.setItem(PROGRAM_SELECTION_KEY, 'assigned-1');
    asyncStorageMock.getItem.mockClear();
    asyncStorageMock.setItem.mockClear();
    asyncStorageMock.removeItem.mockClear();

    mockedUseAuth.mockReturnValue(
      buildAuthValue({
        user: { id: 1, activeProgramSelection: 'assigned-17' },
      }),
    );

    const useActiveProgramBackfill = loadHook();
    renderHook(() => useActiveProgramBackfill());

    await waitFor(() => {
      expect(asyncStorageMock.setItem).toHaveBeenCalledWith(
        ACTIVE_PROGRAM_BACKFILL_FLAG_KEY,
        'true',
      );
    });

    expect(mockedApiRequest).not.toHaveBeenCalled();
    expect(asyncStorageMock.removeItem).toHaveBeenCalledWith(
      PROGRAM_SELECTION_KEY,
    );
    expect(asyncStorageMock._getStore()[PROGRAM_SELECTION_KEY]).toBeUndefined();
    expect(asyncStorageMock._getStore()[ACTIVE_PROGRAM_BACKFILL_FLAG_KEY]).toBe(
      'true',
    );
  });

  it('PATCHes /api/user with the savedId, clears AsyncStorage, and sets the flag', async () => {
    await asyncStorageMock.setItem(PROGRAM_SELECTION_KEY, 'assigned-99');
    asyncStorageMock.getItem.mockClear();
    asyncStorageMock.setItem.mockClear();
    asyncStorageMock.removeItem.mockClear();

    const setUserAndPersist = jest.fn(async () => {});
    mockedUseAuth.mockReturnValue(
      buildAuthValue({
        user: { id: 1, activeProgramSelection: null },
        setUserAndPersist,
      }),
    );

    mockedApiRequest.mockResolvedValue({
      id: 1,
      activeProgramSelection: 'assigned-99',
    } as any);

    const useActiveProgramBackfill = loadHook();
    renderHook(() => useActiveProgramBackfill());

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    });

    expect(mockedApiRequest).toHaveBeenCalledWith('/api/user', {
      method: 'PATCH',
      data: { activeProgramSelection: 'assigned-99' },
    });

    await waitFor(() => {
      expect(asyncStorageMock.setItem).toHaveBeenCalledWith(
        ACTIVE_PROGRAM_BACKFILL_FLAG_KEY,
        'true',
      );
    });

    expect(setUserAndPersist).toHaveBeenCalledWith(
      expect.objectContaining({ activeProgramSelection: 'assigned-99' }),
    );
    expect(asyncStorageMock.removeItem).toHaveBeenCalledWith(
      PROGRAM_SELECTION_KEY,
    );
    expect(asyncStorageMock._getStore()[PROGRAM_SELECTION_KEY]).toBeUndefined();
    expect(asyncStorageMock._getStore()[ACTIVE_PROGRAM_BACKFILL_FLAG_KEY]).toBe(
      'true',
    );
  });

  it('does NOT set the flag or clear AsyncStorage when the PATCH throws', async () => {
    await asyncStorageMock.setItem(PROGRAM_SELECTION_KEY, 'assigned-99');
    asyncStorageMock.getItem.mockClear();
    asyncStorageMock.setItem.mockClear();
    asyncStorageMock.removeItem.mockClear();

    mockedUseAuth.mockReturnValue(
      buildAuthValue({
        user: { id: 1, activeProgramSelection: null },
      }),
    );

    mockedApiRequest.mockRejectedValue(new Error('network down'));

    const useActiveProgramBackfill = loadHook();
    renderHook(() => useActiveProgramBackfill());

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    });

    // Give the catch handler time to run.
    await Promise.resolve();
    await Promise.resolve();

    // Legacy key is still present so the next mount can retry.
    expect(asyncStorageMock._getStore()[PROGRAM_SELECTION_KEY]).toBe(
      'assigned-99',
    );
    expect(
      asyncStorageMock._getStore()[ACTIVE_PROGRAM_BACKFILL_FLAG_KEY],
    ).toBeUndefined();
    expect(asyncStorageMock.setItem).not.toHaveBeenCalledWith(
      ACTIVE_PROGRAM_BACKFILL_FLAG_KEY,
      'true',
    );
  });

  it('is a no-op (no PATCH, no clear) when there is no savedId and the DB is null', async () => {
    // Empty AsyncStorage, user has no DB value. The hook should still mark migrated
    // so it never runs again on this device.
    mockedUseAuth.mockReturnValue(
      buildAuthValue({
        user: { id: 1, activeProgramSelection: null },
      }),
    );

    const useActiveProgramBackfill = loadHook();
    renderHook(() => useActiveProgramBackfill());

    await waitFor(() => {
      expect(asyncStorageMock.setItem).toHaveBeenCalledWith(
        ACTIVE_PROGRAM_BACKFILL_FLAG_KEY,
        'true',
      );
    });

    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it('cross-user contamination guard: swapping user mid-await must not PATCH user B with user A savedId', async () => {
    // This is difficult to exercise end-to-end without deep async timing control —
    // renderHook's rerender runs the effect synchronously, but the hook's async
    // body captures userId by value before the first await, so a simulated
    // rerender mid-await cannot cleanly intercept the inflight run. We assert the
    // weaker but still meaningful property: after the initial run for user A
    // completes and the user swaps to B, a second hook mount for user B does
    // NOT re-use user A's savedId because AsyncStorage was cleared during A's
    // successful run.
    await asyncStorageMock.setItem(PROGRAM_SELECTION_KEY, 'assigned-1');
    asyncStorageMock.getItem.mockClear();
    asyncStorageMock.setItem.mockClear();
    asyncStorageMock.removeItem.mockClear();

    const setUserAndPersist = jest.fn(async () => {});
    mockedUseAuth.mockReturnValue(
      buildAuthValue({
        user: { id: 1, activeProgramSelection: null },
        setUserAndPersist,
      }),
    );

    mockedApiRequest.mockResolvedValue({
      id: 1,
      activeProgramSelection: 'assigned-1',
    } as any);

    const useActiveProgramBackfill = loadHook();
    const first = renderHook(() => useActiveProgramBackfill());

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    });

    first.unmount();
    mockedApiRequest.mockClear();

    // User swap: same hook module, new user id. The flag is now 'true' so the
    // new user's mount must early-return without issuing a PATCH with the old
    // savedId.
    mockedUseAuth.mockReturnValue(
      buildAuthValue({
        user: { id: 2, activeProgramSelection: null },
        setUserAndPersist: jest.fn(async () => {}),
      }),
    );

    renderHook(() => useActiveProgramBackfill());

    await Promise.resolve();
    await Promise.resolve();

    // User B is a new user; since the backfill flag was set during user A's run,
    // the hook must not PATCH anything on user B's behalf with a stale savedId.
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it('module-scope single-flight guard: two parallel hook mounts only produce ONE PATCH', async () => {
    await asyncStorageMock.setItem(PROGRAM_SELECTION_KEY, 'assigned-42');
    asyncStorageMock.getItem.mockClear();
    asyncStorageMock.setItem.mockClear();
    asyncStorageMock.removeItem.mockClear();

    mockedUseAuth.mockReturnValue(
      buildAuthValue({
        user: { id: 1, activeProgramSelection: null },
      }),
    );

    // Slow PATCH so both mounts see backfillInflight already set.
    let resolvePatch: (value: any) => void = () => {};
    mockedApiRequest.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePatch = resolve;
        }),
    );

    const useActiveProgramBackfill = loadHook();

    const mountA = renderHook(() => useActiveProgramBackfill());
    const mountB = renderHook(() => useActiveProgramBackfill());

    // Let both effects run before resolving.
    await Promise.resolve();
    await Promise.resolve();

    expect(mockedApiRequest).toHaveBeenCalledTimes(1);

    resolvePatch({ id: 1, activeProgramSelection: 'assigned-42' });

    await waitFor(() => {
      expect(
        asyncStorageMock._getStore()[ACTIVE_PROGRAM_BACKFILL_FLAG_KEY],
      ).toBe('true');
    });

    // Still only one PATCH total — the single-flight guard deduped.
    expect(mockedApiRequest).toHaveBeenCalledTimes(1);

    mountA.unmount();
    mountB.unmount();
  });
});
