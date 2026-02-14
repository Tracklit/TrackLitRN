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
- Sidebar drawer uses solid background (#151a23)

## Recent Changes
- 2026-02-14: Removed main node_modules and backend server workflow — mobile app now connects to Azure production API directly, fixing persistent Nix environment rebuild timeouts
- 2026-02-14: Improved API error handling to detect HTML responses and show "Server unavailable" message
- 2026-02-13: Switched all icons from FontAwesome5 to Phosphor (filled weight)
- 2026-02-13: Restructured bottom nav: removed Sprinthia tab, added Profile tab (6 tabs total)
- 2026-02-13: Made mobile API URL env-var driven — defaults to Azure prod
- 2026-02-12: Imported to Replit, configured PostgreSQL database, pushed schema
