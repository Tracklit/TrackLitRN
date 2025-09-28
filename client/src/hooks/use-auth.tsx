import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  // Temporarily disable useQuery to isolate the React hooks issue
  const user = null;
  const error = null;
  const isLoading = false;
  
  // const {
  //   data: user,
  //   error,
  //   isLoading,
  // } = useQuery<SelectUser | null, Error>({
  //   queryKey: ["/api/user"],
  //   queryFn: getQueryFn({ on401: "returnNull" }),
  // });

  // Temporarily disable mutations to isolate React hooks issue
  const loginMutation = {
    mutate: () => console.log("Login disabled for debugging"),
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    isPending: false
  } as any;

  const registerMutation = {
    mutate: () => console.log("Register disabled for debugging"),
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    isPending: false
  } as any;

  const logoutMutation = {
    mutate: () => console.log("Logout disabled for debugging"),
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    isPending: false
  } as any;

  // const loginMutation = useMutation({
  //   mutationFn: async (credentials: LoginData) => {
  //     const res = await apiRequest("POST", "/api/login", credentials);
  //     if (!res.ok) {
  //       const errorText = await res.text();
  //       throw new Error(errorText || "Invalid username or password");
  //     }
  //     return await res.json();
  //   },
  //   onSuccess: (user: SelectUser) => {
  //     queryClient.setQueryData(["/api/user"], user);
  //   },
  //   onError: (error: Error) => {
  //     // Toast will be handled by the calling component
  //     console.error("Login failed:", error.message);
  //   },
  // });

  // const registerMutation = useMutation<SelectUser, Error, InsertUser>({
  //   mutationFn: async (credentials: InsertUser) => {
  //     const res = await apiRequest("POST", "/api/register", credentials);
  //     const data = await res.json();
  //     // Always return just the user for consistency with the mutation type
  //     return 'user' in data ? data.user : data;
  //   },
  //   onSuccess: (user: SelectUser) => {
  //     queryClient.setQueryData(["/api/user"], user);
  //     // Redirect to home after successful registration
  //     window.location.href = '/';
  //   },
  //   onError: (error: Error) => {
  //     // Toast will be handled by the calling component
  //     console.error("Registration failed:", error.message);
  //   },
  // });

  // const logoutMutation = useMutation({
  //   mutationFn: async () => {
  //     await apiRequest("POST", "/api/logout");
  //   },
  //   onSuccess: () => {
  //     queryClient.setQueryData(["/api/user"], null);
  //   },
  //   onError: (error: Error) => {
  //     // Toast will be handled by the calling component
  //     console.error("Logout failed:", error.message);
  //   },
  // });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}