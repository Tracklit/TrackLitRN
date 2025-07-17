# Manual TestFlight Build & Submission Guide

## Prerequisites

### 1. Apple Developer Account
- **Required**: Active Apple Developer Program membership ($99/year)
- **Sign up**: [developer.apple.com](https://developer.apple.com)
- **Must have**: Valid Apple ID and payment method

### 2. App Store Connect Setup
- **Access**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- **Create App**: New app with bundle ID `com.tracklit.app`
- **App Information**: Set name, category, and basic metadata

### 3. Local Development Environment
- **macOS**: Required for iOS builds (Xcode development)
- **Node.js**: Version 18 or higher
- **Git**: For version control

## Step-by-Step Build Process

### Step 1: Download Project Files
```bash
# From Replit: Click three dots → "Download as ZIP"
# Extract ZIP file and navigate to tracklit-native folder
cd tracklit-native
```

### Step 2: Install Dependencies
```bash
# Install project dependencies
npm install

# Install CLI tools globally
npm install -g @expo/cli eas-cli

# Verify installations
expo --version
eas --version
```

### Step 3: Configure Apple Developer Credentials
```bash
# Login to Expo with your Apple ID
eas login

# Follow prompts to authenticate with Apple Developer account
```

### Step 4: Update Configuration Files

#### Edit `eas.json`:
```json
{
  "cli": {
    "version": ">= 0.34.0"
  },
  "build": {
    "testflight": {
      "ios": {
        "distribution": "internal",
        "autoIncrement": true,
        "buildNumber": "1.0.0"
      }
    },
    "production": {
      "ios": {
        "distribution": "store",
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

#### Replace Placeholders:
- `your-apple-id@email.com` → Your Apple Developer email
- `your-app-store-connect-id` → App Store Connect app ID (10-digit number)
- `your-team-id` → Apple Developer Team ID

### Step 5: Build for TestFlight
```bash
# Start the build process
eas build --platform ios --profile testflight

# This will:
# - Upload your code to Expo's build servers
# - Generate iOS app bundle (.ipa file)
# - Take approximately 20-30 minutes
```

### Step 6: Monitor Build Progress
```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

### Step 7: Submit to App Store Connect
```bash
# After successful build, submit to TestFlight
eas submit --platform ios --profile production

# This will:
# - Upload .ipa file to App Store Connect
# - Begin Apple's processing for TestFlight
```

## Alternative: Manual Upload Process

### If EAS Submit Fails:
1. **Download .ipa file** from build dashboard
2. **Open Xcode** → Window → Organizer
3. **Upload via Xcode** → Select .ipa file → Upload to App Store Connect

### Using Transporter App:
1. **Download Transporter** from Mac App Store
2. **Drag .ipa file** into Transporter
3. **Click "Deliver"** to upload to App Store Connect

## App Store Connect Configuration

### Step 1: App Information
- **Name**: TrackLit
- **Bundle ID**: com.tracklit.app
- **SKU**: tracklit-app-2025
- **Category**: Sports
- **Subcategory**: Fitness & Training

### Step 2: Version Information
- **Version**: 1.0.0
- **Build**: Auto-incremented by EAS
- **What's New**: "Initial release of TrackLit coaching app"

### Step 3: App Review Information
- **Description**: "TrackLit is a comprehensive track and field coaching app..."
- **Keywords**: track, field, coaching, training, athletics
- **Screenshots**: Required for App Store submission

### Step 4: TestFlight Configuration
- **Beta App Description**: Internal testing version
- **Test Information**: What features to test
- **Feedback Email**: Your support email

## Testing & Distribution

### Internal Testing:
1. **Add Testers**: Up to 100 internal testers
2. **Distribute Build**: Send TestFlight invitations
3. **Collect Feedback**: Monitor crash reports and feedback

### External Testing:
1. **Submit for Review**: Apple reviews external TestFlight builds
2. **Public Link**: Share TestFlight link publicly
3. **Up to 10,000 Testers**: Extended testing capacity

## Common Issues & Solutions

### Build Failures:
- **Missing Certificates**: EAS will prompt to generate
- **Bundle ID Conflicts**: Ensure unique bundle identifier
- **Code Signing**: EAS handles automatically

### Upload Issues:
- **Large File Size**: Optimize assets and dependencies
- **Network Timeout**: Retry upload with stable connection
- **Invalid Binary**: Check build logs for errors

### TestFlight Processing:
- **Processing Time**: 10-30 minutes after upload
- **Review Required**: External testing needs Apple approval
- **Crash Reports**: Monitor TestFlight feedback

## Timeline Expectations

- **Build Time**: 20-30 minutes
- **Upload Time**: 5-10 minutes
- **TestFlight Processing**: 10-30 minutes
- **Apple Review** (if needed): 1-3 days
- **Total Time**: 1-2 hours for internal testing

## Final Verification

### Before Building:
- [ ] Apple Developer account active
- [ ] App Store Connect app created
- [ ] Bundle ID matches configuration
- [ ] All placeholders replaced in eas.json

### After Building:
- [ ] Build completed successfully
- [ ] .ipa file uploaded to App Store Connect
- [ ] TestFlight shows "Ready to Test"
- [ ] Internal testers can install app

## Support Resources

- **EAS Documentation**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction/)
- **Apple Developer**: [developer.apple.com/support](https://developer.apple.com/support)
- **TestFlight Guide**: [developer.apple.com/testflight](https://developer.apple.com/testflight)

Your TrackLit app is fully configured and ready for this process. All code, configurations, and build scripts are prepared for immediate deployment.