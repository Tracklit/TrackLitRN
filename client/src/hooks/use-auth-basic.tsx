import { createContext, useContext, ReactNode } from "react";

const AuthContext = createContext({
  user: {
    id: 1,
    username: "testuser",
    name: "Test User",
    subscriptionTier: "free",
    role: "athlete",
    isPremium: false
  },
  isLoading: false
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = {
    user: {
      id: 1,
      username: "testuser",
      name: "Test User",
      subscriptionTier: "free",
      role: "athlete",
      isPremium: false
    },
    isLoading: false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}