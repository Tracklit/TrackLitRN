import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR || path.resolve(__dirname, "../../migrations");
const MIGRATIONS = [
  "0001_add_feed_tables.sql",
  "0002_add_marketplace_and_subscription_tables.sql",
];

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} is not set`);
  }
  return v;
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations_sql (
      id serial PRIMARY KEY,
      name text NOT NULL UNIQUE,
      applied_at timestamp DEFAULT now()
    );
  `);
}

async function alreadyApplied(client, name) {
  const result = await client.query("SELECT 1 FROM schema_migrations_sql WHERE name = $1 LIMIT 1", [name]);
  return result.rowCount > 0;
}

async function applyOne(client, name) {
  const filePath = path.join(MIGRATIONS_DIR, name);
  const sql = await fs.readFile(filePath, "utf8");

  if (!sql.trim()) {
    throw new Error(`Migration file is empty: ${name}`);
  }

  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations_sql (name) VALUES ($1)", [name]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function main() {
  // Do not log secrets.
  const databaseUrl = requireEnv("DATABASE_URL");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await ensureMigrationsTable(client);

    for (const name of MIGRATIONS) {
      // eslint-disable-next-line no-console
      console.log(`[migrations] checking ${name}`);

      const applied = await alreadyApplied(client, name);
      if (applied) {
        // eslint-disable-next-line no-console
        console.log(`[migrations] already applied: ${name}`);
        continue;
      }

      // eslint-disable-next-line no-console
      console.log(`[migrations] applying ${name}`);
      await applyOne(client, name);
      // eslint-disable-next-line no-console
      console.log(`[migrations] applied ${name}`);
    }

    // eslint-disable-next-line no-console
    console.log("[migrations] done");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[migrations] failed:", err?.message || err);
  process.exitCode = 1;
});
