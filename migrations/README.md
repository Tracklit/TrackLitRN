# TrackLit Database Migrations

## For Fresh Deployments

If you're deploying TrackLit from scratch, use the consolidated schema file instead of running individual migrations:

### Option 1: Using psql (Recommended for local/direct access)

```bash
psql -h <your-db-host> -U <your-db-user> -d <your-db-name> -f migrations/CONSOLIDATED_SCHEMA.sql
```

Example for Azure PostgreSQL:
```bash
$env:PGPASSWORD='your-password'
psql -h pg-tracklit-dev-kvnx2h.postgres.database.azure.com -U tracklit_admin -d tracklit_db -f migrations/CONSOLIDATED_SCHEMA.sql
```

### Option 2: Using Azure CLI

```powershell
az postgres flexible-server execute `
  --name pg-tracklit-dev-kvnx2h `
  --admin-user tracklit_admin `
  --admin-password 'your-password' `
  --database-name tracklit_db `
  --file-path migrations/CONSOLIDATED_SCHEMA.sql
```

## For Existing Deployments

If you already have a database with data, use the individual migration files in order:

1. `0000_curious_gertrude_yorkes.sql` - Base schema
2. `0001_add_feed_tables.sql` - Feed/posts tables
3. `0002_add_marketplace_and_subscription_tables.sql` - Subscriptions
4. `add_country_dateofbirth.sql` - User profile fields
5. `add-friendships-table.sql` - Friendships feature
6. `add-coach-specialties.sql` - Coaching specialties

Run each migration that hasn't been applied yet:

```bash
psql -h <host> -U <user> -d <database> -f migrations/<migration-file>.sql
```

## Migration Files

### CONSOLIDATED_SCHEMA.sql
Complete schema with ALL updates. Use this for:
- Fresh database deployments
- Creating test/dev databases
- Database documentation reference

Includes:
- ✅ All base tables (users, clubs, programs, chat, etc.)
- ✅ Country and date_of_birth fields
- ✅ Friendships table and relationships
- ✅ Coaching specialties (text array)
- ✅ All indexes for performance
- ✅ Proper foreign key constraints

### Individual Migration Files
Use these only if you need to update an existing database:
- Each file is idempotent (can run multiple times safely)
- Run in numbered order (0000, 0001, 0002, etc.)
- Check which migrations have been applied before running

## Verifying Schema

After deployment, verify all tables exist:

```sql
-- List all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check users table columns
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;

-- Verify specialties field
SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'specialties';
```

Expected output should show:
- `country` (TEXT)
- `date_of_birth` (TIMESTAMP)
- `specialties` (ARRAY of TEXT)

## Current Schema Version

**Last Updated:** December 19, 2025

**Major Features:**
1. User authentication and profiles
2. Coach-athlete relationships
3. Training programs and workouts
4. Chat/messaging system
5. Social feed (posts, likes, comments)
6. Clubs and memberships
7. Friendships system
8. Coaching specialties (Track & Field)
9. Subscriptions (Star, Pro tiers)
10. Notifications system

## Need Help?

- For schema questions, check `shared/schema.ts`
- For migration issues, check individual migration files
- For database connection, see `server/storage.ts`
