import { createContext, ReactNode, useContext } from "react";
import { User as SelectUser } from "@shared/schema";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Mock user for testing - replace with real auth later
  const mockUser: SelectUser = {
    id: 1,
    username: "testuser",
    email: "test@example.com",
    name: "Test User",
    password: "",
    bio: null,
    isPremium: false,
    subscriptionTier: "free",
    isCoach: false,
    role: "athlete",
    spikes: 100,
    createdAt: new Date()
  };

  return (
    <AuthContext.Provider value={{ user: mockUser, isLoading: false }}>
      {children}
    </AuthContext.Provider>
  );
}