import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import {
  PROGRAM_SELECTION_KEY,
  ACTIVE_PROGRAM_BACKFILL_FLAG_KEY,
} from '@/utils/programSelection';

// Module-scope single-flight state shared across all hook instances. Multiple screens
// (PracticeScreen + HomeScreen) calling this hook will share one in-flight promise and one
// per-user completion marker, so no two instances can ever double-PATCH or get into a state
// where one instance's failure pins another instance's ref.
let backfillInflight: Promise<void> | null = null;
let lastRanForUserId: number | null = null;

// Exported for tests only.
export const __resetActiveProgramBackfillForTests = () => {
  backfillInflight = null;
  lastRanForUserId = null;
};

export const useActiveProgramBackfill = () => {
  const { user, setUserAndPersist } = useAuth();

  useEffect(() => {
    const userId = user?.id;
    if (!userId || typeof userId !== 'number') return; // skip guests and unauthenticated
    if (lastRanForUserId === userId) return; // already ran for this user in this process
    if (backfillInflight) return; // another hook instance is handling it

    // Claim the work for this user. `lastRanForUserId` is set inside the single-flight
    // branch so a losing sibling instance cannot pin its own ref.
    lastRanForUserId = userId;

    const run = async () => {
      try {
        const alreadyMigrated = await AsyncStorage.getItem(ACTIVE_PROGRAM_BACKFILL_FLAG_KEY);
        if (alreadyMigrated === 'true') return;

        // Re-check that the user hasn't swapped mid-await. If it has, abort — the next
        // effect run for the new user will handle it.
        if (user?.id !== userId) return;

        const savedId = await AsyncStorage.getItem(PROGRAM_SELECTION_KEY);

        // If the DB already has a value (user signed in on another device first), don't
        // overwrite. Just clear the legacy key and mark migrated. Intentional snapshot
        // read of user.activeProgramSelection — this hook only runs once per install so
        // staleness here is not a concern.
        if (user?.activeProgramSelection != null) {
          await AsyncStorage.removeItem(PROGRAM_SELECTION_KEY);
          await AsyncStorage.setItem(ACTIVE_PROGRAM_BACKFILL_FLAG_KEY, 'true');
          return;
        }

        if (savedId && savedId.length > 0) {
          if (user?.id !== userId) return;
          const updated = await apiRequest<any>('/api/user', {
            method: 'PATCH',
            data: { activeProgramSelection: savedId },
          });
          if (user?.id !== userId) return;
          if (updated && typeof updated === 'object') {
            await setUserAndPersist(updated);
          }
        }

        await AsyncStorage.removeItem(PROGRAM_SELECTION_KEY);
        await AsyncStorage.setItem(ACTIVE_PROGRAM_BACKFILL_FLAG_KEY, 'true');
      } catch (err) {
        // Network / PATCH failure — release the claim so the effect re-runs on next screen
        // remount or cold start. Do not set the AsyncStorage flag.
        lastRanForUserId = null;
      }
    };

    backfillInflight = run().finally(() => {
      backfillInflight = null;
    });
  }, [user?.id]);
};
