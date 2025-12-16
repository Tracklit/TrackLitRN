---
name: Mobile-Web Parity
overview: Bring the React Native mobile app into close functional/UI parity with the web app by fixing navigation/layout issues, wiring missing screens and actions, and aligning mobile API/auth behavior with the server routes the web already uses.
todos:
  - id: parity-matrix
    content: Create a web→mobile parity matrix by comparing `client/src/App.tsx` routes to `tracklit-mobile` screens/navigation; produce a tracked backlog of gaps.
    status: completed
  - id: fix-hamburger-overlap
    content: Remove absolute hamburger overlay and implement a consistent screen header/drawer button so it never covers page content.
    status: completed
    dependencies:
      - parity-matrix
  - id: fix-scroll-bottom-cutoff
    content: Standardize ScrollView/FlatList bottom padding and layout so bottom items aren’t hidden and scrolling doesn’t “bounce back” prematurely.
    status: completed
    dependencies:
      - parity-matrix
  - id: drawer-icons-style
    content: Add icons to drawer items and improve drawer styling to match web navigation polish.
    status: completed
    dependencies:
      - fix-hamburger-overlap
  - id: startgun-crash-fix
    content: Fix the Hermes `onError is not a function` crash (likely `react-native-sound` constructor usage with `require()` assets) and verify Start Gun works.
    status: completed
  - id: settings-screen
    content: Add a standalone `SettingsScreen` (and navigation entry) and align settings sections with web expectations.
    status: completed
    dependencies:
      - fix-scroll-bottom-cutoff
  - id: profile-edit-parity
    content: Ensure Profile edits (country/DOB/privacy/club) save reliably via `PATCH /api/user` and improve UX (date picker, validation).
    status: completed
    dependencies:
      - settings-screen
  - id: tools-parity
    content: Audit Tools actions vs web; wire up missing functionality and ensure all tool buttons do something meaningful (or are clearly disabled).
    status: completed
    dependencies:
      - startgun-crash-fix
      - fix-scroll-bottom-cutoff
  - id: meets-results-parity
    content: Bring Meets closer to web parity by adding create-meet and results flows/screens where applicable.
    status: completed
    dependencies:
      - parity-matrix
  - id: clubs-groups-parity
    content: Implement Clubs/Groups screens and API wiring to match web end-user features.
    status: completed
    dependencies:
      - parity-matrix
  - id: marketplace-parity
    content: Align Marketplace flows (listing details/cart/create listing) with web routes and backend endpoints.
    status: completed
    dependencies:
      - parity-matrix
  - id: final-smoke-build
    content: Run mobile smoke tests against Azure backend and ensure iOS/Android builds succeed after changes.
    status: completed
    dependencies:
      - drawer-icons-style
      - profile-edit-parity
      - tools-parity
      - meets-results-parity
      - clubs-groups-parity
      - marketplace-parity
  - id: todo-1765848278013-podrvytzk
    content: Make sure the app builds and runs without errors
    status: pending
---

# Mobile ↔ Web parity plan

## Goals

- **Functional parity**: every tappable control in mobile either performs the same action as web or is clearly labeled “Coming soon” (and doesn’t crash).
- **UI parity**: key layout issues fixed (hamburger overlap, scroll/bottom items hidden), and the drawer matches web navigation structure and styling.
- **Backend parity**: mobile uses the same server endpoints/data as web, with reliable auth (JWT) and consistent error handling.
- **Build confidence**: app builds (iOS + Android) and core backend flows are smoke-tested.

## Current findings (from repo)

- **Mobile already has JWT auth + API wrapper** via `tracklit-mobile/src/contexts/AuthContext.tsx` (uses `/api/mobile/login`) and `tracklit-mobile/src/lib/api.ts` (Bearer token + `env.API_BASE_URL`).
- **Server supports JWT for mobile** in `server/auth.ts` (JWT middleware populates `req.user`, and patches `req.isAuthenticated()` to treat JWT as authenticated).
- **Profile “settings” exists** in `tracklit-mobile/src/screens/ProfileScreen.tsx` (Privacy tab saves `country`, `dateOfBirth`, `defaultClubId`, `isPrivate` via `PATCH /api/user`), but it’s embedded in Profile, not a standalone Settings screen.
- **Hamburger overlap is real**: `tracklit-mobile/App.tsx` renders an absolute hamburger button over the tabs, which can sit on top of `HomeScreen`’s greeting area.
- **Start gun crash is likely a parameter mismatch**: `tracklit-mobile/src/screens/StartGunScreen.tsx` uses `react-native-sound` with `require(...)` assets plus `Sound.MAIN_BUNDLE`; for `require`-based assets, the constructor signature is different and can produce Hermes errors like `onError is not a function`.
- **Big parity gaps vs web routes** (seen in `client/src/App.tsx`): mobile is missing Clubs/Groups, Results, Create Meet, and other end-user pages.

## Approach

We’ll do this in phases so mobile becomes “usable” quickly, then we expand coverage until we reach “most end-user web features” parity.

### Phase 0 — Create a parity matrix (web routes → mobile screens)

- Parse the web route map in `client/src/App.tsx` and group into domains: Home, Practice, Programs, Tools, Meets/Results, Social (Feed/Chat), Clubs/Groups, Marketplace, Rehab, Subscriptions, Profile/Settings.
- Map each to mobile:
- **Already exists** (works)
- **Exists but incomplete** (UI stub, missing action, placeholder alerts)
- **Missing screen**
- **Not desired on mobile** (explicitly deferred)
- Output a tracked ToDo list for every mismatch.

### Phase 1 — Navigation + layout parity (fix what feels broken)

- **Hamburger overlay fix** (your issue: icon sits on top of welcome message)
- Remove the absolute floating hamburger from `tracklit-mobile/App.tsx`.
- Use a consistent header pattern per screen (or a shared `ScreenHeader` component) with a left hamburger button that calls `navigation.openDrawer()`.
- Ensure spacing respects safe-area insets.
- **Scroll/bottom items hidden & “bouncing back” fix**
- Create a shared wrapper (e.g. `ScreenScrollView`) that standardizes:
- `contentContainerStyle` bottom padding = tabBarHeight + safeAreaBottom + extra
- `keyboardShouldPersistTaps`, `showsVerticalScrollIndicator`, and consistent `flexGrow` behavior
- Update key tab screens first: `HomeScreen`, `PracticeScreen`, `ProgramsScreen`, `ToolsScreen`, `ProfileScreen`, `MarketplaceScreen`.
- Audit list-based screens (`FlatList`) to ensure they also have bottom padding and aren’t fighting absolute-positioned overlays.
- **Drawer styling + icons parity** (your request)
- Add icons to each `DrawerItem` in the custom drawer in `tracklit-mobile/App.tsx`.
- Improve drawer visual design (spacing, active item style, section headers, avatar block).

### Phase 2 — Fix “crashers” and wire up buttons to real actions

- **Start gun tool**
- Fix `react-native-sound` constructor usage in `tracklit-mobile/src/screens/StartGunScreen.tsx` for bundled `require()` audio assets (prevents Hermes `onError` crash).
- **Tools parity audit**
- Validate Tools routes from `ToolsScreen` and ensure each tool either:
- navigates to a functional screen, or
- is removed/hidden until ready, or
- is marked “Coming soon” with no errors.
- Fill gaps against web: `PhotoFinishAnalysis` (web has analysis page), `VideoAnalysis`, `ExerciseLibrary`, `VelocityTracker`, `Stopwatch`.

### Phase 3 — Profile + Settings parity

- **Profile edits** (your issue: can’t edit birthday/country/etc)
- Confirm the mobile payload format matches `server/routes.ts` `PATCH /api/user` expectations (it accepts `country`, `dateOfBirth`, `defaultClubId`, `isPrivate`).
- Improve UX:
- Date picker for DOB (instead of raw text)
- Country picker (or at least validated input)
- Clear error messages for club membership requirement (`defaultClubId` can fail if user isn’t a member).
- **Add a real Settings screen** (your issue)
- Create `tracklit-mobile/src/screens/SettingsScreen.tsx`.
- Add it to the stack + drawer.
- Move/duplicate settings sections currently embedded in `ProfileScreen` into the Settings screen.

### Phase 4 — “Most end-user features” parity (per your scope choice)

- **Meets + Results parity**
- Extend `MeetsScreen` to match web capabilities:
- Create meet flow (new screen)
- Results view (new screen)
- Any supporting endpoints already present in `server/routes.ts`
- **Clubs + Groups parity** (missing in mobile)
- Add screens for:
- Clubs list
- Club detail
- Club management
- Create group
- Wire to the same endpoints used by web pages.
- **Marketplace flows**
- Align mobile marketplace listing details/cart/create listing with web routes.
- **Rehab sub-pages parity**
- Ensure rehab sub-pages present in web are navigable in mobile (or explicitly deferred).

### Phase 5 — Backend connectivity + build verification

- Add a repeatable smoke-test checklist:
- Login (JWT)
- Load `/api/user`
- Update profile settings (`PATCH /api/user`)
- Feed fetch + create post
- Programs fetch + program detail
- Video upload endpoints (where supported)
- Build verification:
- iOS simulator build
- Android build

## Key files we’ll leverage/change

- Mobile navigation + drawer: `tracklit-mobile/App.tsx`
- Mobile auth/token: `tracklit-mobile/src/contexts/AuthContext.tsx`
- Mobile API base URL: `tracklit-mobile/src/config/env.ts`, `tracklit-mobile/src/lib/api.ts`
- Layout/scroll fixes across screens: `tracklit-mobile/src/screens/*`
- Server auth + user update endpoints: `server/auth.ts`, `server/routes.ts`
- Web route reference (parity source of truth): `client/src/App.tsx`

## Initial ToDo list (from your report + repo discoveries)

- Fix hamburger button overlapping Home greeting (mobile)
- Fix scroll views so bottom content is reachable (no “bounce back” hiding items)
- Profile edit parity:
- Ensure country/DOB/privacy/club fields can be updated and persist
- Better UX (date picker, validation)
- Add standalone Settings screen + link from drawer/profile
- Tools parity:
- Fix Start Gun crash (`onError is not a function`)
- Validate Stopwatch/Video Analysis/Exercise Library/Velocity Tracker actions
- Align Photo Finish with web (or mark clearly as Coming Soon)
- Drawer parity:
- Add icons to all drawer items
- Improve drawer styling
- Add missing web end-user screens:
- Results
- Create Meet
- Clubs + Groups screens
- Marketplace detail/cart/create listing flows
- Final: ensure builds succeed and core backend calls work end-to-end