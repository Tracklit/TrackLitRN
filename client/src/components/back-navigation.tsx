import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

interface BackNavigationProps {
  href?: string;
  className?: string;
}

// Define hierarchy-based back navigation
const BACK_NAVIGATION: Record<string, string> = {
  // Tools hierarchy
  "/tools/stopwatch": "/training-tools",
  "/tools/start-gun": "/training-tools",
  "/tools/journal": "/training-tools",
  "/tools/pace-calculator": "/training-tools",
  "/tools/photo-finish": "/training-tools",
  "/tools/exercise-library": "/training-tools",
  "/tools/exercise-library/add": "/tools/exercise-library",
  "/tools/rehabilitation": "/training-tools",
  
  // Programs hierarchy
  "/programs": "/",
  "/programs/create": "/programs",
  "/programs/editor": "/programs",
  
  // Main sections back to dashboard
  "/training-tools": "/",
  "/meets": "/",
  "/results": "/",
  "/clubs": "/",
  "/conversations": "/",
  "/messages/": "/conversations",
  "/friends": "/",
  "/athletes": "/",
  "/coaches": "/",
  "/practice": "/",
  "/profile": "/",
  "/spikes": "/",
  "/subscription": "/",
  "/sprinthia": "/",
  
  // Sub-pages
  "/clubs/management": "/clubs",
  "/checkout": "/programs",
};

function getBackPath(currentPath: string): string {
  // Check exact match first
  if (BACK_NAVIGATION[currentPath]) {
    return BACK_NAVIGATION[currentPath];
  }
  
  // Handle dynamic routes like /programs/123
  for (const [pattern, backPath] of Object.entries(BACK_NAVIGATION)) {
    if (pattern.endsWith("/") && currentPath.startsWith(pattern)) {
      return backPath;
    }
  }
  
  // Default fallback to dashboard
  return "/";
}

export function BackNavigation({ href, className = "" }: BackNavigationProps) {
  const [location] = useLocation();
  const backPath = href || getBackPath(location);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`mb-4 p-2 h-10 w-10 ${className}`}
      onClick={() => window.history.back()}
    >
      <ChevronLeft className="h-6 w-6" />
    </Button>
  );
}