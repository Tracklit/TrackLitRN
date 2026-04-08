-- Migration: Backfill users.is_coach from coaches table
-- Date: 2026-04-06
-- One-time backfill: sync users.is_coach with rows in the coaches table.
-- Addresses drift where users have accepted coach-athlete relationships
-- but is_coach is false, causing silent 403s in /api/programs/:id/assign.
-- Reversible: SET is_coach = false WHERE ... same WHERE clause.
--
-- Auto-detects the coaches table's owner column name. The Drizzle schema
-- declares it as "user_id" (dev) but prod has drifted to "coach_id", which
-- the storage layer already works around via getCoachesTableSchema(). This
-- migration uses the same fallback so it runs cleanly on both environments.

DO $$
DECLARE
  owner_col text;
  update_sql text;
BEGIN
  SELECT column_name INTO owner_col
  FROM information_schema.columns
  WHERE table_name = 'coaches'
    AND column_name IN ('user_id', 'coach_id')
  ORDER BY CASE column_name WHEN 'user_id' THEN 1 ELSE 2 END
  LIMIT 1;

  IF owner_col IS NULL THEN
    RAISE NOTICE 'coaches table has neither user_id nor coach_id; skipping backfill';
    RETURN;
  END IF;

  update_sql := format(
    'UPDATE users SET is_coach = true
     WHERE is_coach IS NOT TRUE
       AND id IN (SELECT DISTINCT %I FROM coaches WHERE status = ''accepted'')',
    owner_col
  );

  EXECUTE update_sql;
  RAISE NOTICE 'Backfilled users.is_coach using coaches.% column', owner_col;
END $$;
