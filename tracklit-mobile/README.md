# TrackLit Mobile - React Native App

The mobile companion app for TrackLit, built with React Native and Expo development tools.

## 📁 Project Structure

```
tracklit-mobile/
├── src/
│   ├── components/     # Reusable UI components
│   │   └── ui/         # Base UI primitives (Button, Card, Input, etc.)
│   ├── screens/        # Screen components
│   │   └── auth/       # Authentication screens
│   ├── navigation/     # Navigation configuration
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API client, query client
│   ├── config/         # Environment configuration
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions, theme
├── assets/             # Static assets (audio, images)
├── ios/                # iOS native code
├── android/            # Android native code
├── App.tsx             # App entry point
└── index.js            # React Native entry
```

## 🚀 Setup

### Installation

1. **Navigate to the mobile app directory**
   ```bash
   cd tracklit-mobile
   ```

2. **Install JavaScript dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

### Configure API Endpoint

Edit `src/config/env.ts` to set your API URL:
```typescript
export const API_BASE_URL = 'https://your-api-url.com';
// For local development with the web app running:
// export const API_BASE_URL = 'http://localhost:5000';
```

## 📱 Running the App

### iOS Simulator (macOS only)

```bash
# Start Metro bundler and run on iOS
npm run ios

# Or specify a simulator
npx react-native run-ios --simulator="iPhone 15 Pro"
```

### Android Emulator

1. **Start an Android emulator** from Android Studio (Device Manager)
2. **Run the app:**
   ```bash
   npm run android
   ```

### Physical Device

#### iOS (requires Apple Developer Account for device testing)
1. Open `ios/TrackLitMobile.xcworkspace` in Xcode
2. Select your device as the build target
3. Click Run (⌘R)

#### Android
1. Enable Developer Mode on your Android device
2. Enable USB Debugging
3. Connect via USB and run:
   ```bash
   npm run android
   ```

## 🧪 Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run ios` | Run on iOS Simulator |
| `npm run android` | Run on Android Emulator |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

### Metro Bundler

If Metro is already running or you need to restart:
```bash
# Start with cache reset
npx react-native start --reset-cache

# Or just start
npm start
```

## 📦 Expo Development Client

This project uses Expo's development client (`expo-dev-client`) for enhanced development experience while maintaining full native code access.

### Using Expo Dev Client

1. **Install Expo CLI globally** (optional but recommended):
   ```bash
   npm install -g expo-cli
   ```

2. **Start with Expo:**
   ```bash
   npx expo start --dev-client
   ```

3. **Scan QR code** with:
   - iOS: Camera app
   - Android: Expo Go app (install from Play Store)

### Building with EAS (Expo Application Services)

For cloud builds and app store submissions:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS** (if not already done):
   ```bash
   eas build:configure
   ```

4. **Build for development:**
   ```bash
   # iOS
   eas build --platform ios --profile development

   # Android
   eas build --platform android --profile development
   ```

5. **Build for production:**
   ```bash
   # iOS (requires Apple Developer Account)
   eas build --platform ios --profile production

   # Android
   eas build --platform android --profile production
   ```

## 🛠 Tech Stack

- **React Native** 0.74.x
- **Expo SDK** 51
- **React Navigation** - Navigation
- **TanStack Query** - Data fetching
- **React Hook Form + Zod** - Form handling
- **React Native Reanimated** - Animations
- **React Native Gesture Handler** - Gestures

## 📂 Key Files

- `App.tsx` - Main app component with navigation setup
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/lib/api.ts` - API client for backend communication
- `src/lib/queryClient.ts` - TanStack Query configuration
- `src/navigation/BottomNavigation.tsx` - Tab bar navigation

## 🔧 Troubleshooting

### iOS Build Issues

```bash
# Clean and reinstall pods
cd ios
pod deintegrate
pod install
cd ..

# Clean Xcode build folder
# In Xcode: Product → Clean Build Folder (⇧⌘K)
```

### Android Build Issues

```bash
# Clean Gradle cache
cd android
./gradlew clean
cd ..
```

### Metro Bundler Issues

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear watchman
watchman watch-del-all
```

### General Reset

```bash
# Nuclear option - clean everything
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
rm -rf android/app/build
npm install
cd ios && pod install && cd ..
```

## 📱 Supported Platforms

- **iOS:** 14.0+
- **Android:** API 24+ (Android 7.0+)

## 🔗 Related

- [Web App README](../README.md) - Main web application
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)

