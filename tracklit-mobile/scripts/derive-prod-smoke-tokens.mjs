#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const { Client } = pg;

const PROD_RESOURCE_GROUP =
  process.env.AZURE_PROD_RESOURCE_GROUP ?? 'rg-tracklit-prod';
const PROD_WEBAPP_NAME =
  process.env.AZURE_PROD_WEBAPP_NAME ?? 'app-tracklit-prod-tnrusd';
const AZURE_SUBSCRIPTION_PREFIX =
  process.env.AZURE_SUBSCRIPTION_PREFIX ?? 'Rugamitas';
const OUTPUT_FORMAT = process.env.SMOKE_TOKEN_OUTPUT_FORMAT ?? 'json';

function selectAzureSubscription(prefix) {
  const raw = execFileSync('az', ['account', 'list', '--all', '--output', 'json'], {
    encoding: 'utf8',
  });
  const accounts = JSON.parse(raw);
  const match = accounts.find((account) =>
    typeof account.name === 'string' && account.name.startsWith(prefix),
  );

  if (!match) {
    throw new Error(`No Azure subscription starts with "${prefix}".`);
  }

  return match;
}

function getAppSettings(subscriptionId) {
  const raw = execFileSync(
    'az',
    [
      'webapp',
      'config',
      'appsettings',
      'list',
      '--subscription',
      subscriptionId,
      '--resource-group',
      PROD_RESOURCE_GROUP,
      '--name',
      PROD_WEBAPP_NAME,
      '--output',
      'json',
    ],
    { encoding: 'utf8' },
  );

  return JSON.parse(raw);
}

function getSetting(settings, name) {
  return settings.find((entry) => entry?.name === name)?.value ?? null;
}

async function deriveUsers(databaseUrl) {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const adminResult = await client.query(`
      select id, username, email, role
      from users
      where role = 'admin'
      order by id asc
      limit 1
    `);

    const memberResult = await client.query(`
      select id, username, email, role
      from users
      where coalesce(role, 'user') <> 'admin'
        and username is not null
      order by id asc
      limit 1
    `);

    const admin = adminResult.rows[0];
    const member = memberResult.rows[0];

    if (!admin || !member) {
      throw new Error('Unable to find both admin and member users in production.');
    }

    return { admin, member };
  } finally {
    await client.end();
  }
}

function signToken(user, secret) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    secret,
    { expiresIn: '2h' },
  );
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

async function run() {
  const subscription = selectAzureSubscription(AZURE_SUBSCRIPTION_PREFIX);
  const settings = getAppSettings(subscription.id);
  const databaseUrl = getSetting(settings, 'DATABASE_URL');
  const jwtSecret = getSetting(settings, 'JWT_SECRET');

  if (!databaseUrl || !jwtSecret) {
    throw new Error('Production app settings are missing DATABASE_URL or JWT_SECRET.');
  }

  const { admin, member } = await deriveUsers(databaseUrl);
  const adminToken = signToken(admin, jwtSecret);
  const memberToken = signToken(member, jwtSecret);

  const payload = {
    subscription: {
      id: subscription.id,
      name: subscription.name,
    },
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      token: adminToken,
    },
    member: {
      id: member.id,
      username: member.username,
      email: member.email,
      role: member.role,
      token: memberToken,
    },
  };

  if (OUTPUT_FORMAT === 'env') {
    process.stdout.write(
      [
        `export E2E_USER_TOKEN=${shellEscape(memberToken)}`,
        `export E2E_ADMIN_TOKEN=${shellEscape(adminToken)}`,
        `export E2E_ADMIN_SEARCH_TERM=${shellEscape(member.username ?? member.email ?? String(member.id))}`,
      ].join('\n') + '\n',
    );
    return;
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
