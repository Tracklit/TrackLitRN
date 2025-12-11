import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import * as journalSchema from "@shared/journal-schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool for Azure PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Azure PostgreSQL uses SSL
  } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection not available
});

// Log connection status
pool.on('connect', () => {
  console.log('PostgreSQL: Connected to database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL: Unexpected error on idle client', err);
});

export const db = drizzle({
  client: pool,
  schema: {
    ...schema,
    ...journalSchema
  }
});