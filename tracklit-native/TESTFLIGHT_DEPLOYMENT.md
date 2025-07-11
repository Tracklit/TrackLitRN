# TestFlight Deployment Guide for TrackLit

## Prerequisites

1. **Apple Developer Account**: Active Apple Developer Program membership ($99/year)
2. **Expo Account**: Create a free account at [expo.dev](https://expo.dev)
3. **App Store Connect**: Access to App Store Connect with your Apple ID

## Step 1: Local Environment Setup

Run these commands on your local machine:

```bash
# Install EAS CLI globally
npm install -g @expo/cli eas-cli

# Navigate to your React Native project
cd tracklit-native

# Install dependencies
npm install

# Login to your Expo account
eas login

# Configure EAS project (if not already done)
eas build:configure
```

## Step 2: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in the details:
   - **Platform**: iOS
   - **Name**: TrackLit
   - **Primary Language**: English
   - **Bundle ID**: com.tracklit.app
   - **SKU**: tracklit-ios (or any unique identifier)
4. Click "Create"
5. Note down your **App Store Connect ID** (found in the URL or App Information section)

## Step 3: Update EAS Configuration

Your `eas.json` file has been updated with TestFlight configuration. You need to replace these placeholders:

1. Open `eas.json`
2. Replace `YOUR_APPLE_ID_HERE` with your Apple ID email
3. Replace `YOUR_APP_STORE_CONNECT_ID_HERE` with your App Store Connect ID from Step 2

## Step 4: Build for TestFlight

```bash
# Create a TestFlight build
eas build --platform ios --profile testflight

# Or build for production (same result for iOS)
eas build --platform ios --profile production
```

The build process will:
- Create a development certificate and provisioning profile
- Build your app on Expo's servers
- Generate an IPA file ready for TestFlight

## Step 5: Submit to TestFlight

### Option A: Automatic Submission (Recommended)
```bash
# Submit automatically to TestFlight
eas submit --platform ios --profile production
```

### Option B: Manual Upload
1. Download the IPA file from the build results
2. Open Xcode
3. Go to "Window" → "Organizer"
4. Click "Distribute App"
5. Select "App Store Connect"
6. Upload the IPA file

## Step 6: Configure TestFlight

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your TrackLit app
3. Go to "TestFlight" tab
4. Your build should appear under "iOS Builds"
5. Click on the build and add:
   - **What to Test**: Description of new features
   - **Test Information**: Any special instructions for testers

## Step 7: Add Test Users

### Internal Testing (Apple Developer Team)
1. Go to "Internal Testing"
2. Add your team members automatically

### External Testing (Beta Testers)
1. Go to "External Testing"
2. Create a new test group
3. Add tester emails
4. Submit for Beta App Review (takes 24-48 hours)

## Step 8: Distribute TestFlight Invites

Once approved:
1. Select your test group
2. Click "Add Build"
3. Select your build
4. Click "Next" → "Submit for Review"
5. After approval, testers will receive email invites

## Commands Summary

```bash
# Login to Expo
eas login

# Build for TestFlight
eas build --platform ios --profile testflight

# Submit to TestFlight
eas submit --platform ios --profile production

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

## Troubleshooting

### Common Issues:

1. **Build fails with certificate error**:
   ```bash
   # Clear credentials and recreate
   eas credentials -p ios --clear-all
   eas build --platform ios --profile testflight --clear-cache
   ```

2. **Bundle identifier already exists**:
   - Change the bundle ID in `app.json` and `eas.json`
   - Must be unique across all iOS apps

3. **Permission denied errors**:
   - Ensure your Apple Developer account has proper permissions
   - Check that your membership is active

4. **Build stuck in queue**:
   - EAS builds can take 10-20 minutes
   - Check [EAS Build status](https://status.expo.dev/)

### App Store Connect Issues:

1. **Build not appearing in TestFlight**:
   - Check the "Activity" tab for processing status
   - Wait 10-15 minutes for processing

2. **TestFlight review rejection**:
   - Common issues: missing app descriptions, inappropriate content
   - Review Apple's TestFlight guidelines

## Next Steps After TestFlight

1. **Gather feedback** from beta testers
2. **Fix bugs** and implement improvements
3. **Update version** in `app.json`
4. **Build and submit** new versions
5. **Prepare for App Store** submission when ready

## App Store Submission (When Ready)

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

Then complete the App Store Connect listing with:
- App description
- Keywords
- Screenshots
- App Store icon
- Privacy policy
- Support URL

## Support

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Apple TestFlight Documentation](https://developer.apple.com/testflight/)

Remember to increment your build number in `app.json` for each new build!