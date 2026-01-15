# TrackLit - Change Log Update - January 14, 2026

## [2026-01-14] - Sprinthia Integration & UI Fixes

### Added
- **Save Sprinthia Responses as Programs** - New feature to convert AI coaching responses into training programs
  - New endpoint: `POST /api/sprinthia/save-as-program`
  - Creates text-based programs with full AI response preserved
  - Auto-detects rehab vs training content based on keywords
  - Stores content across workout fields (500 chars each: short/medium/long distance + notes)
  - User prompted for custom program title via browser prompt
  - Programs appear in user's Programs section with category "Rehabilitation" or "Training"
  - Commits: f0f69f0e, 6b35fc55, d34e7a1f, 1f80df1a
  - Image: **20260114-184124** ✅ **Deployed**

- **Sprint Time Prediction Tool** - Calculate predicted times across 12 sprint distances
  - Based on Dick's (1987) conversion matrix methodology
  - Distances: 30m, 40m, 50m, 60m, 80m, 100m, 110m, 110mH, 150m, 200m, 220y, 250m
  - Custom velocity decay algorithms for each distance
  - New page route: `/sprint-time-prediction`
  - Commits: 4df15c3f, e065e2bd
  - Image: **20260114-101500** ✅ **Deployed**

### Changed
- **Rehab Page AI Consultation** - Now redirects to Sprinthia for AI consultations
  - Button text: "Start AI Consultation with Sprinthia"
  - Navigates to `/sprinthia` route instead of opening inline modal
  - Improves UX by consolidating all AI interactions in one place
  - Commit: 79d3575b
  - Image: **20260114-184124** ✅ **Deployed**

### Fixed
- **Profile Photo Persistence** - Fixed uploads not persisting across app restarts
  - Root cause: multer diskStorage saves to container filesystem (ephemeral)
  - Solution: Changed multer to memoryStorage for in-memory buffer handling
  - Updated sharp to use `req.file.buffer` instead of file path
  - Removed `fs.unlinkSync` call incompatible with memory storage
  - Photos now properly saved to Azure Blob Storage user-specific folders
  - Commits: ea83d1da, 99fe1623
  - Image: **20260114-110500** ✅ **Deployed**

- **Rehab Page Layout** - Fixed bottom content hidden under navigation bar
  - Added `pb-24` (96px) bottom padding to main container
  - Prevents injury categories from being obscured by bottom nav
  - Commit: 142729ac
  - Image: **20260114-094500** ✅ **Deployed**

### Technical Details

**New API Endpoint:**
```
POST /api/sprinthia/save-as-program
Authentication: Required (req.isAuthenticated())

Request Body:
{
  messageContent: string,    // AI response text (full Sprinthia message)
  programTitle: string,      // User-provided program name
  programType?: string,      // "rehab" or "training" (default: "rehab")
  duration?: number          // Program duration in weeks (default: 4)
}

Response (200):
{
  success: true,
  programId: number,         // Created program ID
  message: "Program saved successfully",
  sessionsCreated: 1         // Always 1 for text-based programs
}

Response (400):
{
  error: "Message content and program title are required"
}

Response (500):
{
  error: "Failed to save program"
}
```

**Implementation Details:**
- Creates program with `dbStorage.createProgram()` using category "Rehabilitation" or "Training"
- Single text-based session created via `dbStorage.createProgramSession()`
- Content distribution:
  - `shortDistanceWorkout`: First 500 characters
  - `mediumDistanceWorkout`: Characters 500-1000
  - `longDistanceWorkout`: Characters 1000-1500
  - `notes`: Remaining content (1500+)
- Program description: First 500 chars + "..." if longer
- Level: "Intermediate" (default)
- isPublic: false (private to user)
- price: 0 (free)

**Files Modified:**
- `server/routes.ts` - Added save-as-program endpoint after line 7590
- `client/src/pages/sprinthia-simple.tsx` - Updated handleSaveAsProgram function
- `client/src/pages/rehab-page.tsx` - Changed AI consultation button to navigate to Sprinthia

**Docker Images Built:**
- 20260114-094500 - Rehab page padding fix
- 20260114-100000 - Sprint prediction tool initial
- 20260114-101500 - Sprint prediction calculations fix ✅
- 20260114-104500 - Profile photo fix attempt 1 (had fs.unlinkSync error)
- 20260114-105500 - Profile photo fix attempt 2 (blank app)
- 20260114-110500 - Profile photo clean build with --no-cache ✅
- 20260114-181949 - Sprinthia save endpoint (syntax error)
- 20260114-182347 - Syntax fix for toast
- 20260114-183843 - Text-based program (syntax error)
- 20260114-184124 - Final deployment with all fixes ✅

**GitHub Repository:**
- Remote: https://github.com/Tracklit/TrackLitRN.git
- Branch: main
- All 7 commits pushed successfully on 2026-01-14

**Production Deployment:**
- App Service: app-tracklit-dev-kvnx2h
- Resource Group: rg-tracklit-dev
- Container Registry: tracklitdevkvnx2h.azurecr.io
- Current Image: tracklitdevkvnx2h.azurecr.io/tracklit-app:20260114-184124
- Status: ✅ Running and fully operational

