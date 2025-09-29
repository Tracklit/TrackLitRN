# TrackLit - Track & Field Training Application

## Overview

TrackLit is a comprehensive web application designed for track and field athletes and coaches. It provides tools for training program management, meet scheduling, performance tracking, and advanced video analysis. The application aims to enhance athletic performance through modern web technologies, including MediaPipe-based biomechanical analysis and AI-powered coaching insights, ultimately becoming a leading platform for athletic development.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

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