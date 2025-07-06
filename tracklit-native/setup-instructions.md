# TrackLit React Native Setup Instructions

## Overview
This directory contains the complete React Native migration of the TrackLit app, ready for mobile deployment through Expo, GitHub Actions, and TestFlight.

## Prerequisites
1. Node.js 18+ installed
2. Expo CLI installed globally
3. iOS/Android simulator or physical device for testing
4. EAS CLI for builds (optional)

## Installation Steps

### 1. Install Dependencies
```bash
cd tracklit-native
npm install
```

### 2. Install Global Tools
```bash
npm install -g @expo/cli
npm install -g eas-cli
```

### 3. Initialize Expo Project
```bash
npx expo install --fix
```

### 4. Start Development Server
```bash
npm start
# or
expo start
```

## Development Workflow

### Testing on Device
1. Install Expo Go app on your phone
2. Scan the QR code from the terminal
3. Test all features on your device

### Building for Production
1. Configure EAS build: `eas build:configure`
2. Build iOS: `eas build --platform ios`
3. Build Android: `eas build --platform android`

### Submitting to App Stores
1. iOS: `eas submit --platform ios`
2. Android: `eas submit --platform android`

## Project Structure
```
tracklit-native/
├── src/
│   ├── screens/         # All screen components
│   ├── services/        # API and authentication
│   ├── types/           # TypeScript interfaces
│   └── utils/           # Utility functions
├── assets/              # App icons and images
├── App.tsx              # Main app component
├── app.json             # Expo configuration
├── eas.json             # EAS build configuration
└── package.json         # Dependencies
```

## Features Implemented
- ✅ Navigation system with bottom tabs
- ✅ Authentication and API integration
- ✅ Home screen with dashboard
- ✅ Chat functionality
- ✅ Practice tracking
- ✅ Programs management
- ✅ Race/meet management
- ✅ Dark theme UI
- ✅ TypeScript support
- ✅ Expo configuration

## Next Steps
1. Install dependencies using `npm install`
2. Test on Expo Go app
3. Configure EAS for builds
4. Set up GitHub Actions for CI/CD
5. Deploy to TestFlight/Play Store

## Troubleshooting
- If dependencies fail to install, try: `npm install --legacy-peer-deps`
- If Expo commands fail, ensure Expo CLI is installed globally
- For iOS builds, ensure you have an Apple Developer account
- For Android builds, ensure you have a Google Play Developer account