# TrackLit API Rebuild Guide

This guide ensures you never lose updates or fixes when rebuilding the API from scratch.

## ✅ Pre-Rebuild Checklist

Before rebuilding the API, verify all changes are committed:

```powershell
cd C:\TrackLitRN

# 1. Check for uncommitted changes
git status

# 2. Verify all commits are pushed to GitHub
git log --oneline -10
git push origin main

# 3. Verify current deployment
az webapp config container show --name app-tracklit-dev-kvnx2h --resource-group rg-tracklit-dev --query "linuxFxVersion" -o tsv

# 4. Document current image tag
docker images tracklitdevkvnx2h.azurecr.io/tracklit-app --format "{{.Tag}}"
```

## 📝 Critical Files to Never Lose

### Server Files
- `server/routes.ts` - All API endpoints including:
  - `/api/sprinthia/save-as-program` (NEW - Jan 14, 2026)
  - `/api/sprinthia/chat`
  - `/api/rehab/*`
  - Profile photo upload with Azure Blob Storage
  - Program management endpoints

- `server/index.ts` - Server configuration
- `server/db/storage.ts` - Database operations
- `server/middleware/*` - Authentication, error handling

### Client Files
- `client/src/pages/sprinthia-simple.tsx` - Sprinthia chat with save-as-program
- `client/src/pages/rehab-page.tsx` - Rehab page with Sprinthia navigation
- `client/src/pages/sprint-time-prediction-page.tsx` - Sprint prediction tool (NEW)
- `client/src/pages/exercise-library-add-page.tsx` - Exercise uploads
- `client/src/pages/profile-page.tsx` - Profile photo uploads

### Configuration Files
- `Dockerfile` - Multi-stage build configuration
- `docker-entrypoint.sh` - Container startup script
- `.dockerignore` - Build exclusions
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration

### Database
- `migrations/*` - All database migration files
- `shared/schema.ts` - Database schema definitions

## 🔄 Complete Rebuild Process

### Step 1: Verify GitHub Repository is Current
```powershell
# Clone fresh copy (optional)
git clone https://github.com/Tracklit/TrackLitRN.git TrackLitRN-Fresh
cd TrackLitRN-Fresh

# Or pull latest
cd C:\TrackLitRN
git pull origin main
```

### Step 2: Verify All Dependencies
```powershell
# Check package.json for required packages
Get-Content package.json | Select-String -Pattern "@azure|multer|sharp"

# Key dependencies:
# - @azure/storage-blob (Azure Blob Storage)
# - multer (File uploads)
# - sharp (Image processing)
# - express (Server)
# - drizzle-orm (Database ORM)
```

### Step 3: Build Docker Image
```powershell
# Get timestamp for new image
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Build with cache (fast)
docker build -t "tracklitdevkvnx2h.azurecr.io/tracklit-app:$timestamp" .

# OR build clean without cache (if issues)
docker build --no-cache -t "tracklitdevkvnx2h.azurecr.io/tracklit-app:$timestamp" .
```

### Step 4: Test Locally (Optional)
```powershell
# Run container locally with environment variables
docker run -p 5000:5000 `
  -e DATABASE_URL="your-postgres-url" `
  -e SESSION_SECRET="your-secret" `
  -e AZURE_STORAGE_ACCOUNT_NAME="stkvnx2h6p44qw4" `
  -e AZURE_STORAGE_ACCOUNT_KEY="your-key" `
  "tracklitdevkvnx2h.azurecr.io/tracklit-app:$timestamp"

# Test endpoints:
# http://localhost:5000 - Main app
# http://localhost:5000/api/health - Health check
```

### Step 5: Push to Azure Container Registry
```powershell
# Login to ACR
az acr login --name tracklitdevkvnx2h

# Push image
docker push "tracklitdevkvnx2h.azurecr.io/tracklit-app:$timestamp"

# Verify push
az acr repository show-tags --name tracklitdevkvnx2h --repository tracklit-app --output table
```

### Step 6: Deploy to App Service
```powershell
# Update App Service to use new image
az webapp config container set `
  --name app-tracklit-dev-kvnx2h `
  --resource-group rg-tracklit-dev `
  --container-image-name "tracklitdevkvnx2h.azurecr.io/tracklit-app:$timestamp"

# Restart App Service
az webapp restart --name app-tracklit-dev-kvnx2h --resource-group rg-tracklit-dev

# Monitor logs
az webapp log tail --name app-tracklit-dev-kvnx2h --resource-group rg-tracklit-dev
```

### Step 7: Verify Deployment
```powershell
# Check app is running
az webapp show --name app-tracklit-dev-kvnx2h --resource-group rg-tracklit-dev --query "state" -o tsv

# Test critical endpoints
$appUrl = "https://app-tracklit-dev-kvnx2h.azurewebsites.net"
Invoke-WebRequest "$appUrl/api/health" | Select-Object StatusCode
```

## 🚨 Recent Changes to Preserve (Jan 14, 2026)

### 1. Sprinthia Program Save Feature
**File:** `server/routes.ts`
**Location:** After line 7590
**Endpoint:** `POST /api/sprinthia/save-as-program`

```typescript
app.post("/api/sprinthia/save-as-program", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }

  try {
    const { messageContent, programTitle, programType = "rehab", duration = 4 } = req.body;
    const userId = req.user.id;

    if (!messageContent || !programTitle) {
      return res.status(400).json({ error: "Message content and program title are required" });
    }

    // Create the program
    const program = await dbStorage.createProgram({
      userId,
      title: programTitle.slice(0, 100),
      category: programType === "rehab" ? "Rehabilitation" : "Training",
      level: "Intermediate",
      duration,
      totalSessions: 1, // Single text-based session
      description: messageContent.slice(0, 500) + (messageContent.length > 500 ? '...' : ''),
      isPublic: false,
      price: 0
    });

    // Create a single text-based session with the full AI response
    await dbStorage.createProgramSession({
      programId: program.id,
      dayNumber: 1,
      weekNumber: 1,
      title: programTitle,
      isRestDay: false,
      shortDistanceWorkout: messageContent.slice(0, 500),
      mediumDistanceWorkout: messageContent.length > 500 ? messageContent.slice(500, 1000) : undefined,
      longDistanceWorkout: messageContent.length > 1000 ? messageContent.slice(1000, 1500) : undefined,
      notes: messageContent.length > 1500 ? messageContent.slice(1500) : "AI-generated program from Sprinthia"
    });

    res.json({
      success: true,
      programId: program.id,
      message: "Program saved successfully",
      sessionsCreated: 1
    });
  } catch (error: any) {
    console.error("Error saving Sprinthia message as program:", error);
    res.status(500).json({ error: "Failed to save program" });
  }
});
```

### 2. Sprinthia UI Save Handler
**File:** `client/src/pages/sprinthia-simple.tsx`
**Function:** `handleSaveAsProgram`

```typescript
const handleSaveAsProgram = async (content: string, messageId: string) => {
  try {
    setSavingMessageId(messageId);

    // Prompt user for program title
    const programTitle = prompt("Enter a title for this program:", "Recovery Program from Sprinthia");
    if (!programTitle) {
      setSavingMessageId(null);
      return;
    }

    // Detect if content is rehab-related
    const isRehab = /rehab|rehabilitation|recovery|injury|strain|pain|heal|hamstring|ankle|knee|shoulder|back/i.test(content);

    // Save as structured program with sessions
    const response = await apiRequest('POST', '/api/sprinthia/save-as-program', {
      messageContent: content,
      programTitle: programTitle,
      programType: isRehab ? "rehab" : "training",
      duration: 4
    });

    if (response.ok) {
      const result = await response.json();
      toast({
        title: "Program saved!",
        description: "Training plan added to your programs",
      });
      setTimeout(() => setSavingMessageId(null), 2000);
    } else {
      throw new Error('Failed to save program');
    }
  } catch (err) {
    console.error('Error saving program:', err);
    toast({
      title: "Failed to save",
      description: "Could not save program",
      variant: "destructive",
    });
    setSavingMessageId(null);
  }
};
```

### 3. Rehab Page Sprinthia Navigation
**File:** `client/src/pages/rehab-page.tsx`
**Change:** Button navigates to `/sprinthia`

```typescript
import { Link, useLocation } from "wouter";

const [, setLocation] = useLocation();

// In JSX:
<Button onClick={() => setLocation("/sprinthia")}>
  <Sparkles className="h-4 w-4 mr-2" />
  Start AI Consultation with Sprinthia
</Button>
```

### 4. Profile Photo Upload Fix
**File:** `server/routes.ts`
**Change:** Multer uses memoryStorage instead of diskStorage

```typescript
// Profile photo upload with Azure Blob Storage
const profileUpload = multer({
  storage: multer.memoryStorage(), // ✅ Changed from diskStorage
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

app.post("/api/profile/photo", profileUpload.single('photo'), async (req: Request, res: Response) => {
  // ... authentication checks ...

  // ✅ Use buffer instead of file path
  const processedImageBuffer = await sharp(req.file.buffer)
    .resize(400, 400, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toBuffer();

  // ✅ No fs.unlinkSync needed with memoryStorage
});
```

### 5. Sprint Time Prediction Tool
**File:** `client/src/pages/sprint-time-prediction-page.tsx` (NEW FILE)
**Route:** `/sprint-time-prediction`

Complete implementation of Dick's (1987) conversion matrix for 12 sprint distances.

## 📊 Environment Variables Required

Ensure these are set in App Service Configuration:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/tracklit

# Session
SESSION_SECRET=your-secret-key

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT_NAME=stkvnx2h6p44qw4
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key

# OpenAI (for Sprinthia)
OPENAI_API_KEY=your-openai-key

# External Services (optional)
TERRA_API_KEY=your-terra-key
STRIPE_SECRET_KEY=your-stripe-key
AZURE_COMMUNICATION_CONNECTION_STRING=your-acs-connection
```

## 🧪 Testing After Rebuild

### Critical Features to Test:

1. **Sprinthia Program Save**
   - Go to `/sprinthia`
   - Ask: "I have a hamstring strain, need 4-week recovery program"
   - Click Save button on response
   - Enter program title
   - Verify appears in Programs section

2. **Profile Photo Upload**
   - Go to `/profile`
   - Upload new profile photo
   - Restart app
   - Verify photo persists

3. **Sprint Time Prediction**
   - Go to `/sprint-time-prediction`
   - Enter known 100m time
   - Verify predictions match Dick's (1987) matrix

4. **Rehab to Sprinthia Navigation**
   - Go to `/rehab`
   - Click "Start AI Consultation with Sprinthia"
   - Verify navigates to `/sprinthia`

## 🔐 Security Checklist

- [ ] All secrets in Azure Key Vault or App Service Configuration
- [ ] No hardcoded credentials in code
- [ ] `.env` files in `.gitignore`
- [ ] Authentication required on sensitive endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enabled

## 📚 Additional Documentation

- **CHANGELOG.md** - Complete history of all changes
- **README.md** - Project overview and setup
- **DEPLOYMENT-SUMMARY-20251214.md** - Previous deployment details
- **MOBILE-*.md** - Mobile app integration guides

## 🆘 Rollback Procedure

If rebuild causes issues:

```powershell
# Find previous working image
az acr repository show-tags --name tracklitdevkvnx2h --repository tracklit-app --output table

# Rollback to known good image
az webapp config container set `
  --name app-tracklit-dev-kvnx2h `
  --resource-group rg-tracklit-dev `
  --container-image-name "tracklitdevkvnx2h.azurecr.io/tracklit-app:20260114-184124"

az webapp restart --name app-tracklit-dev-kvnx2h --resource-group rg-tracklit-dev
```

## ✅ Verification Complete

After following this guide:
- All code committed to GitHub ✅
- All features documented ✅
- Rebuild process tested ✅
- Rollback plan ready ✅

**Last Updated:** January 14, 2026
**Current Production Image:** tracklitdevkvnx2h.azurecr.io/tracklit-app:20260114-184124
**GitHub Repository:** https://github.com/Tracklit/TrackLitRN.git
