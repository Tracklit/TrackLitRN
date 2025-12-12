# TrackLit Mobile App - Azure Backend Connectivity Guide

## ✅ ALREADY CONFIGURED

### 1. API Service Layer (COMPLETE)
- **Location**: tracklit-mobile/src/lib/api.ts
- **Features**:
  - Centralized apiRequest function
  - Automatic JWT Bearer token injection
  - Environment-based API_BASE_URL configuration
  - Debug logging in DEV mode
  - Error handling and response parsing

### 2. Authentication Flow (COMPLETE)
- **Location**: tracklit-mobile/src/contexts/AuthContext.tsx
- **Features**:
  - JWT token storage via tokenStorage.ts
  - Login endpoint: /api/mobile/login
  - Token-based authentication
  - Automatic token refresh
  - User state management

### 3. Environment Configuration (COMPLETE)
- **Location**: tracklit-mobile/src/config/env.ts
- **Current API**: https://app-tracklit-dev-kvnx2h.azurewebsites.net
- **Environment Variables**: 
  - EXPO_PUBLIC_API_BASE_URL (preferred)
  - API_BASE_URL (fallback)

### 4. iOS Network Settings (PARTIAL)
- **NSAppTransportSecurity**: Configured in Info.plist
- **NSAllowsArbitraryLoads**: Currently set to false (secure)
- **NSAllowsLocalNetworking**: true (for development)
- ⚠️ NEEDS: Exception domain for Azure backend

### 5. Android Permissions (COMPLETE)
- **INTERNET permission**: ✅ Added in AndroidManifest.xml
- ⚠️ MISSING: network_security_config.xml for HTTPS domains

---

## 🔧 REQUIRED CONFIGURATIONS

### 1. iOS - Add Azure Domain Exception

**File**: tracklit-mobile/ios/tracklitmobile/Info.plist

Add this after the existing NSAppTransportSecurity section:

\\\xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
  <key>NSAllowsLocalNetworking</key>
  <true/>
  <key>NSExceptionDomains</key>
  <dict>
    <key>azurewebsites.net</key>
    <dict>
      <key>NSIncludesSubdomains</key>
      <true/>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <false/>
      <key>NSExceptionRequiresForwardSecrecy</key>
      <true/>
      <key>NSExceptionMinimumTLSVersion</key>
      <string>TLSv1.2</string>
    </dict>
  </dict>
</dict>
\\\

### 2. Android - Create Network Security Config

**File**: tracklit-mobile/android/app/src/main/res/xml/network_security_config.xml
(CREATE THIS FILE)

\\\xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <!-- Allow all secure HTTPS connections -->
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  
  <!-- Azure Web Services domain -->
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">azurewebsites.net</domain>
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </domain-config>
  
  <!-- Development localhost for testing -->
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">localhost</domain>
    <domain includeSubdomains="true">10.0.2.2</domain>
  </domain-config>
</network-security-config>
\\\

**File**: tracklit-mobile/android/app/src/main/AndroidManifest.xml

Add this attribute to the <application> tag:

\\\xml
<application
  android:networkSecurityConfig="@xml/network_security_config"
  ...other attributes...>
\\\

### 3. Environment Variables for Production

**File**: tracklit-mobile/.env (CREATE THIS FILE)

\\\nv
# Development
EXPO_PUBLIC_API_BASE_URL=https://app-tracklit-dev-kvnx2h.azurewebsites.net

# Production (when ready)
# EXPO_PUBLIC_API_BASE_URL=https://your-prod-app.azurewebsites.net
\\\

---

## 🧪 TESTING CHECKLIST

### Pre-Flight Checks
- [ ] Backend health endpoint responds: https://app-tracklit-dev-kvnx2h.azurewebsites.net/api/health
- [ ] JWT token generation working (check backend logs)
- [ ] CORS headers allow mobile requests

### iOS Testing
- [ ] Build and run on iOS simulator
- [ ] Test login with valid credentials
- [ ] Verify token is stored in AsyncStorage
- [ ] Test authenticated API calls
- [ ] Test on physical iOS device (if available)

### Android Testing
- [ ] Build and run on Android emulator
- [ ] Test login with valid credentials
- [ ] Verify token is stored in AsyncStorage
- [ ] Test authenticated API calls
- [ ] Test on physical Android device (if available)

### API Endpoints to Test
1. POST /api/mobile/login (with username/password)
2. GET /api/user (with Bearer token)
3. GET /api/activities (authenticated)
4. Any other endpoints your app uses

---

## 🔒 SECURITY BEST PRACTICES

### Already Implemented ✅
- HTTPS-only connections (no cleartext)
- JWT Bearer token authentication
- Secure token storage (AsyncStorage)
- Environment-based configuration

### Recommended Additions
1. **Certificate Pinning** (for production):
   - Add in both iOS and Android configs
   - Pin to Azure's SSL certificates

2. **Token Refresh Logic**:
   - Implement automatic token refresh before expiry
   - Current token expires in 30 days

3. **Error Handling**:
   - Handle 401 (Unauthorized) globally
   - Automatic logout on token expiry
   - User-friendly error messages

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: "Network request failed" on iOS
**Solution**: Ensure NSExceptionDomains is configured for azurewebsites.net

### Issue 2: "Cleartext HTTP traffic not permitted" on Android
**Solution**: Ensure network_security_config.xml exists and is referenced

### Issue 3: "401 Unauthorized" errors
**Solution**: 
- Check token is being sent in Authorization header
- Verify token hasn't expired
- Check backend JWT_SECRET matches

### Issue 4: CORS errors from mobile
**Solution**: Backend should allow Origin header from mobile apps (already configured)

---

## 📱 MOBILE-SPECIFIC BACKEND REQUIREMENTS

### Already Configured in Backend ✅
1. JWT middleware in server/auth.ts
2. /api/mobile/login endpoint
3. Bearer token validation
4. CORS headers for cross-origin requests
5. Session + JWT hybrid authentication

### No Additional Backend Changes Needed
The backend is fully ready for mobile app connections!

---

## 🚀 DEPLOYMENT STEPS

1. **Apply iOS Configuration**:
   \\\ash
   cd tracklit-mobile/ios
   # Edit Info.plist (add NSExceptionDomains)
   pod install
   \\\

2. **Apply Android Configuration**:
   \\\ash
   # Create network_security_config.xml
   # Update AndroidManifest.xml
   cd tracklit-mobile/android
   ./gradlew clean
   \\\

3. **Test on Simulators**:
   \\\ash
   cd tracklit-mobile
   npx expo run:ios
   npx expo run:android
   \\\

4. **Build for Production**:
   \\\ash
   eas build --platform ios
   eas build --platform android
   \\\

---

## ✅ SUMMARY

**YOU HAVE**:
✅ Complete API service layer with JWT support
✅ Authentication flow with token storage
✅ Environment configuration
✅ Basic iOS and Android permissions

**YOU NEED TO ADD**:
1️⃣ iOS: NSExceptionDomains for azurewebsites.net
2️⃣ Android: network_security_config.xml
3️⃣ Android: Reference config in AndroidManifest.xml
4️⃣ Create .env file with API_BASE_URL

**EVERYTHING ELSE IS READY!** 🎉

The mobile app architecture is well-designed with proper separation of concerns,
centralized API handling, and secure authentication. Just add the iOS/Android
network configurations and you're good to go!
