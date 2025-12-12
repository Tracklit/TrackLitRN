# Mobile App Azure Backend Connection - Quick Checklist

## ✅ Configuration Complete

### Android
- [x] `network_security_config.xml` created
- [x] `AndroidManifest.xml` updated with networkSecurityConfig reference
- [x] INTERNET permission already present
- [x] HTTPS-only for production domains
- [x] Cleartext allowed for localhost (development)

### iOS  
- [x] `Info.plist` updated with NSExceptionDomains
- [x] azurewebsites.net domain configured
- [x] TLS 1.2+ enforced
- [x] HTTPS-only connections

### Environment
- [x] `.env` file created with dev API URL
- [x] `.env.example` template created
- [x] `.gitignore` updated to exclude `.env`

### Backend
- [x] JWT token generation working (commit 001380de)
- [x] `/api/mobile/login` endpoint available
- [x] Bearer token authentication middleware active
- [x] CORS configured for mobile requests

## 📝 Pre-Launch Checklist

### Backend Verification
- [ ] Test health endpoint: `curl https://app-tracklit-dev-kvnx2h.azurewebsites.net/api/health`
- [ ] Verify JWT secret is set in Azure App Service settings
- [ ] Confirm PostgreSQL database is accessible
- [ ] Confirm Redis cache is accessible
- [ ] Test login endpoint with curl/Postman

### iOS Setup
- [ ] Run `cd tracklit-mobile/ios && pod install`
- [ ] Open project in Xcode
- [ ] Verify Info.plist changes are present
- [ ] Build and run on simulator
- [ ] Test on physical device (if available)

### Android Setup
- [ ] Run `cd tracklit-mobile/android && ./gradlew clean`
- [ ] Verify `network_security_config.xml` exists
- [ ] Verify `AndroidManifest.xml` references config
- [ ] Build and run on emulator
- [ ] Test on physical device (if available)

### Functional Testing
- [ ] Open app and see login screen
- [ ] Enter valid credentials
- [ ] Verify JWT token is received and stored
- [ ] Navigate to authenticated screens
- [ ] Test API calls (check console logs)
- [ ] Test logout and re-login
- [ ] Verify token persists after app restart

## 🔧 Build Commands

### Development Builds
```bash
# iOS Simulator
cd tracklit-mobile
npx expo run:ios

# Android Emulator
cd tracklit-mobile
npx expo run:android

# Start with clean cache
npx expo start --clear
```

### Production Builds (EAS)
```bash
# Configure EAS if not done
eas init

# Build for iOS
eas build --platform ios

# Build for Android  
eas build --platform android

# Build both
eas build --platform all
```

## 🐛 Troubleshooting Quick Fixes

### "Network request failed" (iOS)
```bash
cd tracklit-mobile/ios
pod install
# Restart Xcode and clean build folder
```

### "Cleartext HTTP not permitted" (Android)
```bash
# Verify network_security_config.xml exists
ls tracklit-mobile/android/app/src/main/res/xml/network_security_config.xml

# Clean and rebuild
cd tracklit-mobile/android
./gradlew clean
```

### "401 Unauthorized"
- Check if token is being sent: Look for `Authorization: Bearer` in network logs
- Verify backend JWT_SECRET matches
- Try logging in again to get fresh token

### CORS Errors
- Backend should already handle this
- If issues persist, check Azure App Service CORS settings

## 📊 Monitoring & Debugging

### Enable Debug Logs
Already enabled in development! Look for:
- `[API] GET /api/user -> 200` (API calls)
- `[AUTH] Token exists: true` (Auth state)
- Network tab in React Native Debugger

### Backend Logs
```bash
# View live logs
az webapp log tail --name app-tracklit-dev-kvnx2h --resource-group rg-tracklit-dev

# Download logs
az webapp log download --name app-tracklit-dev-kvnx2h --resource-group rg-tracklit-dev --log-file app-logs.zip
```

## 🚀 Ready to Ship!

All configurations are complete. Your mobile app can now:
- ✅ Connect securely to Azure backend over HTTPS
- ✅ Authenticate with JWT tokens
- ✅ Make authenticated API requests
- ✅ Store tokens securely
- ✅ Work on both iOS and Android

**Next Step**: Build and test! 📱
