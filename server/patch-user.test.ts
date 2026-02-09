import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';

const mockStorage = {
  getUserByUsername: vi.fn(),
  updateUser: vi.fn(),
  getClubMemberByUserAndClub: vi.fn(),
};

vi.mock('./storage', () => ({
  storage: mockStorage,
}));

async function startTestServer(opts: { user?: any } = {}) {
  const { patchUserHandler } = await import('./handlers/patchUser');

  const app = express();
  app.use(express.json());

  // Inject an authenticated user (as if session/JWT middleware already ran).
  app.use((req, _res, next) => {
    (req as any).user =
      opts.user ??
      ({
        id: 123,
        username: 'old_name',
        email: 'old@example.com',
      } as any);
    next();
  });

  app.patch('/api/user', patchUserHandler);

  const server = await new Promise<import('http').Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected TCP server address');
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  return { server, baseUrl };
}

describe('PATCH /api/user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200, no password, Cache-Control: no-store, and token for Bearer auth username change', async () => {
    mockStorage.getUserByUsername.mockResolvedValue(undefined);
    mockStorage.updateUser.mockResolvedValue({
      id: 123,
      username: 'new_name',
      email: 'old@example.com',
      name: 'Test',
      password: 'hash',
    });

    const { server, baseUrl } = await startTestServer({
      user: { id: 123, username: 'old_name', email: 'old@example.com' },
    });

    try {
      const res = await fetch(`${baseUrl}/api/user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test',
        },
        body: JSON.stringify({ username: ' new_name ' }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toMatch(/no-store/i);

      const json = await res.json();
      expect(json.password).toBeUndefined();
      expect(typeof json.token).toBe('string');
      expect(json.username).toBe('new_name');
    } finally {
      server.close();
    }
  });

  it('returns 400 for invalid username format', async () => {
    const { server, baseUrl } = await startTestServer();

    try {
      const res = await fetch(`${baseUrl}/api/user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test',
        },
        body: JSON.stringify({ username: 'no spaces allowed' }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(String(json.error || '')).toMatch(/username/i);
    } finally {
      server.close();
    }
  });

  it('returns 409 when username is already taken by another user', async () => {
    mockStorage.getUserByUsername.mockResolvedValue({ id: 999, username: 'taken' });

    const { server, baseUrl } = await startTestServer({
      user: { id: 123, username: 'old_name', email: 'old@example.com' },
    });

    try {
      const res = await fetch(`${baseUrl}/api/user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test',
        },
        body: JSON.stringify({ username: 'taken' }),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(String(json.error || '')).toMatch(/taken/i);
    } finally {
      server.close();
    }
  });
});
