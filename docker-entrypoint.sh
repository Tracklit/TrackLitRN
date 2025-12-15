#!/bin/sh
set -e

echo "================================"
echo "TrackLit Container Starting"
echo "================================"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL is set: $(if [ -n \"$DATABASE_URL\" ]; then echo yes; else echo no; fi)"
echo "REDIS_URL is set: $(if [ -n \"$REDIS_URL\" ]; then echo yes; else echo no; fi)"
echo "================================"

# Optional: run SQL migrations in-container (disabled by default)
# Set RUN_SQL_MIGRATIONS=1 to enable.
if [ "$RUN_SQL_MIGRATIONS" = "1" ]; then
  echo "Running SQL migrations..."
  node server/scripts/run-sql-migrations.js
fi

# Start the application
echo "Starting Node.js application..."
exec node dist/index.js
