# Apple Sign-In Setup Guide for TrackLit

This guide explains how to configure Sign in with Apple for the TrackLit application.

## Prerequisites

1. An Apple Developer account ($99/year)
2. Access to the [Apple Developer Portal](https://developer.apple.com)

## Step 1: Create an App ID

1. Go to **Certificates, Identifiers & Profiles** → **Identifiers**
2. Click the **+** button to create a new identifier
3. Select **App IDs** and click **Continue**
4. Select **App** as the type
5. Enter:
   - **Description**: TrackLit
   - **Bundle ID**: com.tracklit.app (Explicit)
6. Under **Capabilities**, check **Sign In with Apple**
7. Click **Continue** and **Register**

## Step 2: Create a Services ID (for Web)

1. Go to **Identifiers** and click **+**
2. Select **Services IDs** and click **Continue**
3. Enter:
   - **Description**: TrackLit Web
   - **Identifier**: com.tracklit.web (this will be your `APPLE_CLIENT_ID`)
4. Click **Continue** and **Register**
5. Click on the newly created Services ID
6. Check **Sign In with Apple** and click **Configure**
7. Configure the domains and return URLs:
   - **Domains**: `app-tracklit-dev-kvnx2h.azurewebsites.net` (your production domain)
   - **Return URLs**: `https://app-tracklit-dev-kvnx2h.azurewebsites.net/api/auth/apple/callback`
8. Click **Save**

## Step 3: Create a Sign-In Key

1. Go to **Keys** and click **+**
2. Enter:
   - **Key Name**: TrackLit Sign In Key
3. Check **Sign In with Apple** and click **Configure**
4. Select your **Primary App ID** (com.tracklit.app)
5. Click **Save** then **Continue** then **Register**
6. **Download the key file** (`.p8`) - you can only download it once!
7. Note the **Key ID** (this will be your `APPLE_KEY_ID`)

## Step 4: Find Your Team ID

1. Go to the top right of the Apple Developer Portal
2. Click on your account name
3. Your **Team ID** is shown (10-character alphanumeric string)

## Step 5: Configure Environment Variables

Add these environment variables to your Azure App Service:

```
APPLE_CLIENT_ID=com.tracklit.web          # Your Services ID
APPLE_TEAM_ID=XXXXXXXXXX                   # Your 10-character Team ID
APPLE_KEY_ID=XXXXXXXXXX                    # Your Key ID from Step 3
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

### Converting the Private Key

The `.p8` file content needs to be converted to a single line with `\n` for newlines:

```bash
# Option 1: Use awk to convert to single line
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' AuthKey_XXXXXXXXXX.p8

# Option 2: Manual conversion
# Copy the content and replace actual newlines with \n
```

Example:
```
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCC...\n-----END PRIVATE KEY-----
```

## Step 6: Run Database Migration

Before deploying, run the migration to add the `apple_id` column:

```sql
-- Run this on your PostgreSQL database
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id) WHERE apple_id IS NOT NULL;
```

Or use the migration file:
```bash
psql $DATABASE_URL -f migrations/0004_add_apple_id.sql
```

## Step 7: Test the Integration

1. Deploy the updated application
2. Navigate to the auth page
3. Click "Continue with Apple"
4. Complete the Apple Sign-In flow
5. Verify user is created/logged in

## Troubleshooting

### "Invalid redirect_uri" Error
- Ensure the Return URL in Services ID configuration matches exactly
- URL must use HTTPS
- No trailing slash

### "Invalid client_id" Error
- Verify `APPLE_CLIENT_ID` matches your Services ID identifier
- Not the App ID - use the Services ID for web auth

### "Invalid grant" Error
- Private key may be incorrect
- Key might be expired (keys expire after 6 months if unused)
- Team ID might be wrong

### User Email Not Received
- Apple only sends email on first authorization
- User may have chosen "Hide My Email"
- Store the Apple ID (`sub` claim) to identify returning users

## Security Notes

1. **Never commit** the private key to version control
2. Store secrets in Azure Key Vault in production
3. The private key should be rotated periodically
4. Apple requires HTTPS for all callbacks

## Mobile App Integration

For the React Native mobile app, use `expo-apple-authentication`:

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';

// In your login component
const handleAppleSignIn = async () => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  
  // Send credential.identityToken to your backend
  const response = await fetch('/api/auth/apple/mobile', {
    method: 'POST',
    body: JSON.stringify({ identityToken: credential.identityToken }),
  });
};
```

## References

- [Sign in with Apple Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Apple Authentication Services](https://developer.apple.com/documentation/authenticationservices)
- [passport-apple NPM Package](https://www.npmjs.com/package/passport-apple)
