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
  
  // Redirect to auth if not authenticated
  useEffect(() => {
    // Only redirect if we're not loading and there's no user
    if (!isLoading && !user) {
      console.log(`ProtectedRoute ${path}: No user detected, redirecting to /auth (current location: ${location})`);
      setLocation('/auth');
    }
  }, [isLoading, user, path, setLocation, location]);  if (!isLoading && !user) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
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