# Tracklit Mobile

## Overview
Tracklit is a track and field athletics management platform. This Replit workspace is used exclusively for developing the React Native mobile app. The web frontend and Express backend code exist in the repo but are **not run here** — the mobile app connects directly to the Azure production API.

## Tech Stack (Mobile)
- **Mobile**: React Native (Expo SDK 54), TypeScript
- **Icons**: Phosphor Icons (filled weight)
- **Navigation**: React Navigation (drawer + bottom tabs + stack)
- **API**: Connects to Azure production server (`app-tracklit-prod-tnrusd.azurewebsites.net`)
- **Auth**: JWT tokens via `/api/mobile/login` endpoint

## Project Structure
```
tracklit-mobile/     - React Native mobile app (PRIMARY workspace)
  src/
    screens/         - Screen components
    navigation/      - Navigation setup (BottomNavigation, types)
    components/      - Reusable components (ScreenHeader, etc.)
    contexts/        - React contexts (AuthContext)
    lib/             - API client, utilities
    config/          - Environment config (API URL)
    utils/           - Theme, helpers
  App.tsx            - Root app component with drawer navigation
client/              - React web frontend (NOT run here, synced via GitHub)
server/              - Express backend (NOT run here, synced via GitHub)
shared/              - Shared types and schemas
migrations/          - Database migrations
```

## Development
- **Workflow**: `cd tracklit-mobile && npx expo start --tunnel --port 8081 -c`
- **API**: Mobile app defaults to Azure production server (no local backend needed)
- **To use local backend**: Set `EXPO_PUBLIC_API_BASE_URL` env var to the Replit URL, and install main `node_modules` + run `npm run dev`
- **Admin test account**: username `admin`, password `password`

## Key Configuration
- API base URL configured in `tracklit-mobile/src/config/env.ts`
  - Defaults to Azure production server when no env var is set
  - Can be overridden via `EXPO_PUBLIC_API_BASE_URL` for local dev
- Expo scheme: `tracklitmobile`
- Main `node_modules/` is intentionally NOT installed (saves ~855MB) since the backend runs on Azure
- The `tracklit-mobile/.env` file should NOT exist (was removed to prevent stale API URLs)

## Design Decisions
- All icons use Phosphor with "fill" weight for visual consistency
- Bottom nav has 5 tabs: Home, Practice, Programs, Feed, Tools (Profile accessible via drawer)
- Sprinthia (AI assistant) is a RootStack screen, accessible from HomeScreen cards and drawer menu
- Bottom nav height is 48px with icons properly centered
- Sidebar drawer uses very dark gray background (#1a1a1a) with X close button, blocks touch pass-through
- Practice, Programs, and Tools screens share same styling: no header gradient title, xl horizontal padding, 12px border radius cards, lg gap between cards
- TargetTimesDrawer uses safe area insets for device-safe top padding
- Programs FAB is 64px (15% larger than standard 56), with extra right margin

## Recent Changes
- 2026-02-17: ProgramCreateScreen: replaced FontAwesome5 with Phosphor, removed header gradient, xl padding, 12px border radius
- 2026-02-17: ProgramPickerDropdown: converted from modal to inline scrollable dropdown, alphabetical sorting, "Assign Program" label, right-aligned button
- 2026-02-17: PracticeScreen: uploaded program documents now open in-app via expo-web-browser
- 2026-02-17: ProgramsScreen: removed difficulty/level badge from program cards, uniform 40px search bar height
- 2026-02-17: Bottom nav: icons sized up 15% (20px→23px), container moved down 15px
- 2026-02-17: Programs/Tools: removed header gradient, replaced FontAwesome5 with Phosphor, matched Practice styling
- 2026-02-17: Programs FAB: 15% larger (64px), more right spacing, improved menu UI with icon wrappers, removed Find a Program and Switch to Coach items
- 2026-02-17: TargetTimesDrawer: added safe area insets for device top spacing
- 2026-02-17: Drawer: blocks touch pass-through, X close button, very dark gray background (#1a1a1a)
- 2026-02-18: Onboarding: removed sample program text, switched Lucide to Phosphor icons, restyled cards (16px border-radius, subtle rgba backgrounds)
- 2026-02-18: HomeScreen: added 500ms fade-in animation on mount using Reanimated
- 2026-02-18: ToolsScreen: 2-column grid layout with light gray border, orange dividers, centered icon/text cards
- 2026-02-18: PhotoFinishScreen: full rewrite — upload via expo-image-picker, edge-to-edge inline video, scrub bar, digital clock overlays (tap to place, long-press to remove, syncs with framerate), FPS selector (24/25/30/60/120/240), Save to Library (device + AsyncStorage), saved videos list
- 2026-02-18: MediaPipe pose skeleton overlay in Photo Finish — uses WebView bridge with @mediapipe/tasks-vision JS SDK, expo-video-thumbnails for frame capture, PoseOverlay draws 33 landmarks + skeleton connections
- 2026-02-18: Advanced Analysis panel in Photo Finish — computes 7 metrics from pose data: joint angles, body symmetry, center of mass, stride/position metrics, trunk lean angle, frame comparison, confidence scoring
- 2026-02-18: Confidence-based color coding on PoseOverlay landmarks (green=high, yellow=medium, red=low visibility)
- 2026-02-18: Frame Comparison feature — capture two frames with skeleton overlays, compare side-by-side with time/frame diff
- 2026-02-18: AI Analysis via Sprinthia API — sends structured pose metrics for written biomechanics analysis with improvement suggestions and "Create Program" button
- 2026-02-18: New files: poseAnalysis.ts (metrics computation), AdvancedAnalysis.tsx (collapsible metrics panel), FrameComparison.tsx, AIAnalysisModal.tsx
- 2026-02-19: StartGunScreen: removed title text, added 25px spacing below start button, added Gun Flash toggle (flashes device torch on bang via hidden CameraView), torch timer cleanup on reset/unmount
- 2026-02-19: ToolsScreen: Photo Finish icon changed to FilmStrip, Start Gun icon changed to PersonSimpleThrow
- 2026-02-19: app.json: added expo-camera plugin with camera permission for iOS/Android flash feature
- 2026-02-19: Photo Finish: separated analysis into FullAnalysisModal — video stays fullscreen, ChartBar icon opens modal with all analysis content
- 2026-02-19: Added velocity & acceleration tracking — stores landmark history across frames, computes motion derivatives for 7 body parts, new Motion tab in analysis
- 2026-02-19: Joint angle toggle on skeleton — Angle icon button shows/hides degree labels at each joint on PoseOverlay
- 2026-02-19: New file: FullAnalysisModal.tsx (wraps AdvancedAnalysis + FrameComparison in slide-up modal)
- 2026-02-19: StopwatchScreen: doubled start button (140→240px), fixed timer accuracy using Date.now() instead of setInterval increments, added volume-up button start/stop via react-native-volume-manager (debounced, requires dev build), info text hint, increased spacing (gap 32px)
- 2026-02-19: StartGunScreen: phase command card made half-width (50-60%), centered with bottom spacing
- 2026-02-19: HomeScreen: Bell icon 18→22, PaperPlaneTilt 16→19 (20% size up), notification badge enlarged (minWidth 20, height 20, more padding)
- 2026-02-19: Ticker: removed pause/play button, tap-to-expand modal with full message, Like (local toggle) and Save to Journal (POST /api/journal) actions
- 2026-02-19: ChatScreen: full Telegram-style restyle — flat chat rows with large avatars, merged groups+DMs sorted by recency, orange unread pills, Phosphor icons, orange FAB
- 2026-02-19: ChatConversationScreen: Telegram dark theme — blue own bubbles (#2b5278), dark other bubbles (#1e2c3a), date separators, inline timestamps with check marks, Phosphor icons, orange send button
- 2026-02-19: PhotoFinishScreen: upload section wrapped in dashed-border card (16px radius, rgba bg) for clear tap affordance
- 2026-02-19: BottomNavigation: removed Profile tab (5 tabs: Home, Practice, Programs, Feed, Tools), Profile still accessible via drawer
- 2026-02-19: Ticker replaced with Instagram-style horizontal carousel — circular profile image cards with type badges (journal=orange Book, feed=indigo Newspaper, system=red dot), infinite loop scrolling via 3x data duplication, taps open detail modal
- 2026-02-19: Ticker animation: changed from horizontal slide to vertical — new messages slide in from top, old messages slide out to bottom
- 2026-02-17: Ticker animation: smooth slide-and-fade with Reanimated (translateX + opacity + scale, easeOutCubic)
- 2026-02-20: PublicProfileScreen: full AAA sports game rewrite — dark bg (#0E0F14), stadium hero background, gradient avatar border (blue→purple→cyan), glass summary panel (Cards/Connections/Leaderboard Rank), Digital Athlete Card with gradient border, athlete name/event, Level badge, XP bar (animated 800ms), PB/SB/Rank stats in glass panels, Recent Form SVG graph, Connect/Message buttons (visitor) vs Edit Profile (owner), Connections list
- 2026-02-20: Profile edit mode: avatar upload (camera/library/remove), Action Shot upload for athlete card image, editable PB/SB via modal input, editable event text, all data persisted to AsyncStorage per user, save/cancel buttons, unsaved changes warning on back navigation
- 2026-02-20: Drawer: added "My Profile" link (UserCircle icon) that navigates to PublicProfileScreen with own user data, disabled for guests
- 2026-02-20: Design spec: one screen serves both own profile and public profile views (like Instagram)
- 2026-02-14: Removed main node_modules and backend server workflow — mobile app now connects to Azure production API directly, fixing persistent Nix environment rebuild timeouts
- 2026-02-14: Improved API error handling to detect HTML responses and show "Server unavailable" message
- 2026-02-13: Switched all icons from FontAwesome5 to Phosphor (filled weight)
- 2026-02-13: Restructured bottom nav: removed Sprinthia tab, added Profile tab (6 tabs total)
- 2026-02-13: Made mobile API URL env-var driven — defaults to Azure prod
- 2026-02-12: Imported to Replit, configured PostgreSQL database, pushed schema
