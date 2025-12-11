const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "https://app-tracklit-dev-kvnx2h.azurewebsites.net";

export const env = {
  API_BASE_URL: API_BASE_URL.replace(/\/$/, ""),
};

