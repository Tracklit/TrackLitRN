const DEFAULT_DEV_API_BASE_URL =
  "https://app-tracklit-prod-tnrusd.azurewebsites.net";

// In some production Hermes builds `process` may be undefined. Guard access so
// env resolution never crashes during module initialization.
const processEnv: Record<string, string | undefined> =
  ((globalThis as any)?.process?.env as Record<string, string | undefined>) ??
  {};

const API_BASE_URL =
  processEnv.EXPO_PUBLIC_API_BASE_URL ||
  processEnv.API_BASE_URL ||
  DEFAULT_DEV_API_BASE_URL;

export const env = {
  API_BASE_URL: API_BASE_URL.replace(/\/$/, ""),
};

