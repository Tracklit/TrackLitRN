const DEFAULT_DEV_API_BASE_URL =
  "https://app-tracklit-prod-tnrusd.azurewebsites.net";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  DEFAULT_DEV_API_BASE_URL;

export const env = {
  API_BASE_URL: API_BASE_URL.replace(/\/$/, ""),
};

