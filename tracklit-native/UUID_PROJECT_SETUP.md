# UUID Project ID Setup for TrackLit

## Issue Fixed

**Error:** "Invalid UUID appId" with project ID "tracklit-mobile"

**Solution:** Updated to proper UUID format

## Updated Configuration

The project ID has been changed from the invalid format to a proper UUID:

```json
"extra": {
  "eas": {
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

## Important Notes

### Temporary UUID
The UUID `a1b2c3d4-e5f6-7890-abcd-ef1234567890` is a **placeholder**. 

### Getting Your Real UUID

You have two options to get a proper project UUID:

#### Option 1: Let EAS Generate One
When you run `eas project:init` locally, EAS will:
1. Generate a real UUID
2. Automatically update your `app.json`
3. Link the project to your Expo account

#### Option 2: Use Existing Project
If you already have a TrackLit project in your Expo account:
1. Log into https://expo.dev
2. Find your TrackLit project
3. Copy the project ID (it will be a UUID format)
4. Replace the placeholder UUID in `app.json`

## Build Process

### Local Setup Required
Since EAS requires authentication, you must:

1. **Download** the `tracklit-native` folder
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Login to Expo:**
   ```bash
   eas login
   ```
4. **Initialize project (if new):**
   ```bash
   eas project:init
   ```
5. **Build for TestFlight:**
   ```bash
   eas build --platform ios --profile testflight
   ```

## Current Status

✅ Fixed invalid UUID format error
✅ Configuration now uses proper UUID structure
✅ Ready for local EAS build process

The placeholder UUID allows the configuration to validate properly, but you'll need to replace it with a real UUID when you set up the project locally with your Expo account.