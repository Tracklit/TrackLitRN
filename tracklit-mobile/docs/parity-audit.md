# Web → Mobile Parity Audit (Updated Dec 15, 2025)

## Purpose
Document the functional gaps between the TrackLit web experience (`client/src`) and the React Native app (`tracklit-mobile/`) so we can bring the mobile app to feature parity without regressing the work already done on web.

## Summary of Findings (current state)
1. **Navigation** – Mobile relies on a custom bottom tab bar (`tracklit-mobile/src/navigation/BottomNavigation.tsx`) and does not have a left-side hamburger/drawer menu like the web shell (`client/src/App.tsx`, `client/src/components/ui/hamburger-menu.tsx`). Several secondary destinations are missing or unreachable as a result.
2. **Auth/Data Layer** – Mobile is using real JWT auth (`/api/mobile/login`, `/api/user`) and a generic API client (`tracklit-mobile/src/lib/api.ts`). Parity gaps are primarily due to missing screens/wiring (not stub auth).
3. **Feed** – Mobile has `FeedScreen` + create post + like. It still needs parity with web’s deeper interactions (comments, edit/delete, and consistent avatar usage).
4. **Tools** – Mobile has dedicated tool screens (Stopwatch/StartGun/PhotoFinish/IntervalTimer/Journal), but web-only tools remain missing (Video Analysis, Exercise Library, Velocity Tracker).
5. **Profile & Settings** – Mobile can update name/bio/photo, but does not match web settings (visibility controls, country, date of birth, club, etc.).
6. **Notifications** – Backend supports notification endpoints, but mobile lacks a notifications screen.
7. **Connections/Coaching** – Backend supports `/api/connections` and `/api/coaches*`, but mobile lacks first-class screens for these areas.
8. **Subscriptions** – Backend supports `/api/subscriptions*`, but mobile lacks subscription screens.
9. **Bottom bar overlap** – Some FABs/actions risk being obscured by the absolute-positioned bottom nav; spacing needs standardization.

## Parity Matrix (Web → Mobile)
This table is our checklist: **web source** → **mobile target** → **required actions** → **backend endpoints**.

| Feature area | Web reference | Mobile reference | Required actions for parity | Backend endpoints |
|---|---|---|---|---|
| Hamburger/side menu | `client/src/App.tsx`, `client/src/components/ui/hamburger-menu.tsx` | (missing) | Add left drawer; ensure all items navigate; keep bottom tabs focused on core | n/a |
| Feed | `client/src/pages/feed-page.tsx`, `client/src/pages/feed-post-detail-page.tsx` | `tracklit-mobile/src/screens/FeedScreen.tsx`, `FeedDetailScreen.tsx` | List, filter, create, like, comments/detail parity; edit/delete as supported | `/api/feed`, `/api/feed/posts`, `/api/feed/posts/:id/like` |
| Chat/messages | `client/src/pages/chat-page.tsx`, `messages-page.tsx`, `conversation-detail-page.tsx` | `tracklit-mobile/src/screens/ChatScreen.tsx`, `ChatConversationScreen.tsx` | DM + group list; conversation view; send; mark read; attachments/reactions where supported | `/api/chat/*`, `/api/conversations` |
| Notifications | web shell surfaces notifications | (missing) | List; mark read; mark all read; deep links | `/api/notifications`, `/api/notifications/:id/read`, `/api/notifications/mark-all-read` |
| Programs create/add | `client/src/pages/program-create-page.tsx` | `tracklit-mobile/src/screens/ProgramsScreen.tsx` (no create UI) | Add create program flow and POST; ensure add button not hidden | `/api/programs` (POST) |
| Journal add | `client/src/pages/tools/journal-page.tsx` | `tracklit-mobile/src/screens/JournalScreen.tsx` | Ensure add/save is reachable; list recent entries | `/api/journal` |
| Training tools landing | `client/src/pages/training-tools-page.tsx` | `tracklit-mobile/src/screens/ToolsScreen.tsx` | Replace “Coming Soon” with functional screens | varies |
| Video analysis | `client/src/pages/video-analysis-page.tsx` | (missing) | Implement select/upload + analysis results (as supported) | (discover in `server/`) |
| Exercise library | `client/src/pages/exercise-library-page.tsx` | (missing) | Browse/search exercises; view details | (discover in `server/`) |
| Velocity tracker | `client/src/pages/tools/velocity-tracker.tsx` | (missing) | Implement tracker UI and persistence (as supported) | (discover in `server/`) |
| Rehab | `client/src/pages/rehab-page.tsx`, `client/src/pages/rehab/**` | (missing) | Rehab landing + details; AI consult; assign program | `/api/rehab/ai-consultation`, `/api/rehab/assign-program` |
| Connections | `client/src/pages/connections-page.tsx`, `friends-page.tsx` | (missing) | List connections/friends; add/remove as supported | `/api/connections`, `/api/friends*` |
| Coaches/Athletes | `client/src/pages/coaches-page.tsx`, `athletes-page.tsx`, `my-athletes-page.tsx` | (missing) | List coaches/athletes; manage relationships; coach tools | `/api/coaches`, `/api/coaches/athletes` |
| Spikes | `client/src/pages/spikes-page.tsx`, `spikes-page-new.tsx` | (missing) | Spikes landing and any tracking UI; match web behavior | (discover in `server/`) |
| Subscriptions | `client/src/pages/my-subscriptions-page.tsx`, `subscription-management-page.tsx` | (missing) | My subs; subscribers; offerings; attach programs | `/api/subscriptions*` |
| Google sign-in | `client/src/pages/auth-page.tsx` | (missing) | Mobile OAuth flow that results in a JWT for `Authorization` | `/api/auth/google*` (+ mobile bridge if needed) |

## Notes / common root causes
- **Unreachable screens**: screens exist but aren’t reachable from any button/menu.
- **Bottom bar overlap**: FABs + content padding need a single standard.
- **Endpoint gaps**: some web features may rely on endpoints not yet exposed in a mobile-friendly way.
