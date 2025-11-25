# Web → Mobile Parity Audit (Nov 17, 2025)

## Purpose
Document the functional gaps between the TrackLit web experience (`client/src`) and the React Native app (`tracklit-mobile/`) so we can bring the mobile app to feature parity without regressing the work already done on web.

## Summary of Findings
1. **Navigation/Routes** – Web’s bottom navigation (`client/src/components/layout/bottom-navigation.tsx`) exposes Home, Practice, Programs, Feed, Tools, and Profile (with avatar state and feed-specific anchor behavior). The RN nav (`tracklit-mobile/src/navigation/BottomNavigation.tsx`) still surfaces Home, Practice, Programs, Race, Tools, Sprinthia. There is no notion of Feed/Profile tabs, disabled states, or conditional visibility.
2. **Auth/Data Layer** – Web relies on real authentication (`useAuth`) and backend APIs; the RN `AuthContext` (`tracklit-mobile/src/contexts/AuthContext.tsx`) is a stub that fakes login/register flows. Without a real token/user, features like feed, notifications, or avatars cannot function.
3. **Feed & Community** – The web app now has full feed list/detail views (`client/src/pages/feed-page.tsx`, `client/src/pages/feed-post-detail-page.tsx`) backed by `/api/feed`, likes, comments, pull-to-refresh, filters, and compose/edit dialogs. RN has no feed screen or API plumbing; there is also no navigation target for `/feed` or `/feed/:id`.
4. **Tools & Start Gun** – Web tools such as Start Gun (`client/src/pages/tools/start-gun-page.tsx`), Stopwatch, Photo Finish, etc. contain rich interactions (audio unlock, flash control, camera recording). RN’s `ToolsScreen` (`tracklit-mobile/src/screens/ToolsScreen.tsx`) shows static cards with “Coming Soon” alerts, and there are no dedicated tool screens besides the basic Stopwatch placeholder.
5. **Practice & Journal** – Web practice cards (`client/src/pages/practice-page.tsx`) consume real program data, respect gym sessions, and tag interactive controls (`data-testid="button-finish-session"`). RN’s `PracticeScreen` uses hard-coded mock workouts, tabs, and lacks any journal modal or data integration.
6. **Home Experience** – Web home (`client/src/pages/home-page.tsx`) includes the collapsible community ticker/Feed entry, dynamic stats, and message/notification components. RN `HomeScreen` is missing ticker, feed CTA, notifications, and profile nav (currently just an alert).
7. **Shared UI (Avatars, Badges, Headers)** – Web components such as `optimized-avatar` handle fallbacks, skeletons, and feed-specific badges (`client/src/components/ui/optimized-avatar.tsx`, `client/src/components/ui/badge.tsx`). RN equivalents (`tracklit-mobile/src/components/ui/Avatar.tsx`, `Badge.tsx`) are minimal and don’t expose the same props or visuals, which will be required for feed/profile parity.
8. **Audio/Asset Handling** – Web start-gun references `/bang.mp3`, `/set.mp3`, `/on-your-marks.mp3` in `public/`. The RN project currently has no bundled audio assets or utilities for low-latency playback, which we will need before porting the start-gun interaction.
9. **Routing Shell** – Web `App.tsx` coordinates header, hamburger menu, protected routes, and route-based padding. RN `App.tsx` swaps entire screens via local state and lacks any stack navigation or shared header/hamburger components, so there’s no way to push feed detail routes or hide chrome per screen.

## Next Steps
- Rework the RN app shell to use a proper navigator (stack + bottom tabs) that mirrors web routes and allows Feed/Profile destinations.
- Implement real Auth + API clients so feed/tool endpoints can be called from mobile.
- Port Feed list/detail screens, along with OptimizedAvatar and social interactions.
- Add tool-specific screens (Start Gun, Photo Finish, Stopwatch parity) with the same UX as web, including audio assets.
- Replace mock data (Home stats, Practice workouts, Journal) with API-driven content or at least shared utility structures so parity stays maintainable.

