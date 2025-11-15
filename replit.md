# TrackLit - Track & Field Training Application

## Overview

TrackLit is a comprehensive web application designed for track and field athletes and coaches. It provides tools for training program management, meet scheduling, performance tracking, and advanced video analysis. The application aims to enhance athletic performance through modern web technologies, including MediaPipe-based biomechanical analysis and AI-powered coaching insights, ultimately becoming a leading platform for athletic development.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Navigation Redesign & Chat Filtering System (November 15, 2025)**: Consolidated navigation and enhanced chat filtering
  - **Chat page filtering**: Replaced My Chats/Public Chats toggle with comprehensive filter dropdown supporting: All Chats, Unread, Unanswered, DMs, Public, Private
  - **Advanced filtering**: Users can now filter chats by unread status, direct messages only, or visibility (public/private)
  - **Bottom navigation update**: Removed AI Sprinthia item and replaced with user Profile avatar
  - **Top header cleanup**: Removed user profile dropdown menu from top bar (now accessible via bottom nav)
  - **Exercise Library empty state**: Refined with minimal design - removed icon and text, centered "Add Your First Video" button with expanded padding (py-48, min-h-500px)
  - **Improved navigation flow**: User profile now accessible from bottom navigation bar for better mobile UX
- **Journal Page Redesign & New Entry Creation (November 12, 2025)**: Complete visual overhaul and added manual entry creation
  - **Restyled journal page** to match new design patterns: dark slate gradients, glassmorphism cards, purple-pink gradient accents
  - **Added "New Entry" button** with purple-pink gradient for creating journal entries directly from journal page
  - **Implemented create dialog** with title input (required) and large textarea for notes
  - **Automatic timestamps** - entries are timestamped at creation time by the backend
  - **Improved UI consistency** - removed page titles/descriptions, added hover effects, gradient badges
  - **Enhanced loading/empty states** - dual-ring spinner and helpful empty state messages
  - Users can now add personal journal entries alongside automated training session entries
- **Start Gun Overlapping Audio Fix (November 12, 2025)**: Completely resolved overlapping sound sequences in Start Gun tool
  - **Implemented sequence ID system**: Each sequence gets a unique incrementing ID that invalidates all previous sequences
  - **Added 600ms cooldown**: Enforced minimum time between ANY button presses (Start or Reset) to prevent rapid spam
  - **Sequence validation**: All audio callbacks check if their sequence ID matches the current active ID before executing
  - **Timestamp-based protection**: Both Start and Reset buttons track last action timestamp to prevent overlapping sequences
  - **Result**: Impossible to create overlapping audio even with rapid alternating button taps between Start and Reset
- **Public Chat Channels Access Fix (November 11, 2025)**: Resolved 403 errors preventing users from accessing public chat channels
  - **Fixed permission checks** to allow public channels to be accessed by all users, not just members
  - **Updated GET messages endpoint** to allow reading messages from public channels
  - **Updated POST messages endpoint** to allow posting to public channels
  - **Updated group details endpoint** to allow viewing public channel information
  - **Fixed unread counts endpoint** returning 400 by removing duplicate route handlers in routes.ts
  - **Removed duplicate routes** that were overriding fixed handlers in chat-routes-simple.ts
  - **Public channels now accessible** without requiring users to join first
- **CRITICAL: Production URL Configuration Fix (October 27, 2025)**: Resolved app not loading in production by eliminating hardcoded localhost URLs
  - **Created URL helper utility** (`server/utils/url-helper.ts`) that automatically detects the correct base URL in both development and production
  - **Updated password reset emails** to use dynamic URLs instead of hardcoded localhost (fixed in `server/auth.ts`)
  - **Fixed club invite links** to use production URLs instead of localhost fallback (fixed in `server/routes.ts`)
  - **Proper environment detection** using Replit's deployment environment variables (`REPL_SLUG`, `REPL_OWNER`, `REPLIT_DEPLOYMENT_URL`)
  - **OAuth-ready configuration** with helper function for OAuth callback URLs supporting both dev and production
  - **Production deployment now works correctly** with proper URL resolution for emails, invites, and OAuth flows
- **CRITICAL: Authentication Flow Fix (September 29, 2025)**: Completely resolved authentication failures and infinite redirect loops in production
  - **Enhanced production environment detection**: Improved detection logic to properly identify production environments even when NODE_ENV isn't set to 'production'
  - **Robust session configuration**: Fixed sameSite cookie settings and proxy trust configuration for production deployment environments
  - **Eliminated infinite authentication loops**: Added timeout mechanisms and retry logic to prevent client-side authentication from getting stuck
  - **Enhanced error handling**: Added detailed logging and fallback mechanisms for authentication failures
  - **Production-ready authentication**: Users now properly redirect to login page when unauthenticated, with session management working correctly in all environments
- **CRITICAL: Production Static Asset Fix (September 29, 2025)**: Resolved 500 errors on alpha.tracklitapp.com for CSS, JS, and favicon assets
  - **Fixed environment detection**: Server was incorrectly defaulting to development mode due to `app.get("env")` vs `process.env.NODE_ENV` mismatch
  - **Implemented direct asset serving**: Bypassed problematic express.static middleware with custom `/assets/*` route handler
  - **Configured proper deployment**: Set up autoscale deployment with correct build (`npm run build`) and run (`node dist/index.js`) commands
  - **Static assets now serve correctly** with proper Content-Type headers (CSS as text/css, JS as application/javascript)
- **Target Times Production Deployment Fix (September 27, 2025)**: Successfully resolved critical TypeScript compilation errors blocking production deployment
  - **Reduced compilation errors from 80+ to ~45** by fixing missing schema imports (trainingPrograms, meetInvitations, passwordResetTokens, User)
  - **Removed timing-settings route** - eliminated all references to timing-settings-page.tsx and related route configurations
  - **Fixed critical mediapipe-simple import issue** with proper error handling for optional services
  - **Corrected apiRequest parameter ordering** (method first, then URL) for proper API communication
  - **Configured production deployment** with autoscale settings for clean production builds
  - **Clean timing settings data flow**: Users can now set preferences via practice page timing drawer without separate timing settings page
- **Target Times API Fix (September 27, 2025)**: Resolved critical 500 errors preventing Target Times functionality from working
  - Fixed database schema enum mismatch: Updated timing preference from `['on_movement', 'first_foot']` to `['reaction', 'firstFoot', 'onMovement']`
  - Updated all frontend forms and validation to use correct enum values (`onMovement`, `firstFoot`, `reaction`)
  - Eliminated 400/500 API errors on `/api/athlete-profile` endpoints that were blocking Target Times calculations
  - Target Times localStorage persistence was already correctly implemented and now functions properly
- **White Page Fix (September 27, 2025)**: Resolved persistent white page issue on root path (`/`) with comprehensive loading state improvements and cache-busting measures
  - Added immediate loading screen with branded design to prevent white page during app initialization
  - Implemented cache-busting headers in server configuration to prevent JavaScript/CSS caching issues
  - Enhanced authentication flow with better loading state management
  - Added timestamp-based version tracking for development cache invalidation
- Previously completed Target Times drawer modernization with proper spacing and glassmorphism design
- Successfully implemented localStorage-based program selection persistence to prevent assignments reverting to latest created program
- Fixed authentication redirect conflicts between ProtectedRoute and MainApp components

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: Radix UI primitives with shadcn/ui
- **Styling**: Tailwind CSS
- **Mobile Optimization**: Native app-like swipe navigation and mobile-first design.

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js (local strategy, session management)
- **File Storage**: Local filesystem with multer
- **Core Features**:
    - Role-based user management (athlete, coach, admin) and premium tiers.
    - Custom training programs with Google Sheets integration, progress tracking, and journal entries.
    - Video analysis using MediaPipe for pose detection, real-time overlays, and AI-powered feedback via OpenAI GPT-4.
    - Meet management for event planning, results tracking, and weather integration.

### System Design Choices
- **Data Flow**:
    - Video Analysis: `Video Upload → MediaPipe Python Script → Pose Landmarks → Database Storage → React Component Visualization`
    - Training Programs: `Google Sheets → CSV Import → Database Sessions → Assignment to Athletes → Progress Tracking`
    - Authentication: `User Login → Passport.js Validation → Session Creation → Role-based Route Protection`
- **UI/UX**: Focus on clean, modern design with consistent 6px corner rounding, unified card styling, and a dark slate theme. Mobile-first approach with touch-optimized interactions and intuitive navigation. Visual consistency is maintained across different sections using shared gradients and color schemes.
- **Performance**: Client-side image compression (WebP), lazy loading, server-side image processing, and optimized data fetching with skeleton loaders and smooth transitions.

## External Dependencies

- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle
- **File Processing**: Sharp (image optimization), FFmpeg (video processing)
- **AI Integration**: OpenAI API
- **Computer Vision**: MediaPipe
- **Payments**: Stripe
- **Weather Data**: WeatherAPI.com
- **Maps**: Google Maps API
- **Athletics Data**: World Athletics API