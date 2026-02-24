# Tracklit Mobile

## Overview
Tracklit is a track and field athletics management platform. This workspace is dedicated to the development of the React Native mobile application. The app connects directly to a production Azure API, providing features for athlete training management, performance tracking, and analysis. Key capabilities include practice session management, program creation, an AI-powered assistant (Sprinthia) for biomechanical analysis, and various athletics tools like photo finish analysis and start gun simulation.

## User Preferences
I prefer clear and concise communication. When making changes, prioritize iterative development and explain the high-level approach before diving into code. For significant architectural decisions or major feature implementations, please ask for confirmation before proceeding.

## System Architecture
The Tracklit mobile app is built using React Native (Expo SDK 54) with TypeScript. It utilizes React Navigation for a comprehensive navigation structure including a drawer, bottom tabs, and stack navigators. Authentication is handled via JWT tokens.

**UI/UX Decisions:**
- **Icons:** Consistent use of Phosphor Icons with a "fill" weight.
- **Navigation:** Bottom navigation features 5 tabs (Home, Practice, Programs, Feed, Tools), with Profile accessible via a drawer.
- **Theming:** A dark AAA sports game aesthetic dominates, featuring a dark background (`#0E0F14`), orange accent colors, gradient effects, and glassmorphism for panels and cards.
- **Component Styling:** Reusable components like `ScreenHeader` are used, with specific screens (Practice, Programs, Tools) sharing a consistent style: no header gradient, extra-large horizontal padding, 12px border-radius for cards, and large gaps between elements.
- **Accessibility:** Safe area insets are used for device-safe padding.
- **Animations:** Subtle animations like fade-in on screen mount and Reanimated-based transitions for UI elements enhance the user experience.

**Technical Implementations & Feature Specifications:**
- **API Client:** Dedicated client and utility functions (`lib/api`, `lib/utils`) for interacting with the Azure backend.
- **Configuration:** Environment variables (`EXPO_PUBLIC_API_BASE_URL`) manage API endpoints, defaulting to production.
- **Sprinthia (AI Assistant):** Integrated as a RootStack screen, providing advanced biomechanical analysis within the Photo Finish feature.
- **Photo Finish:** A core feature allowing video upload, frame scrubbing, digital clock overlays, FPS selection, and advanced analysis including MediaPipe pose skeleton overlay, joint angle computation, body symmetry, center of mass, and motion tracking. It includes a frame comparison tool and AI analysis via the Sprinthia API.
- **Start Gun:** Features a configurable start sound and an optional torch flash synchronized with the "bang" for realistic simulation.
- **Stopwatch:** Enhanced accuracy using `Date.now()` and optional volume-up button control.
- **Profile Screens:** A unified design for public and personal profiles, featuring a dark aesthetic, stadium hero backgrounds, gradient borders, glass summary panels, and editable personal bests/season bests.
- **Onboarding & Authentication:** Redesigned with a dark AAA theme, orange accents, and social authentication options.
- **Program Management:** Features for creating, editing, and assigning training programs with a calendar view, session editing, program duplication, and day-swap reordering (long-press to select, tap to swap).
- **Ticker/Feed:** Displays a horizontal carousel of notifications and messages with interactive elements like liking and saving to a journal.
- **Chat:** Telegram-style chat interface with dark themes, merged group/DM views, and expressive icons.

## External Dependencies
- **React Native (Expo SDK 54):** Core mobile development framework.
- **TypeScript:** Programming language for type safety.
- **React Navigation:** For app navigation.
- **Phosphor Icons:** Icon library used throughout the application.
- **Azure Production Server:** Backend API endpoint (`app-tracklit-prod-tnrusd.azurewebsites.net`).
- **JWT (JSON Web Tokens):** For user authentication.
- **Expo Web Browser:** For opening external links within the app.
- **Expo Image Picker:** For selecting images/videos from the device.
- **Expo Video Thumbnails:** For generating video thumbnails.
- **@mediapipe/tasks-vision JS SDK:** Used within a WebView for pose detection in Photo Finish.
- **React Native Volume Manager:** For controlling device volume (used in Stopwatch).
- **React Native Reanimated:** For advanced animations.
- **AsyncStorage:** For local data persistence.
- **xlsx:** For parsing .xlsx/.xls spreadsheet files locally on mobile.
- **expo-document-picker:** For selecting documents (PDF, DOCX, CSV, XLSX) from the device.

## Program Import/Upload Architecture
The app uses a unified **Import / Upload** screen (`ProgramImportScreen`) that auto-detects input type:
- **Google Sheets URL** → Regex-detected, parsed via backend `/api/programs/import-sheet`
  - **Simple template**: 2 columns (A=Date, B=Session text). Session text stored in `description` field. Detected on mobile when all 6 workout fields are empty but description has content.
  - **Advanced template**: 7 columns (A=Date, B=Pre-Activation 1, C=Pre-Activation 2, D=Short Distance, E=Medium Distance, F=Long Distance, G=Extra Session)
  - Template type passed as `sheetTemplate` parameter to the API; server uses `fetchSimpleSpreadsheetData` or `fetchSpreadsheetData` accordingly
- **PDF/DOC/DOCX files** → Uploaded as document programs via `/api/programs/upload`
- **CSV/XLSX files** → Parsed locally using `lib/spreadsheetParser.ts` (Advanced column mapping)

The `ProgramCreateScreen` offers 4 methods: Import/Upload (navigates to ProgramImportScreen), Program Builder, Text Based, and Sprinthia AI.

**Practice Screen Session Mapping**: Sessions are matched to calendar dates using both a direct date-key lookup (Mon-DD format) and a sequential dayNumber offset from program start date. Date-key takes priority to handle sheets with rest days or gaps.