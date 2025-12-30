# TrackLit - Change Log

All notable changes to the TrackLit application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] - 2025-12-20

### Fixed
- **Exercise Library Upload** - Fixed critical bug where video uploads were failing
  - Issue: FormData was empty when submitting uploads, causing 400 Bad Request errors
  - Root Cause: `new FormData(e.currentTarget)` wasn't capturing file input in React
  - Solution: Modified `handleUpload` to explicitly query file input and append to FormData
  - Files Changed:
    - `client/src/pages/exercise-library-add-page.tsx` - Enhanced file handling with debug logging
    - `server/routes.ts` - Added comprehensive debug logging for uploads
  - Commit: 0bc02002
  - Status: ⏳ Awaiting deployment (Image build required)

### Added
- Enhanced logging for exercise library operations
  - Upload endpoint logs file presence, body keys, and content-type
  - GET endpoint logs user ID, pagination, filters, and result counts
  - Debug console messages for file attachment tracking

---

## Previous Changes

### 2025-12-20 - Azure Blob Storage Integration

#### Added
- **User-Specific Folder Structure** in Azure Blob Storage
  - Each user gets dedicated folders: `user-{userId}/{container}/`
  - Organized containers: profile-images, video-analysis, exercise-library, photo-finish, messages, programs
  - Permanent file storage replacing ephemeral container storage
  - Image: 20251220-162329

#### Fixed
- **Profile Picture Persistence** - Images now survive app restarts
  - Migrated from local container storage to Azure Blob Storage
  - Storage Account: stkvnx2h6p44qw4 (Standard_LRS, westus)
  - Image: 20251220-155516

- **JSON Response Format** - Exercise library upload error responses
  - Changed `.send("text")` to `.json({ error: "text" })` for consistent API responses
  - Fixed "Unexpected token 'N'" parsing errors in client
  - Image: 20251220-164255

#### Changed
- **Blob Storage Architecture**
  ```
  6 Containers with user-specific folders:
  ├── profile-images/user-{userId}/profile-images/{timestamp}-{uuid}.jpg
  ├── video-analysis/user-{userId}/video-analysis/{timestamp}-{uuid}.mp4
  ├── exercise-library/user-{userId}/exercise-library/{timestamp}-{uuid}.(mp4|jpg)
  ├── photo-finish/user-{userId}/photo-finish/{timestamp}-{uuid}.jpg
  ├── messages/user-{userId}/messages/{timestamp}-{uuid}.(jpg|mp4)
  └── programs/user-{userId}/programs/{timestamp}-{uuid}.pdf
  ```

### 2025-12-19 - UI and Navigation Fixes

#### Fixed
- **My Subscriptions 404 Error** - Route mismatch
  - Changed `/explore` to `/coaches` navigation
  - Image: 20251220-141629

- **Coaches Page Dropdown** - Visibility issue
  - Updated styling: `bg-slate-900 text-white`
  - Image: 20251220-131907

### Earlier Changes

#### Database Schema
- Consolidated migrations: `0000_consolidated_base_schema.sql`
- Friendships table implementation (replaced notification-based system)
- Track & Field specialties added to profile settings
- Coach-athlete relationship cleanup (dropped unused `coach_athletes` table)

#### Features
- Specialties system for track & field athletes
- Enhanced profile settings with specialty selection
- Improved coaches page with proper filtering
- My Athletes page fixes for coaches

---

## Deployment Notes

### Current Production Version
- Image: 20251220-185559 (requires rebuild with latest fixes)
- ACR: tracklitdevkvnx2h.azurecr.io/tracklit-app
- App Service: app-tracklit-dev-kvnx2h
- Database: pg-tracklit-dev-kvnx2h.postgres.database.azure.com
- Storage: stkvnx2h6p44qw4.blob.core.windows.net

### To Deploy Latest Changes
```powershell
cd C:\TrackLitRN
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
docker build -t "tracklitdevkvnx2h.azurecr.io/tracklit-app:$timestamp" .
docker push "tracklitdevkvnx2h.azurecr.io/tracklit-app:$timestamp"
az webapp config container set --name app-tracklit-dev-kvnx2h --resource-group rg-tracklit-dev --container-image-name "tracklitdevkvnx2h.azurecr.io/tracklit-app:$timestamp"
az webapp restart --name app-tracklit-dev-kvnx2h --resource-group rg-tracklit-dev
```

---

## Known Issues

### Active
- Exercise library upload fix needs deployment
  - Code committed: ✅
  - Image built: ⏳ Pending
  - Deployed: ⏳ Pending

### Resolved
- ✅ Profile pictures disappearing after restart - Fixed with Azure Blob Storage
- ✅ Empty FormData on video uploads - Fixed with explicit file appending
- ✅ JSON parsing errors on upload failures - Fixed with consistent response format
- ✅ My Subscriptions 404 errors - Fixed with correct routing
- ✅ Coaches dropdown invisible - Fixed with proper styling
