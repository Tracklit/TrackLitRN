# Feature Review: Teammate's 62-Commit Update

Tracking doc for reviewing and fixing the new feature set pulled into main on 2026-04-04.

## Features to Test

### 1. Journal Entries
- **Navigate:** Home > Journal card, or Drawer > Journal
- **Backend:** Existing journal endpoints
- **Status:** [ ] Tested

### 2. Changed Onboarding
- **Navigate:** Fresh app open / new account (full-screen overlay carousel)
- **Includes:** Welcome Spikes modal, multi-step carousel
- **Status:** [ ] Tested

### 3. Role Picker (Coach/Athlete)
- **Navigate (onboarding):** Final onboarding step shows role picker
- **Navigate (settings):** Drawer > Account & Settings > Coach toggle
- **Backend:** `PATCH /api/user/coach-status` with `{ isCoach: boolean }`
- **Verify:** Bottom tab bar updates (Coach Dashboard tab appears/disappears), drawer menu updates
- **Status:** [ ] Tested

### 4. Coach Dashboard
- **Navigate:** Bottom tab "Coach's Dashboard" (coach role only), or Drawer > Dashboard
- **Backend:** `GET /api/coach/athletes`, `GET /api/coach/mood-stats`, `GET /api/coach/journal-entries`
- **Status:** [ ] Tested

### 5. Team Mood Board + Sub-pages
- **Navigate:** Coach Dashboard > Team Mood Board
- **Sub-pages:** Tap athlete card > CoachAthleteDetail > CoachJournalEntry / CoachAssignProgram
- **Backend:** `GET /api/coach/mood-stats`, `GET /api/coach/athletes/:id/mood-entries`
- **Status:** [ ] Tested

### 6. Sprinthia -> Aria Rename
- **Navigate:** Bottom tab "Aria", or Drawer > Training > Aria
- **Verify:** All branding/references updated from "Sprinthia" to "Aria"
- **Status:** [ ] Tested

### 7. Group Creation + Profile Image Upload
- **Navigate:** Drawer > Group Chat > Create Group
- **Backend:** `POST /api/chat/groups` (with FormData image), `POST /api/chat/groups/:id/image`
- **Verify:** Image picker works, image uploads successfully, shows in group settings
- **Status:** [ ] Tested

---

## Fixes & Additions Made

### Fix: Add Athlete button missing from mobile (both screens)
- **Problem:** The mobile app had no way to add connections as athletes. The web app has an "Add Athlete" dialog but it was never ported to mobile. Coach sees "No athletes yet" with no action to take.
- **Fix:** Added an "Add" button and bottom-sheet modal to both screens. Fetches `/api/friends`, filters out existing athletes, and calls `POST /api/coach/athletes` with the selected user's ID.
- **Files:** `tracklit-mobile/src/screens/MyAthletesScreen.tsx`, `tracklit-mobile/src/screens/CoachDashboardScreen.tsx`

### Fix: Bottom navbar disappears when switching to Athlete mode
- **Problem:** Toggling from Coach to Athlete made the entire bottom navbar disappear, not just the Coach Dashboard tab.
- **Root cause:** `BottomNavigation.tsx` was **replacing** the Training tab with Coach Dashboard (`map` + swap). When switching back to Athlete, the tab navigator's active index could point to a mismatched route, breaking the render.
- **Fix:** Changed to **inserting** Coach Dashboard after Home (via `splice`) so the coach tab is additive. Athlete mode simply removes it without shifting other tab positions.
- **File:** `tracklit-mobile/src/navigation/BottomNavigation.tsx`

### Fix: Group creation limit counting all groups, not just owned ones
- **Problem:** "Free plan allows up to 3 groups" error shown even when the user hadn't created 3 groups.
- **Root cause:** `CreateGroupScreen` fetched `/api/chat/groups` which returns all groups the user is a **member** of (including groups created by others and public groups), then compared that total count against the tier limit.
- **Fix:** Filter the groups list to only count groups where `created_by` matches the current user's ID.
- **File:** `tracklit-mobile/src/screens/CreateGroupScreen.tsx`

### Fix: Group image not persisting after creation
- **Problem:** Group image upload appeared successful but the image was never saved. Same for `is_private`, `admin_ids`, `member_ids`, and `invite_code`.
- **Root cause (DB):** The `chat_groups` table was missing columns: `image`, `is_private`, `admin_ids`, `member_ids`, `invite_code`. The backend dynamically checks for column existence and silently skips inserts for missing columns.
- **Root cause (cache):** The backend caches column names in-memory (`tableColumnsCache`) and never invalidates. Even after adding columns, the running server still uses the stale cache until restarted. The production App Service (`app-tracklit-prod-tnrusd.azurewebsites.net`) needed a deploy/restart to pick up the new columns.
- **Fix (DB):** Added missing columns via `ALTER TABLE`, backfilled `member_ids` from `chat_group_members` and `admin_ids` from `created_by`.
- **Fix (mobile):** Added a follow-up `PATCH /api/chat/groups/:id` call with the image after group creation, so the image is persisted even if the initial POST didn't store it due to stale cache. This makes the flow resilient regardless of server cache state.
- **Files:** `tracklit-mobile/src/screens/CreateGroupScreen.tsx`
- **Database:** `chat_groups` table on `pg-tracklit-prod-tnrusd`
- **Note:** A deploy (push to main) will restart the App Service and clear the column cache permanently.

### Fix: Duplicate key error on Chat screen after group creation
- **Problem:** React error "Encountered two children with the same key `group-2`" when navigating to Chat after creating a group.
- **Root cause:** The `/api/chat/groups` endpoint can return the same group twice during query cache transitions (stale + fresh data merging). The chat list uses `${kind}-${id}` as React keys, so duplicates cause a crash.
- **Fix:** Added deduplication by group ID in the `groupsQuery` fetch function in `ChatScreen.tsx`.
- **File:** `tracklit-mobile/src/screens/ChatScreen.tsx`

### Fix: app.json merge conflict resolution
- **Problem:** Merge conflict between teammate's EAS project ID and local build config.
- **Fix:** Kept local `projectId` (424d40d0...) and `owner: "rowexian"` for TestFlight continuity, took remote's `versionCode: 4`.
- **File:** `tracklit-mobile/app.json`

---

## Known Pre-existing Issues

- `SprinthiaScreen.tsx` has 2 TypeScript errors: `Tier` type includes `'star'` which doesn't exist in `TIER_LIMITS` or `TIER_DISPLAY_NAMES`. Not introduced by this feature set.
