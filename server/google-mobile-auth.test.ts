import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";

const mockVerifyIdToken = vi.fn();

vi.mock("google-auth-library", () => ({
  OAuth2Client: class OAuth2Client {
    verifyIdToken = mockVerifyIdToken;
  },
}));

const mockStorage = {
  sessionStore: undefined,
  getUser: vi.fn(),
  getUserByUsername: vi.fn(),
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
};

vi.mock("./storage", () => ({
  storage: mockStorage,
}));

async function startTestServer() {
  const { setupAuth } = await import("./auth");

  const app = express();
  app.use(express.json());
  setupAuth(app);

  const server = await new Promise<import("http").Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP server address");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  return { server, baseUrl };
}

describe("POST /api/auth/google/mobile", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.GOOGLE_CLIENT_ID = "web-client-id.apps.googleusercontent.com";
    process.env.GOOGLE_IOS_CLIENT_ID = "ios-client-id.apps.googleusercontent.com";
    process.env.GOOGLE_ANDROID_CLIENT_ID = "android-client-id.apps.googleusercontent.com";
    process.env.SESSION_SECRET = "test-session-secret";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 200 and token for a valid Google idToken", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: "test@example.com",
        name: "Test User",
        email_verified: true,
      }),
    });

    mockStorage.getUserByEmail.mockResolvedValue(null);
    mockStorage.getUserByUsername.mockResolvedValue(null);
    mockStorage.createUser.mockResolvedValue({
      id: 123,
      username: "test",
      email: "test@example.com",
      name: "Test User",
      password: "hash",
    });

    const { server, baseUrl } = await startTestServer();
    try {
      const res = await fetch(`${baseUrl}/api/auth/google/mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: "valid-id-token" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(typeof json.token).toBe("string");
      expect(json.user?.email).toBe("test@example.com");
      expect(json.user?.password).toBeUndefined();
    } finally {
      server.close();
    }
  });

  it("returns 401 when token verification fails", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("bad token"));

    const { server, baseUrl } = await startTestServer();
    try {
      const res = await fetch(`${baseUrl}/api/auth/google/mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: "invalid" }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/invalid/i);
    } finally {
      server.close();
    }
  });

  it("returns 400 when Google payload is missing email", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        name: "No Email",
        email_verified: true,
      }),
    });

    const { server, baseUrl } = await startTestServer();
    try {
      const res = await fetch(`${baseUrl}/api/auth/google/mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: "token" }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/email/i);
    } finally {
      server.close();
    }
  });
});
