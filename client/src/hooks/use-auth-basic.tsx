import { ReactNode } from "react";

export function useAuth() {
  return {
    user: {
      id: 1,
      username: "testuser",
      name: "Test User",
      subscriptionTier: "free"
    },
    isLoading: false
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}