#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const PROD_BASE_URL =
  process.env.PROD_API_BASE_URL ??
  'https://app-tracklit-prod-tnrusd.azurewebsites.net';
const AZURE_SUBSCRIPTION_PREFIX =
  process.env.AZURE_SUBSCRIPTION_PREFIX ?? 'Rugamitas';
const PROD_TOKEN_DERIVATION_SCRIPT = new URL('./derive-prod-smoke-tokens.mjs', import.meta.url);

function log(step, message) {
  process.stdout.write(`[${step}] ${message}\n`);
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function resolveIdentifier(prefix) {
  return process.env[`${prefix}_USERNAME`] ?? process.env[`${prefix}_EMAIL`] ?? null;
}

function resolveToken(prefix) {
  return process.env[`${prefix}_TOKEN`] ?? null;
}

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

  execFileSync('az', ['account', 'set', '--subscription', match.id], {
    stdio: 'ignore',
  });

  return match;
}

async function request(path, options = {}) {
  const response = await fetch(`${PROD_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    redirect: options.redirect ?? 'follow',
  });

  if (options.expectedStatuses && !options.expectedStatuses.includes(response.status)) {
    const text = await response.text();
    throw new Error(
      `${options.method ?? 'GET'} ${path} returned ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  if (options.parse === 'text') {
    return { response, body: await response.text() };
  }

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

async function login(prefix) {
  const explicitToken = resolveToken(prefix);
  if (explicitToken) {
    return { identifier: `${prefix.toLowerCase()}-token`, token: explicitToken, user: null };
  }

  const identifier = resolveIdentifier(prefix);
  const password = getRequiredEnv(`${prefix}_PASSWORD`);

  if (!identifier) {
    throw new Error(`Missing ${prefix}_USERNAME or ${prefix}_EMAIL.`);
  }

  const payload = identifier.includes('@')
    ? { email: identifier, password }
    : { username: identifier, password };

  const { body } = await request('/api/mobile/login', {
    method: 'POST',
    body: payload,
    expectedStatuses: [200],
  });

  if (!body?.token) {
    throw new Error(`${prefix} login succeeded without a token.`);
  }

  return { identifier, token: body.token, user: body };
}

function maybeDeriveTokens() {
  const needsUserCredentials =
    !resolveToken('E2E_USER') &&
    (!resolveIdentifier('E2E_USER') || !process.env.E2E_USER_PASSWORD);
  const needsAdminCredentials =
    !resolveToken('E2E_ADMIN') &&
    (!resolveIdentifier('E2E_ADMIN') || !process.env.E2E_ADMIN_PASSWORD);

  if (!needsUserCredentials && !needsAdminCredentials) {
    return;
  }

  log('azure', 'Deriving short-lived prod smoke tokens via Azure config and a read-only DB lookup');
  const envExports = execFileSync(
    'node',
    [PROD_TOKEN_DERIVATION_SCRIPT.pathname],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        SMOKE_TOKEN_OUTPUT_FORMAT: 'env',
      },
    },
  );

  for (const line of envExports.split('\n')) {
    const match = line.match(/^export\s+([A-Z0-9_]+)='(.*)'$/);
    if (!match) continue;
    process.env[match[1]] = match[2].replace(/'\\''/g, "'");
  }
}

function getSetCookie(response) {
  if (typeof response.headers.getSetCookie === 'function') {
    return response.headers.getSetCookie().join('; ');
  }

  return response.headers.get('set-cookie') ?? '';
}

async function run() {
  log('azure', `Selecting subscription starting with "${AZURE_SUBSCRIPTION_PREFIX}"`);
  const subscription = selectAzureSubscription(AZURE_SUBSCRIPTION_PREFIX);
  log('azure', `Using subscription "${subscription.name}"`);

  maybeDeriveTokens();

  log('user', 'Authenticating member QA account');
  const member = await login('E2E_USER');

  log('user', 'Checking /api/user');
  const { body: memberProfile } = await request('/api/user', {
    token: member.token,
    expectedStatuses: [200],
  });

  log('user', 'Checking notifications');
  const { body: notifications } = await request('/api/notifications?limit=10&offset=0', {
    token: member.token,
    expectedStatuses: [200],
  });

  log('user', 'Checking Sprinthia conversation history');
  const { body: conversations } = await request('/api/sprinthia/conversations', {
    token: member.token,
    expectedStatuses: [200],
  });

  if (process.env.SMOKE_SEND_SPRINTHIA === '1') {
    log('user', 'Sending a read-only Sprinthia smoke prompt');
    await request('/api/sprinthia/chat', {
      method: 'POST',
      token: member.token,
      body: {
        message: 'Smoke test: reply with a short acknowledgement only.',
      },
      expectedStatuses: [200],
    });
  } else {
    log('user', 'Skipping prompt-spend Sprinthia send check (set SMOKE_SEND_SPRINTHIA=1 to enable)');
  }

  log('admin', 'Authenticating admin QA account');
  const admin = await login('E2E_ADMIN');
  const adminSearchTerm =
    process.env.E2E_ADMIN_SEARCH_TERM ??
    memberProfile?.username ??
    memberProfile?.email ??
    member.user?.username ??
    member.user?.email ??
    member.identifier;

  log('admin', `Searching admin users for "${adminSearchTerm}"`);
  const { body: adminSearchResults } = await request(
    `/api/admin/users?search=${encodeURIComponent(adminSearchTerm)}`,
    {
      token: admin.token,
      expectedStatuses: [200],
    },
  );

  log('admin', 'Checking mobile-to-web admin session handoff');
  const { response: handoffResponse } = await request('/api/mobile/web-session?redirect=/admin-panel', {
    token: admin.token,
    expectedStatuses: [302],
    parse: 'text',
    redirect: 'manual',
  });
  const location = handoffResponse.headers.get('location') ?? '';
  const cookie = getSetCookie(handoffResponse);

  if (!location.includes('/admin-panel')) {
    throw new Error(`Admin handoff redirected to unexpected location: ${location || '(missing)'}`);
  }

  if (!cookie) {
    throw new Error('Admin handoff did not issue a session cookie.');
  }

  log('admin', 'Loading admin panel with issued session cookie');
  const adminPageResponse = await fetch(`${PROD_BASE_URL}/admin-panel`, {
    headers: {
      Cookie: cookie,
    },
    redirect: 'manual',
  });

  if (adminPageResponse.status >= 400) {
    const text = await adminPageResponse.text();
    throw new Error(`GET /admin-panel returned ${adminPageResponse.status}: ${text.slice(0, 300)}`);
  }

  const summary = {
    subscription: {
      id: subscription.id,
      name: subscription.name,
    },
    prodBaseUrl: PROD_BASE_URL,
    member: {
      id: memberProfile?.id,
      username: memberProfile?.username,
      authMode: resolveToken('E2E_USER') ? 'token' : 'credentials',
      notificationsCount: Array.isArray(notifications) ? notifications.length : null,
      conversationCount: Array.isArray(conversations) ? conversations.length : null,
      promptSendChecked: process.env.SMOKE_SEND_SPRINTHIA === '1',
    },
    admin: {
      id: admin.user?.id ?? null,
      username: admin.user?.username ?? null,
      authMode: resolveToken('E2E_ADMIN') ? 'token' : 'credentials',
      searchResultCount: Array.isArray(adminSearchResults) ? adminSearchResults.length : null,
      handoffLocation: location,
      adminPanelStatus: adminPageResponse.status,
    },
  };

  log('done', JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
