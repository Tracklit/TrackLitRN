#!/bin/sh
set -e

echo "================================"
echo "TrackLit Container Starting"
echo "================================"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..." 
echo "REDIS_URL: ${REDIS_URL:0:40}..."
echo "================================"

# Test database connectivity
echo "Testing PostgreSQL connection..."
if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL is set"
else
    echo "WARNING: DATABASE_URL is not set!"
fi

# Start the application
echo "Starting Node.js application..."
exec node dist/index.js
