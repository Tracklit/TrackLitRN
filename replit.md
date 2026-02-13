# Tracklit API

## Overview
Tracklit is a full-stack track and field athletics management platform with a React frontend and Express backend. It supports athlete tracking, coaching tools, clubs, chat, video analysis, training programs, and more. The app also has an iOS/React Native mobile companion (not runnable in Replit).

## Tech Stack
- **Frontend**: React 19 + TypeScript, Vite, TailwindCSS, Radix UI, shadcn/ui components
- **Backend**: Express 5 (TypeScript), running via tsx
- **Database**: PostgreSQL (Drizzle ORM)
- **Auth**: Passport.js (local, Google OAuth, Apple Sign-In), JWT tokens
- **Session Storage**: Redis (optional, falls back to memory sessions)
- **External Services** (optional): Stripe payments, SendGrid email, OpenAI, Azure Blob Storage, Google Cloud Storage

## Project Structure
```
client/          - React frontend (Vite)
  src/
    components/  - UI components
    pages/       - Page-level components
    contexts/    - React contexts
    hooks/       - Custom hooks
    lib/         - Utility functions
    styles/      - CSS styles
    types/       - TypeScript types
server/          - Express backend
  routes.ts      - API route definitions
  auth.ts        - Authentication setup
  storage.ts     - Database storage layer
  db.ts          - Database connection
  vite.ts        - Vite dev server integration
shared/          - Shared types and schemas
  schema.ts      - Drizzle database schema
  journal-schema.ts - Journal feature schema
migrations/      - Database migrations
ios/             - iOS/React Native app (not runnable here)
```

## Development
- **Workflow**: `npm run dev` (starts Express + Vite dev server on port 5000)
- **Build**: `npm run build` (builds Vite client to dist/public)
- **Production**: `npm run start` (serves built client from dist/public)
- **Database**: Uses Replit's built-in PostgreSQL via DATABASE_URL

## Key Configuration
- Server binds to `0.0.0.0:5000`
- Vite dev server has `allowedHosts: true` for Replit proxy compatibility
- CORS is enabled for all origins (mobile app support)
- Session secret falls back to defaults if SESSION_SECRET not set
- Redis is optional; falls back to memory-based sessions

## Mobile App (tracklit-mobile/)
- React Native app using Expo SDK 54, runs via Expo Go
- Scheme: `tracklitmobile`
- API base URL configured in `tracklit-mobile/src/config/env.ts` (points to Replit backend)
- Auth uses JWT tokens via `/api/mobile/login` endpoint
- Start Expo: `cd tracklit-mobile && npx expo start --tunnel --port 8081 -c`
- Admin test account: username `admin`, password `password`

## Recent Changes
- 2026-02-13: Fixed mobile app API URL - was pointing to Azure production, now points to Replit backend
- 2026-02-13: Auth bypass added to `/api/user` for dev convenience (auto-login as admin)
- 2026-02-13: Fixed Redis connection blocking by only connecting when REDIS_URL is set
- 2026-02-12: Imported to Replit, configured PostgreSQL database, pushed schema, set up workflows and deployment
