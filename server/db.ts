import { Pool, PoolClient } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import * as journalSchema from "@shared/journal-schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isProduction = process.env.NODE_ENV === 'production';

// Configure pool for Azure PostgreSQL with resilient settings
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false // Azure PostgreSQL uses SSL
  } : false,
  // Reduced pool size to prevent exhausting Azure Burstable tier's 50 connection limit
  max: isProduction ? 10 : 20,
  min: 2, // Keep minimum connections ready
  idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
  connectionTimeoutMillis: 15000, // Return error after 15 seconds if connection not available
  // Enable keepalive to prevent Azure from dropping idle connections
  keepAlive: true,
  keepAliveInitialDelayMillis: 30000,
});

// Log connection status
pool.on('connect', (client: PoolClient) => {
  console.log('PostgreSQL: New client connected to pool');
});

pool.on('error', (err) => {
  console.error('PostgreSQL: Pool error -', err.message);
  // Don't crash on connection errors, pool will recover
});

pool.on('remove', () => {
  console.log('PostgreSQL: Client removed from pool');
});

// Health check function for monitoring
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1 as health');
    return result.rows[0]?.health === 1;
  } catch (error) {
    console.error('PostgreSQL: Health check failed -', (error as Error).message);
    return false;
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  console.log('PostgreSQL: Closing connection pool...');
  await pool.end();
  console.log('PostgreSQL: Pool closed');
}

export const db = drizzle({
  client: pool,
  schema: {
    ...schema,
    ...journalSchema
  }
});