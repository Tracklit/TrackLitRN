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
- Bottom nav has 6 tabs: Home, Practice, Programs, Feed, Tools, Profile
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
- 2026-02-18: ToolsScreen: 160px tall cards (2x previous) with purple gradient matching Practice, auto-scrolling vertical carousel that loops
- 2026-02-17: Ticker animation: smooth slide-and-fade with Reanimated (translateX + opacity + scale, easeOutCubic)
- 2026-02-14: Removed main node_modules and backend server workflow — mobile app now connects to Azure production API directly, fixing persistent Nix environment rebuild timeouts
- 2026-02-14: Improved API error handling to detect HTML responses and show "Server unavailable" message
- 2026-02-13: Switched all icons from FontAwesome5 to Phosphor (filled weight)
- 2026-02-13: Restructured bottom nav: removed Sprinthia tab, added Profile tab (6 tabs total)
- 2026-02-13: Made mobile API URL env-var driven — defaults to Azure prod
- 2026-02-12: Imported to Replit, configured PostgreSQL database, pushed schema
