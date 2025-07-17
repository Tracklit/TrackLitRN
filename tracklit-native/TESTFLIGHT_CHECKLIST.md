# TestFlight Submission Checklist

## Pre-Build Requirements
- [ ] Apple Developer Program membership ($99/year)
- [ ] App Store Connect account access
- [ ] macOS computer for building
- [ ] Downloaded tracklit-native folder from Replit

## Setup Steps (One-time)
- [ ] `npm install` in tracklit-native directory
- [ ] `npm install -g @expo/cli eas-cli`
- [ ] `eas login` with Apple Developer account
- [ ] Create app in App Store Connect with bundle ID `com.tracklit.app`
- [ ] Update eas.json with your Apple ID, App Store Connect ID, and Team ID

## Build & Submit Process
- [ ] `eas build --platform ios --profile testflight`
- [ ] Wait 20-30 minutes for build to complete
- [ ] `eas submit --platform ios --profile production`
- [ ] Monitor App Store Connect for processing completion

## App Store Connect Configuration
- [ ] Set app name: "TrackLit"
- [ ] Configure app category: Sports
- [ ] Add app description and keywords
- [ ] Upload app screenshots (required for public release)
- [ ] Set TestFlight beta app description

## Testing
- [ ] Add internal testers (up to 100)
- [ ] Distribute TestFlight build
- [ ] Collect feedback and crash reports
- [ ] Test core features: chat, practice tracking, programs

## Timeline
- Build: 20-30 minutes
- Upload: 5-10 minutes  
- TestFlight Processing: 10-30 minutes
- **Total: 1-2 hours for internal testing**

## Key Commands
```bash
# Build for TestFlight
eas build --platform ios --profile testflight

# Submit to App Store Connect
eas submit --platform ios --profile production

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

## Required Information
- **Bundle ID**: com.tracklit.app
- **App Name**: TrackLit
- **Category**: Sports
- **Your Apple ID**: [Replace with your email]
- **App Store Connect ID**: [Replace with 10-digit number]
- **Team ID**: [Replace with your team ID]

## Emergency Alternatives
If EAS submit fails:
1. Download .ipa from build dashboard
2. Upload via Xcode Organizer
3. Use Transporter app from Mac App Store

The app is fully configured and ready for this process.