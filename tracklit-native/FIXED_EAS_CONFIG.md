# Fixed EAS Configuration

## Issues Resolved

The following EAS configuration errors have been fixed:

- ❌ `"build.preview.ios.bundleIdentifier" is not allowed`
- ❌ `"build.production.ios.bundleIdentifier" is not allowed`  
- ❌ `"build.testflight.ios.bundleIdentifier" is not allowed`
- ❌ `"submit.production.android.packageName" is not allowed`

## Solution

### Bundle Identifiers Configuration
Bundle identifiers should be configured in `app.json`, not `eas.json`:

**app.json (Correct):**
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.tracklit.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.tracklit.app",
      "versionCode": 1
    }
  }
}
```

**eas.json (Fixed):**
```json
{
  "cli": {
    "version": ">= 7.8.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "distribution": "store"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "testflight": {
      "ios": {
        "distribution": "store",
        "autoIncrement": "buildNumber"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID_HERE",
        "ascAppId": "YOUR_APP_STORE_CONNECT_ID_HERE"
      }
    }
  }
}
```

## What Changed

1. **Removed `bundleIdentifier`** from all build profiles in `eas.json`
2. **Removed `packageName`** from submit configuration in `eas.json`  
3. **Added `versionCode`** to Android configuration in `app.json`
4. **Bundle identifier** is now only defined in `app.json` where it belongs

## How EAS Works

- EAS automatically reads bundle identifiers from `app.json`
- Build profiles in `eas.json` should only contain build-specific settings
- App metadata (name, version, bundle ID) belongs in `app.json`

## Ready for Build

The configuration is now correct and ready for:

```bash
# Validate configuration by checking build profiles
eas build:configure

# List available profiles to verify setup
eas build:list --platform ios

# Start the actual build
eas build --platform ios --profile testflight
```

## Before You Build

Make sure to update the placeholders in `eas.json`:
- Replace `YOUR_APPLE_ID_HERE` with your Apple Developer email
- Replace `YOUR_APP_STORE_CONNECT_ID_HERE` with your App Store Connect app ID

The bundle identifier `com.tracklit.app` is already properly configured and ready to use.