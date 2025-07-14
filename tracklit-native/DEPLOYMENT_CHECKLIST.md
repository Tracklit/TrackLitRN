# TestFlight Deployment Checklist

## Prerequisites ✅
- [ ] Apple Developer Account ($99/year)
- [ ] Expo Account (free)
- [ ] App Store Connect access
- [ ] EAS CLI installed globally
- [ ] Logged into Expo account

## Pre-Deployment Setup

### 1. Install Required Tools
```bash
# Install EAS CLI and Expo CLI
npm install -g @expo/cli eas-cli

# Navigate to project directory
cd tracklit-native

# Install dependencies
npm install

# Login to Expo
eas login
```

### 2. Create App in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in details:
   - Platform: iOS
   - Name: TrackLit
   - Primary Language: English
   - Bundle ID: com.tracklit.app
   - SKU: tracklit-ios
4. Note your App Store Connect ID

### 3. Update EAS Configuration
Edit `eas.json` and replace:
- `YOUR_APPLE_ID_HERE` with your Apple ID email
- `YOUR_APP_STORE_CONNECT_ID_HERE` with your App Store Connect ID

## Build Process

### Option 1: Using the Build Script (Recommended)
```bash
# Make script executable
chmod +x build-testflight.sh

# Run the interactive script
./build-testflight.sh
```

### Option 2: Manual Commands
```bash
# Build for TestFlight
eas build --platform ios --profile testflight

# Submit to TestFlight
eas submit --platform ios --profile production
```

## Post-Build Tasks

### 1. Monitor Build Status
```bash
# Check build status
eas build:list

# View specific build logs
eas build:view [BUILD_ID]
```

### 2. Configure TestFlight in App Store Connect
1. Go to App Store Connect → Your App → TestFlight
2. Wait for build to process (10-15 minutes)
3. Add build information:
   - What to Test
   - Test Information
   - Keywords for search

### 3. Add Test Users
- **Internal Testing**: Team members automatically added
- **External Testing**: Create test groups and add tester emails

## Troubleshooting

### Common Build Issues
1. **Certificate errors**: `eas credentials -p ios --clear-all`
2. **Bundle ID conflicts**: Change bundle ID in both `app.json` and `eas.json`
3. **Build timeouts**: Check EAS Build status page

### TestFlight Issues
1. **Build not appearing**: Check Activity tab, wait 10-15 minutes
2. **Review rejection**: Check Apple TestFlight guidelines
3. **Processing stuck**: Contact App Store Connect support

## Version Management
- Increment `buildNumber` in `app.json` for each new build
- Use semantic versioning for `version` field
- Current version: 1.0.0 (build 1)

## Next Steps After TestFlight
1. Gather beta tester feedback
2. Fix bugs and implement improvements
3. Update version numbers
4. Build and submit new versions
5. Prepare for App Store submission

## Important Notes
- Build process takes 10-20 minutes
- TestFlight processing takes 10-15 minutes
- External testing requires Apple review (24-48 hours)
- Maximum 10,000 external testers
- Builds expire after 90 days