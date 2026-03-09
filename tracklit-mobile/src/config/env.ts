import { getUrlHostname, getUrlOrigin } from '@/utils/url';

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

  const hostname = getUrlHostname(candidate);
  const origin = getUrlOrigin(candidate);

  if (!hostname || !origin) {
    return PRODUCTION_API_BASE_URL;
  }

  if (!isAllowedHost(hostname)) {
    return PRODUCTION_API_BASE_URL;
  }

  return origin;
};

const API_BASE_URL = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL,
);

export const env = {
  API_BASE_URL: API_BASE_URL.replace(/\/$/, ""),
};
