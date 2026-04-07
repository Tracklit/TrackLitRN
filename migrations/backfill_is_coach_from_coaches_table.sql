-- Migration: Backfill users.is_coach from coaches table
-- Date: 2026-04-06
-- One-time backfill: sync users.is_coach with rows in the coaches table.
-- Addresses drift where users have accepted coach-athlete relationships
-- but is_coach is false, causing silent 403s in /api/programs/:id/assign.
-- Reversible: SET is_coach = false WHERE ... same WHERE clause.

UPDATE users
SET is_coach = true
WHERE is_coach IS NOT TRUE
  AND id IN (
    SELECT DISTINCT user_id FROM coaches WHERE status = 'accepted'
  );
