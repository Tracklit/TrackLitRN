# TrackLit Flutter Migration

This document outlines the complete migration of TrackLit from a React/Express web application to a native Flutter mobile application.

## Migration Overview

The TrackLit application has been successfully migrated from:
- **From**: React frontend + Express.js backend (web-based)
- **To**: Flutter mobile application with API integration

## Architecture Changes

### Original Stack
- Frontend: React 18 with TypeScript, Wouter routing, TanStack Query
- Backend: Node.js with Express.js, PostgreSQL with Drizzle ORM
- Styling: Tailwind CSS with shadcn/ui components
- Video Analysis: MediaPipe Python scripts with OpenAI GPT-4

### New Flutter Stack
- **Framework**: Flutter 3.24+ with Dart
- **State Management**: Riverpod for reactive state management
- **Navigation**: GoRouter for declarative routing
- **HTTP Client**: Dio for API communications
- **Local Storage**: SharedPreferences and SQLite
- **UI Components**: Material Design 3 with custom themes

## Key Features Migrated

### 1. Authentication System
- **Location**: `lib/screens/auth/auth_screen.dart`
- **Features**: Login/Register with session management
- **State**: Managed through `AuthProvider` with Riverpod

### 2. Video Analysis
- **Location**: `lib/screens/video/video_analysis_screen.dart`
- **Features**: 
  - Video upload from gallery
  - Multiple analysis types (sprint-form, block-start, etc.)
  - Real-time processing status
  - AI-powered feedback display

### 3. Meet Management
- **Location**: `lib/screens/meets/meets_screen.dart`
- **Features**:
  - Create and manage track meets
  - Event selection and scheduling
  - Calendar integration ready

### 4. Training Tools
- **Location**: `lib/screens/training/training_screen.dart`
- **Features**:
  - Workout tracking
  - Training programs
  - Performance statistics

### 5. Communication
- **Location**: `lib/screens/chat/chat_screen.dart`
- **Features**:
  - Coach-athlete messaging
  - Real-time chat interface
  - Dark theme matching original design

### 6. User Profile
- **Location**: `lib/screens/profile/profile_screen.dart`
- **Features**:
  - Profile management
  - Settings and preferences
  - Subscription tier display

## Data Models

All core data models have been migrated to Dart classes:
- `User` - User authentication and profile data
- `Meet` - Competition and event management
- `VideoAnalysis` - Video processing and AI analysis
- API request/response models with JSON serialization

## Services Layer

### API Service (`lib/services/api_service.dart`)
- Handles all HTTP communications with backend
- Automatic authentication header injection
- Error handling and timeout management

### Authentication Service (`lib/services/auth_service.dart`)
- Session token management
- Login/logout functionality
- Secure local storage of user data

## State Management

Using Riverpod providers for:
- `AuthProvider` - User authentication state
- `MeetsProvider` - Meet data management
- `VideoAnalysisProvider` - Video processing state
- Automatic cache invalidation and refresh

## Theme System

### Dark Theme Implementation
- Matches original slate-based design (`bg-slate-900`)
- Consistent color scheme across all screens
- Material Design 3 theming system

### Colors
- Primary: `#1E40AF` (Blue)
- Secondary: `#059669` (Green)
- Dark Background: `#0F172A` (slate-900)
- Dark Surface: `#1E293B` (slate-800)

## Mobile-First Design

### Touch Optimization
- Native touch gestures and interactions
- Pull-to-refresh functionality
- Optimized for single-hand use
- Swipe navigation between main sections

### Platform Integration
- Camera and gallery access for video uploads
- Native file picker integration
- Platform-specific UI elements

## Build Configuration

### Android Setup
- **Package**: `com.tracklit.app`
- **Min SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **Permissions**: Camera, storage, internet access

### Dependencies
Key Flutter packages included:
- `flutter_riverpod` - State management
- `go_router` - Navigation
- `dio` - HTTP client
- `image_picker` - Camera/gallery access
- `video_player` - Video playback
- `shared_preferences` - Local storage
- `fl_chart` - Analytics charts

## Migration Benefits

### Performance
- Native mobile performance vs web wrapper
- Optimized for mobile hardware
- Reduced bundle size and faster startup

### User Experience
- Native mobile UI patterns
- Platform-specific interactions
- Offline capability foundation
- Push notification ready

### Development
- Single codebase for iOS and Android
- Type-safe Dart language
- Hot reload for rapid development
- Rich ecosystem of packages

## Backend Integration

The Flutter app maintains compatibility with the existing Express.js backend:
- Same API endpoints and data structures
- Authentication token system preserved
- MediaPipe video analysis pipeline unchanged
- PostgreSQL database schema remains identical

## Deployment Strategy

### Development
```bash
flutter run
```

### Production Builds
```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS (requires macOS)
flutter build ios --release
```

## Next Steps

1. **iOS Configuration**: Add iOS-specific build files and configurations
2. **App Store Preparation**: Add app icons, screenshots, and store listings
3. **Push Notifications**: Integrate Firebase for real-time notifications
4. **Offline Support**: Implement local database caching
5. **Performance Optimization**: Add analytics and crash reporting

## File Structure

```
lib/
├── main.dart                 # App entry point
├── config/
│   ├── app_config.dart      # API endpoints and settings
│   └── theme.dart           # App theming
├── models/                  # Data models
│   ├── user.dart
│   ├── meet.dart
│   └── video_analysis.dart
├── services/                # Business logic
│   ├── auth_service.dart
│   └── api_service.dart
├── providers/               # State management
│   ├── auth_provider.dart
│   ├── meets_provider.dart
│   └── video_analysis_provider.dart
├── screens/                 # UI screens
│   ├── auth/
│   ├── home/
│   ├── video/
│   ├── meets/
│   ├── training/
│   ├── chat/
│   └── profile/
└── widgets/                 # Reusable components
    └── common/
```

The migration preserves all core functionality while providing a superior mobile experience with native performance and platform integration.