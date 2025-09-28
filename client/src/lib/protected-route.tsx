import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  console.log(`ProtectedRoute ${path}: user=${!!user}, isLoading=${isLoading}, location=${location}`);

  // Immediate redirect if not authenticated and not loading
  if (!isLoading && !user) {
    console.log(`ProtectedRoute: Redirecting unauthenticated user from ${path} to /auth`);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Authenticated - render component
  return <Route path={path} component={Component} />;
}
