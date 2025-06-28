# TrackLit - Track & Field Training Application

## Overview

TrackLit is a comprehensive web application for track and field athletes and coaches, built with a React frontend and Express backend. The application provides tools for training, meet management, performance tracking, video analysis, and social features. It combines modern web technologies with specialized athletic performance features including MediaPipe-based biomechanical analysis and AI-powered coaching insights.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight routing library)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom utility classes
- **Mobile Optimization**: Native app-like swipe navigation and mobile-first design

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Build Tool**: Vite for development and esbuild for production
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and session management
- **File Storage**: Local filesystem with multer for uploads
- **External APIs**: OpenAI, Weather API, World Athletics API integration

## Key Components

### Core Features
1. **User Management & Authentication**
   - Role-based access (athlete, coach, admin)
   - Session-based authentication with secure password hashing
   - Premium subscription tiers (free, pro, star)

2. **Training & Performance Tracking**
   - Custom training programs with Google Sheets integration
   - Progress tracking and performance analytics
   - Journal entries with mood tracking capabilities

3. **Video Analysis System**
   - MediaPipe-based pose detection and biomechanical analysis
   - Real-time pose overlays and motion tracking
   - AI-powered performance feedback using OpenAI GPT-4

4. **Meet Management**
   - Event planning and scheduling
   - Results tracking and performance comparisons
   - Weather integration for outdoor events

5. **Social & Communication Features**
   - Coach-athlete relationships
   - Group messaging and clubs
   - Notification system with automated reminders

### Mobile Experience
- Native app-like swipe navigation between pages
- Touch-optimized interface with gesture support
- Responsive design with proper viewport handling
- Keyboard context awareness for form interactions

## Data Flow

### Video Analysis Pipeline
```
Video Upload → MediaPipe Python Script → Pose Landmarks → Database Storage → React Component Visualization
```

### Training Program Flow
```
Google Sheets → CSV Import → Database Sessions → Assignment to Athletes → Progress Tracking
```

### Authentication Flow
```
User Login → Passport.js Validation → Session Creation → Role-based Route Protection
```

## External Dependencies

### Core Technologies
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle with migrations support
- **File Processing**: Sharp for image optimization, FFmpeg for video processing
- **AI Integration**: OpenAI API for performance analysis
- **Computer Vision**: MediaPipe for pose detection

### Third-Party Services
- **Payments**: Stripe for subscription management
- **Weather**: WeatherAPI.com for forecast data
- **Maps**: Google Maps API for location services
- **Athletics Data**: World Athletics API for competition data

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint & Prettier**: Code quality and formatting
- **Replit**: Development environment with integrated deployment

## Deployment Strategy

### Production Environment
- **Platform**: Replit autoscale deployment
- **Build Process**: Vite builds frontend to `dist/public`, esbuild bundles server
- **Static Assets**: Served directly by Express from public directory
- **Database**: Neon PostgreSQL with connection pooling
- **Environment Variables**: Secure management of API keys and secrets

### Development Workflow
- **Hot Reload**: Vite HMR for frontend, tsx for backend auto-restart
- **Database Migrations**: Drizzle Kit for schema management
- **Asset Management**: Local file uploads with cleanup services

## Recent Changes
- June 28, 2025: Fixed dashboard positioning and chat overlay stability
  - Resolved dashboard shifting during chat transitions by implementing stable layout container with absolute positioning
  - Fixed dashboard vertical position - adjusted marginTop from -15px to 115px for optimal content positioning
  - Created isolated chat overlay system that prevents layout reflow in main content
  - Chat transitions now maintain dashboard stability while preserving smooth animation effects
  - Fixed JSX structure and indentation issues in App.tsx routing configuration
  - Resolved ticker overlap with dashboard cards by moving ticker back to original position (top-[45px]) and moving entire page up 100px
  - Adjusted dashboard marginTop from 115px to 15px to move content higher and eliminate overlap
  - Added 20px spacing above ticker (moved from top-[45px] to top-[65px]) and 20px below (increased padding from pt-32 to pt-40)
  - Removed ChatButton from top bar and temporarily removed InstallAppButton for cleaner interface
  - Reinstated InstallAppButton with full PWA installation functionality and Spikes reward system
  - Replaced bottom navigation chat icon (Users) with custom flame icon while preserving red dot notification functionality
  - Removed badge functionality from chat icon and doubled its size (h-10 w-10)
  - Replaced flame icon with filled speech bubble icon (MessageCircle) in bottom navigation
  - Removed floating icon completely from chat page

- June 28, 2025: Fixed channel settings and image upload functionality
  - Restored channel settings page with all prior functionality including group management, member administration, and profile image updates
  - Fixed channel profile image updates - images now properly display in channel list after upload
  - Improved cache invalidation strategy using removeQueries and refetchQueries for immediate UI updates
  - Fixed routing from chat header settings button to proper `/chats/groups/{id}/settings` URL
  - Channel settings page fully operational with proper navigation and data persistence

- June 28, 2025: App startup issues resolved and fully operational
  - Fixed missing OpenAI API key for voice transcription functionality
  - Fixed missing Stripe API keys for payment processing
  - Temporarily disabled Firebase authentication (using session-based auth)
  - Added proper error handling for missing Stripe public key in checkout
  - React/Express web application running successfully with all core features
  - Mobile-optimized interface working properly with touch interactions
  - All background services (Google Sheets sync, video cleanup) operational

- June 28, 2025: Completed mobile-only optimization
  - Removed all desktop functionality including mouse event handlers and hover states
  - Eliminated desktop-specific CSS classes (md:, lg:, xl: breakpoints) from bottom navigation
  - Removed all hover states from hamburger menu components to optimize for touch-only interactions
  - Simplified chat page to use touch-only drag-to-reveal search bar functionality
  - Application now exclusively optimized for mobile devices with no desktop compatibility
  - Touch-based interactions prioritized throughout the interface

- June 27, 2025: Fixed chat functionality and updated UI design with dark theme
  - Fixed reply functionality - resolved parameter name mismatch between client (`reply_to_id`) and server (`replyToId`)
  - Chat system now fully functional with working reply feature
  - Updated chat interface to use consistent dark slate theme (`bg-slate-900`) throughout
  - Replaced complex gradient backgrounds with clean, solid dark theme as requested
  - Applied darker slate background to both chat channel list and individual channels
  - Chat channel display properly fixed after resolving TypeScript errors
  - Message editing continues to use native input method
  - System messages display without speech bubbles and handle all message types properly

- June 27, 2025: Fixed group settings functionality and cache invalidation issues
  - Resolved "Access Denied" flash error by fixing property name mismatch (adminIds vs admin_ids)
  - Enhanced server authorization logic to properly handle PostgreSQL admin_ids arrays
  - Fixed routing issue - group settings now properly navigate back to /chat instead of invalid routes
  - Implemented comprehensive cache invalidation using removeQueries and refetchQueries for immediate UI updates
  - Added authentication credentials to PATCH requests to resolve 404 errors
  - Group settings now save successfully and reflect changes immediately in chat channel list

- June 26, 2025: Complete removal of all group/social functionality from the application
  - User explicitly requested removal of all group messaging and social features
  - Deleted group-related database tables (groups, chatGroupMembers, groupMessages) from schema
  - Removed all group API routes and storage functions from server code
  - Cleaned up imports and references to group functionality throughout codebase
  - Application now focuses exclusively on individual athlete training tools
  - Updated project scope to exclude social features entirely

- June 25, 2025: Fixed dashboard scroll lock affecting sidebar navigation
  - Removed global scroll prevention code that was blocking sidebar menu scrolling
  - Updated dashboard to use fixed height container without scroll lock
  - Ensured sidebar menu can scroll properly while dashboard content fits viewport

- June 25, 2025: Removed Tracklympics game and cleaned up Arcade page
  - Removed all game-related code and components
  - Updated Arcade page to show placeholder for future games
  - Cleaned up routing and imports
  - Removed "Fun" category and Arcade menu item from navigation

- June 24, 2025: Completed community activity ticker with enhanced carousel animation
  - Implemented clean single-direction sliding carousel (right to left every 7 seconds)
  - Fixed double animation issues with simplified transform-based positioning
  - Added solid dark gradient background (gray-800 to gray-900) to ticker
  - Implemented pause/play controls with proper icons and state management
  - Set high z-index values (z-50/z-60) to ensure ticker appears above all other elements
  - Reduced spacing between ticker and dashboard cards for better layout optimization
  - Positioned ticker below navigation header with proper overflow handling

## Changelog
- June 23, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.