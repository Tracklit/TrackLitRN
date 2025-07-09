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
- July 9, 2025: Fixed date navigation to work correctly with both workout sessions and meets ✅
  - Fixed critical bug where page would break when changing dates to days with meets instead of training sessions
  - Moved date navigation to always be visible at top of page, not hidden when meets are present
  - Enhanced session data processing to handle both meet days and workout days correctly
  - Added comprehensive error handling for date calculations and meet detection
  - Implemented proper transition states to prevent page breaks during date changes
  - Added loading state indicator during date navigation transitions
  - Date navigation now works seamlessly for all date combinations (workouts, meets, rest days)
- July 9, 2025: Fixed gym data fetching and display issues ✅
  - Fixed "Gym data loading" message to only show on actual gym workout dates
  - Fixed 404 errors when fetching gym data for non-existent sessions
  - Updated rest day sessions to not have day numbers to prevent unnecessary API calls
  - Added proper gym content detection before attempting to fetch gym data
  - Enhanced useGymData hook to handle 404 errors gracefully
  - Gym data now only loads and displays when workout sessions actually contain gym exercises
- July 9, 2025: Enhanced Practice page daily session card with ticker styling and improved layout ✅
  - Applied same purple-blue gradient background and outer glow as community ticker to daily session card
  - Increased card height from 25vh to 33vh for better content display
  - Added scroll indicator (bouncing chevron) to show when content exceeds card height
  - Updated all text colors to white/white80 for better visibility on dark gradient
  - Enhanced skeleton loader styling to match gradient theme with white/20 colors
  - Added compact date picker below track workout card, right-aligned with small button
  - Date picker opens as dropdown with 75% scale for space efficiency
  - Applied gradient styling to all card states (loading, active, no program, program info)
- July 9, 2025: Enhanced Practice page layout and workout display ✅
  - Added bottom padding (pb-24) to prevent Your Programs card from being covered by navigation
  - Consolidated distance sections (60m/100m, 200m, 400m) into single "Track Workout" visual box
  - Maintained proper spacing between distance categories while unifying visual presentation
  - Distance headers now styled with primary color for better hierarchy
  - Updated daily session card and Training Journal card to use consistent background with 90% opacity
  - Removed inner boxes from workout sections to display content directly on main card
  - Fixed daily session card height to 25% of viewport with scrollable overflow for long content
- July 9, 2025: Removed login success toast notification ✅
  - Removed success toast that appeared after user login
  - Login process now completes silently without popup notifications
  - Users are redirected to dashboard without notification interruption
- July 8, 2025: Updated Practice page with 6px corner rounding and home page card styling ✅
  - Applied 6px border radius to all Card components and div elements with rounded corners
  - Updated session containers, modal dialogs, and premium feature cards
  - Removed borders from workout session cards and applied bg-primary/5 background to match home page cards
  - Updated Training Journal section with same borderless styling and bg-primary/5 background
  - Consistent corner rounding and styling across entire Practice page interface
  - All elements now match the design system with 6px border radius and unified card styling
- July 8, 2025: Enhanced Tools page with consistent drop shadow and added Sprinthia to navigation ✅
  - Replaced purple glow with standard drop shadow matching Home page cards
  - Applied boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 15px 20px -5px rgba(0, 0, 0, 0.15)' to both enabled and disabled cards
  - Added Sprinthia as 6th bottom navigation item with robot icon
  - Updated navigation grid from 5 to 6 columns to accommodate Sprinthia
  - Bottom navigation now includes: Home, Practice, Programs, Race, Tools, Sprinthia
- July 8, 2025: Updated Tools page cards to use 6px corner rounding ✅
  - Added 6px border radius to disabled tool cards for consistency
  - Enabled cards already had 6px rounding in inline styles
  - All Tools page cards now have consistent corner rounding
- July 8, 2025: Enhanced athletes page with gold connect buttons and real profile images ✅
  - Updated User interface to include profileImageUrl field
  - Replaced hardcoded "/default-avatar.png" with actual user profile images
  - Now displays real user profile images when available
  - Falls back to color-coded initials when no profile image exists
  - Changed connect buttons from transparent to theme gold color (bg-yellow-500/600)
  - Connect buttons now have proper visual prominence with black text on gold background
  - Maintains consistent avatar styling with improved data integrity
- July 8, 2025: Removed install app functionality completely ✅
  - Removed /install-app route from App.tsx and deleted install-app-page.tsx
  - Deleted install-app-button.tsx component completely
  - Removed install app prompt overlay from onboarding flow
  - Removed showInstallPrompt state and related functionality from onboarding
  - Cleaned up all install app imports and references
  - Onboarding flow now completes directly without install app step
  - Web app now has no PWA installation prompts or functionality
- July 8, 2025: Enhanced Tools page with consistent Home page styling ✅
  - Removed background images from all Tools page cards by setting hasBackground: false
  - Updated cards to use same background color as Home page cards (bg-primary/5)
  - Applied matching border styling: 0.5px solid rgba(168, 85, 247, 0.25) with 6px border radius
  - Changed text colors from white to default foreground and text-muted-foreground
  - Updated icon colors from white to default foreground for consistency
  - Tools cards now have identical styling to Home page cards for unified design
- July 8, 2025: Updated Practice card greeting and unlocked Home page scroll ✅
  - Changed Practice card text from "Ready to train?" to "Ready to work out?"
  - Removed scroll prevention code to enable natural page scrolling
  - Doubled card spacing from 12px (mt-3) to 24px (mt-6) between dashboard cards
  - Added light pulse animation around Practice card border on Home page entry
  - Purple border pulse activates 500ms after page load, runs for 3 seconds
  - Home page now has full scroll functionality with improved card spacing and engaging Practice card highlight

- July 8, 2025: Completed bottom navigation redesign for mobile-optimized experience ✅
  - Removed chat icon completely from bottom navigation (chat accessible only through overlay)
  - Updated layout from 6-column to 5-column grid with increased height (h-16)
  - Enhanced icon sizing to 16px (h-4 w-4) for better visibility
  - Reduced label font size to 8px for compact, clean appearance
  - Changed "Dashboard" label to "Home" for clearer navigation
  - Updated Tools icon from clock to image icon for better visual representation
  - Added text labels under all icons with proper spacing and typography
  - Cleaned up all chat-related imports and navigation logic
  - Bottom navigation now displays: Home, Practice, Programs, Race, Tools with labels

- July 8, 2025: Updated dashboard design with cleaner card styling and enhanced ticker ✅
  - Removed all card background images for cleaner interface
  - Added subtle purple outer glow to community activity ticker
  - Increased card corner rounding from default to 6px for modern appearance
  - Cards now use clean background colors without image overlays
  - Enhanced dashboard visual consistency with simplified design approach
  - Fixed card width alignment with ticker to match exactly (480px max-width for both)

- July 8, 2025: Enhanced video upload functionality with unified media interface ✅
  - Fixed video full-screen viewer functionality by adding onVideoClick prop to MessageBubble component
  - Merged image and video upload buttons into single media button with Image icon
  - Added visual upload progress indicators with spinning loader animations
  - Enhanced media previews with "Uploading..." text and overlay loading states
  - Combined file input to accept both images and videos (image/*,video/*) for streamlined UX
  - Media button shows spinner during upload and message sending operations
  - Upload states prevent interaction with close buttons during processing
  - Video upload fully functional with 50MB server limit supporting MP4, MOV, AVI, WEBM formats
  - Reinstated slide animations for chat entering/exiting with smooth transform transitions

- July 7, 2025: Comprehensive image optimization and chat scroll behavior ✅
  - Created client-side image compression utility with WebP format and automatic resizing
  - Built OptimizedAvatar component with lazy loading and skeleton placeholders for fast loading
  - Built OptimizedMessageImage component for chat images with intersection observer lazy loading
  - Enhanced server-side image processing with Sharp compression (96px avatars, 400px messages)
  - Replaced channel settings spinner with comprehensive skeleton loading states
  - Applied optimized components throughout chat pages, settings, and message displays
  - Removed all slide animations from CSS and chat navigation for instant transitions
  - Implemented automatic scroll-to-bottom when posting messages or images
  - Added keyboard detection and height adjustment for mobile chat
  - Messages container now adjusts padding when keyboard is visible to keep new messages above keyboard
  - Images now load significantly faster with automatic compression and proper sizing

- July 7, 2025: Enhanced channel settings with dynamic save button and cleaner interface ✅
  - Implemented dynamic Save Changes button (grayed out when no changes, yellow when changes made)
  - Added comprehensive change detection for name, description, privacy toggle, and image uploads
  - Removed success toast and page title for cleaner interface
  - Changed back arrow to X icon and removed transition animations
  - Fixed all field name mismatches between client and server for proper functionality
  - Enhanced cache invalidation to reflect changes immediately in channel list
  
- July 7, 2025: Converted chat settings to modal dialog system ✅
  - Replaced full-page settings overlay with proper Dialog modal component
  - Created new GroupSettingsModal component with responsive scrollable layout
  - Eliminated animation layering issues by using shadcn Dialog primitives
  - Settings now appear as overlay modal instead of page navigation
  - Removed old group-settings-page route and navigation completely
  - Modal includes all functionality: group editing, member management, role assignment
  - Fixed mobile UX with proper modal backdrop and responsive design
  
- July 6, 2025: Enhanced both web and React Native chat with native device UI components ✅
  - Web version: Added Telegram-style keyboard persistence behavior
  - Input stays focused after sending messages (just like Telegram)
  - Enhanced mobile-optimized input attributes (autoCorrect, autoCapitalize, enterKeyHint)
  - Added Enter key handling for quick message sending
  - Smooth focus restoration after message sending and editing
  - React Native: Complete custom ChatInput component with native TextInput optimizations
  - Added animated keyboard height detection and smooth transitions
  - Enhanced message bubbles with shadows and iOS-style design
  - Optimized for both iOS and Android native behavior
  
- July 6, 2025: Implemented smooth scroll-to-bottom button for web chat channels ✅
  - Added Telegram-style scroll-to-bottom button positioned on bottom right
  - Button appears when user scrolls up from bottom (10px threshold detection)
  - Button disappears when user is at bottom of messages
  - Smooth scroll animation using scrollTo with behavior: 'smooth'
  - Blue circular design with ArrowDown icon
  - Fully functional across all chat channels
  
- January 6, 2025: React Native Migration Fully Completed ✅
  - Complete React Native project structure in tracklit-native directory
  - All core screen components implemented: HomeScreen, ChatScreen, PracticeScreen, ProgramsScreen, RaceScreen
  - API service layer with authentication and request management
  - TypeScript configuration for React Native development
  - Expo configuration (app.json) with iOS/Android build settings
  - EAS build configuration (eas.json) for production builds
  - GitHub Actions workflow for automated builds and TestFlight deployment
  - App icons and assets properly configured
  - Setup instructions and comprehensive documentation
  - Ready for npm install, Expo development, and production builds
  - Full TestFlight and App Store deployment capability established

- June 30, 2025: Extensive work on mobile keyboard persistence in chat
  - Attempted multiple approaches: optimistic updates, DOM manipulation, form wrappers, native input elements
  - Implemented requestAnimationFrame focus restoration, blur prevention, and various React state management strategies
  - Mobile keyboard retraction remains a fundamental browser limitation during React state changes
  - Current implementation uses native HTML input with optimized mobile attributes for best possible experience
  
- June 30, 2025: Improved chat loading experience with comprehensive skeleton loaders
  - Fixed channel title showing "Chat X" fallback by implementing skeleton loaders in header
  - Added realistic skeleton loaders for chat channel list with avatar placeholders and varying content widths
  - Added conversation-style skeleton loaders for chat messages with alternating positions
  - Removed group profile images from inside chat channels for cleaner interface
  - Fixed TypeScript errors with Image constructor and proper promise typing
  - Enhanced MessageAvatar component with global image caching to prevent reloading on channel entry
  - Loading states now provide smooth visual feedback without jarring text changes

- June 29, 2025: Enhanced chat system with toggle filter and unread message tracking
  - Added "My Groups" vs "Public Groups" toggle filter next to Create Group button
  - Implemented comprehensive unread message count system replacing total message counts
  - Added mark-as-read functionality when entering chat groups to update unread badges
  - Enhanced chat groups API to include member information and admin IDs for proper filtering
  - Red badges now only display for groups where user is actually a member with unread messages
  - Fixed group creation database constraint error (chat_group_members foreign key)
  - Updated Messages icon in top bar to paper plane (faPaperPlane) with Font Awesome solid
  - Reordered top bar icons: Globe, Bell, Paper Plane (left to right)

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
  - Replaced all bottom navigation icons with Font Awesome solid equivalents
  - Chat icon uses faComments (larger h-7 w-7 with left margin -ml-1)
  - Dashboard, Practice, Programs, Race, and Tools use matching Font Awesome icons
  - Removed floating icon completely from chat page
  - Completed comprehensive Font Awesome icon system conversion for entire interface
  - Replaced all top bar icons (Globe → faGlobe, LogOut → faSignOutAlt, Bell → faBell, MessageCircle → faEnvelope) with Font Awesome equivalents
  - Updated all hamburger menu navigation icons to use Font Awesome solid variants
  - Updated notification bell and message button components with Font Awesome icons
  - Fixed all TypeScript errors and maintained consistent icon sizing throughout interface
  - Achieved unified Font Awesome solid icon system across all navigation and UI components
  - Fixed missing top spacing on /practice, /programs, /race, and /tools pages
  - Applied custom spacing adjustments: Sprinthia (100px), Practice (80-96px), Programs/Tools (80px), Meets (80px)
  - Enhanced PageContainer component with responsive top padding (pt-20 md:pt-24) baseline
  - Added custom Sprinthia page spacing override with pt-20 class for additional clearance
  - Ensured optimal layout spacing with proper clearance from navigation elements across all pages

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