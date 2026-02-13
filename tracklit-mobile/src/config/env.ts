const PRODUCTION_API_BASE_URL =
  "https://app-tracklit-prod-tnrusd.azurewebsites.net";

const ALLOWED_API_HOSTS = new Set([
  "app-tracklit-prod-tnrusd.azurewebsites.net",
  "workspace-lionmartinez.replit.app",
]);

const isAllowedHost = (hostname: string) => {
  if (ALLOWED_API_HOSTS.has(hostname)) return true;
  if (hostname.endsWith(".replit.dev") || hostname.endsWith(".replit.app")) return true;
  return false;
};

const resolveApiBaseUrl = (candidate?: string) => {
  if (!candidate) return PRODUCTION_API_BASE_URL;

  try {
    const url = new URL(candidate);
    if (!isAllowedHost(url.hostname)) {
      return PRODUCTION_API_BASE_URL;
    }
    return url.origin;
  } catch {
    return PRODUCTION_API_BASE_URL;
  }
};

const API_BASE_URL = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL,
);

export const env = {
  API_BASE_URL: API_BASE_URL.replace(/\/$/, ""),
};
