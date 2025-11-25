const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "https://alpha.tracklitapp.com";

export const env = {
  API_BASE_URL: API_BASE_URL.replace(/\/$/, ""),
};

