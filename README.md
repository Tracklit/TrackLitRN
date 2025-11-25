# TrackLit - Track & Field Training Platform

TrackLit is a comprehensive web application for track and field athletes and coaches. It offers training program management, meet scheduling, performance tracking, and advanced video analysis with AI-powered coaching insights.

## 📁 Repository Structure

```
TrackLitRN/
├── client/              # React frontend (Vite + TypeScript)
├── server/              # Express.js backend (Node.js)
├── shared/              # Shared schemas between frontend/backend
├── migrations/          # Drizzle ORM database migrations
├── public/              # Static assets (audio, images)
├── uploads/             # User-uploaded content
├── attached_assets/     # Additional assets
├── tracklit-mobile/     # React Native mobile app (separate project)
└── old/                 # Archived/unused files (for reference only)
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

   # Session (Required)
   SESSION_SECRET=your-secure-random-string-here

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
- **Node.js + Express.js**
- **PostgreSQL** with Drizzle ORM
- **Passport.js** for authentication
- **Multer** for file uploads

### Integrations
- **OpenAI** - AI coaching feedback
- **Stripe** - Payment processing
- **MediaPipe** - Video analysis
- **Google Sheets** - Program import
- **WeatherAPI** - Meet weather forecasts

## 📱 Mobile App

The mobile app is a separate React Native project located in `tracklit-mobile/`.
See [tracklit-mobile/README.md](./tracklit-mobile/README.md) for setup instructions.

## 🧪 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push schema to database |

## 📂 Key Directories

- `client/src/pages/` - Page components
- `client/src/components/` - Reusable UI components
- `client/src/hooks/` - Custom React hooks
- `server/routes/` - API route handlers
- `shared/schema.ts` - Database schema definitions

## 🔒 Authentication

The app uses session-based authentication with Passport.js local strategy. User roles:
- **Athlete** - Basic user account
- **Coach** - Can create programs and manage athletes
- **Admin** - Full system access

## 📄 License

MIT License - see LICENSE file for details.

