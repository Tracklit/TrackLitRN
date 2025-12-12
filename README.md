# TrackLit - Track & Field Training Platform

[![Deployment](https://img.shields.io/badge/Azure-Deployed-blue)](https://app-tracklit-dev-kvnx2h.azurewebsites.net)
[![Node](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TrackLit is a comprehensive web application for track and field athletes and coaches. It offers training program management, meet scheduling, performance tracking, and advanced video analysis with AI-powered coaching insights.

## 🎯 Current Status

- ✅ **Production Ready** - Deployed on Azure App Service
- ✅ **Mobile Support** - iOS & Android network configurations complete
- ✅ **JWT Authentication** - Secure mobile login implemented
- ✅ **Azure Blob Storage** - Cloud file storage integrated
- ✅ **Repository Cleaned** - Organized and optimized (Dec 2025)

**Live Deployment:** [app-tracklit-dev-kvnx2h.azurewebsites.net](https://app-tracklit-dev-kvnx2h.azurewebsites.net)

## 📁 Repository Structure

```
TrackLitRN/
├── client/              # React frontend (Vite + TypeScript)
├── server/              # Express.js backend (Node.js + Express)
├── shared/              # Shared types/schemas (Drizzle ORM)
├── migrations/          # Database migrations
├── public/              # Static assets (audio, images, icons)
├── uploads/             # User-uploaded files (development only)
├── tracklit-mobile/     # React Native mobile app (Expo)
│   ├── ios/            # iOS-specific configs & network settings
│   └── android/        # Android-specific configs & network security
├── dist/               # Production build output (Vite)
├── Dockerfile          # Multi-stage Docker build (Node 20 Alpine)
└── docs/               # Mobile connectivity guides (3 files)
```

## 🚀 Web App Setup

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/TrackLitRN.git
   cd TrackLitRN
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env  # or create manually
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory with:
   ```env
   # Database (Required)
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

   # Session & Auth (Required)
   SESSION_SECRET=your-secure-64-char-random-string-here
   JWT_SECRET=your-secure-64-char-random-string-here

   # Redis (Required for production)
   REDIS_URL=redis://localhost:6379
   # OR for Azure Redis with SSL:
   # REDIS_URL=rediss://:password@your-redis.redis.cache.windows.net:6380

   # Azure Blob Storage (Required for production)
   AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...

   # Optional - AI Features
   OPENAI_API_KEY=sk-your-openai-key

   # Optional - Payments
   STRIPE_SECRET_KEY=sk_test_your-stripe-key
   VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-key

   # Optional - Weather
   WEATHER_API_KEY=your-weatherapi-key

   # Optional - Google Services
   GOOGLE_MAPS_API_KEY=your-google-maps-key
   GOOGLE_SHEETS_CREDENTIALS=your-credentials-json
   ```

   **Generate secure secrets:**
   ```powershell
   # PowerShell - Generate 64-character secrets
   $sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
   $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
   Write-Host "SESSION_SECRET=$sessionSecret"
   Write-Host "JWT_SECRET=$jwtSecret"
   ```

### Installation & Running

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up the database**
   ```bash
   npm run db:push
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5000`

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast builds
- **Tailwind CSS** for styling
- **Radix UI + shadcn/ui** for components
- **TanStack Query** for data fetching
- **Wouter** for routing

### Backend
- **Node.js 20 + Express.js**
- **PostgreSQL 15** with Drizzle ORM
- **Redis** for sessions & caching
- **Passport.js** for authentication
- **JWT** for mobile token auth
- **Multer** for file uploads
- **Azure Blob Storage** for cloud files

### Integrations
- **OpenAI GPT-4** - AI coaching feedback
- **Stripe** - Payment processing
- **MediaPipe** - Video analysis
- **Google Sheets** - Program import
- **WeatherAPI** - Meet weather forecasts
- **Azure Communication Services** - Notifications (optional)

## 📱 Mobile App

The mobile app is a React Native + Expo project located in `tracklit-mobile/`.

### Quick Start
```bash
cd tracklit-mobile
npm install
npm start  # Starts Expo dev server
```

### Network Configuration (iOS & Android)
- ✅ **iOS:** NSExceptionDomains configured for azurewebsites.net
- ✅ **Android:** network_security_config.xml with cleartext traffic rules
- ✅ **JWT Authentication:** Mobile login fully functional

**Guides:**
- [MOBILE-CONNECTIVITY-GUIDE.md](./MOBILE-CONNECTIVITY-GUIDE.md) - Complete setup guide
- [MOBILE-QUICK-CHECKLIST.md](./MOBILE-QUICK-CHECKLIST.md) - Testing checklist
- [MOBILE-API-TESTING.md](./MOBILE-API-TESTING.md) - API testing examples

See [tracklit-mobile/README.md](./tracklit-mobile/README.md) for detailed instructions.

## 🧪 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 5000) |
| `npm run build` | Build for production (Vite + TypeScript) |
| `npm start` | Run production server |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push Drizzle schema to database |
| `npm run db:generate` | Generate database migrations |
| `npm run db:migrate` | Run database migrations |

## 📂 Key Directories

- `client/src/pages/` - Page components (React Router)
- `client/src/components/` - Reusable UI components (shadcn/ui)
- `client/src/hooks/` - Custom React hooks (TanStack Query)
- `client/src/lib/` - Utility functions & API client
- `server/routes/` - API route handlers (Express)
- `server/middleware/` - Auth, error handling, rate limiting
- `server/objectStorage.ts` - Azure Blob Storage service
- `server/multerAzureStorage.ts` - File upload to Azure
- `shared/schema.ts` - Database schema (Drizzle ORM)
- `shared/types.ts` - TypeScript type definitions

## 🔒 Authentication

The app supports dual authentication strategies:

### Web (Session-based)
- **Passport.js** local strategy with express-session
- **Redis** for session storage
- Session cookies (httpOnly, secure, sameSite)

### Mobile (Token-based)
- **JWT** tokens for React Native apps
- **POST /api/auth/mobile/login** - Get JWT token
- **Authorization: Bearer <token>** - API authentication
- Tokens stored securely in device keychain/keystore

### User Roles
- **Athlete** - Basic user account, training tracking
- **Coach** - Can create programs and manage athletes
- **Admin** - Full system access, user management

## 🚀 Deployment

This application is designed for Azure deployment. See the infrastructure repository:

**[Tracklit-Infra-Deployment](https://github.com/Tracklit/Tracklit-Infra-Deployment)**

### Azure Resources
- **App Service** (B2, Linux, Node 20)
- **PostgreSQL Flexible Server** (v15)
- **Redis Cache** (Standard C1)
- **Blob Storage** (media files)
- **Application Insights** (monitoring)
- **Key Vault** (secrets management)

**Deployment time:** 6-8 minutes with automated build

## 🔧 Development Tips

### Local Development
- Use PostgreSQL locally or connect to Azure dev database
- Redis optional for local dev (sessions stored in memory)
- Azure Blob Storage optional (files saved to `uploads/` folder)

### Docker Development
```bash
# Build Docker image
docker build -t tracklit-app .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="..." \
  -e JWT_SECRET="..." \
  tracklit-app
```

### Database Migrations
```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema directly (dev only)
npm run db:push
```

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/Tracklit/TrackLitRN/issues)
- **Infrastructure:** [Tracklit-Infra-Deployment](https://github.com/Tracklit/Tracklit-Infra-Deployment)
- **Mobile Guides:** See `MOBILE-*.md` files in root directory

---

**Built with ❤️ for track & field athletes and coaches**

