import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface BackNavigationProps {
  href?: string;
  className?: string;
  text?: string;
}

// Define hierarchy-based back navigation with labels
const BACK_NAVIGATION: Record<string, { href: string; label: string }> = {
  // Tools hierarchy
  "/tools/stopwatch": { href: "/training-tools", label: "Back to Tools" },
  "/tools/start-gun": { href: "/training-tools", label: "Back to Tools" },
  "/tools/journal": { href: "/training-tools", label: "Back to Tools" },
  "/tools/pace-calculator": { href: "/training-tools", label: "Back to Tools" },
  "/tools/photo-finish": { href: "/training-tools", label: "Back to Tools" },
  "/tools/exercise-library": { href: "/training-tools", label: "Back to Tools" },
  "/tools/exercise-library/add": { href: "/tools/exercise-library", label: "Back to Library" },
  "/tools/rehabilitation": { href: "/training-tools", label: "Back to Tools" },
  "/tools/video-analysis": { href: "/training-tools", label: "Back to Tools" },
  "/tools/video-analysis/upload": { href: "/training-tools", label: "Back to Tools" },
  "/tools/video-analysis/analysis": { href: "/training-tools", label: "Back to Tools" },
  "/tools/video-analysis/results": { href: "/training-tools", label: "Back to Tools" },
  
  // Programs hierarchy
  "/programs": { href: "/", label: "Back to Dashboard" },
  "/programs/create": { href: "/programs", label: "Back to Programs" },
  "/programs/editor": { href: "/programs", label: "Back to Programs" },
  
  // Main sections back to dashboard
  "/training-tools": { href: "/", label: "Back to Dashboard" },
  "/meets": { href: "/", label: "Back to Dashboard" },
  "/results": { href: "/", label: "Back to Dashboard" },
  "/clubs": { href: "/", label: "Back to Dashboard" },
  "/conversations": { href: "/", label: "Back to Dashboard" },
  "/messages/": { href: "/conversations", label: "Back to Messages" },
  "/friends": { href: "/", label: "Back to Dashboard" },
  "/athletes": { href: "/", label: "Back to Dashboard" },
  "/coaches": { href: "/", label: "Back to Dashboard" },
  "/practice": { href: "/", label: "Back to Dashboard" },
  "/profile": { href: "/", label: "Back to Dashboard" },
  "/spikes": { href: "/", label: "Back to Dashboard" },
  "/subscription": { href: "/", label: "Back to Dashboard" },
  "/sprinthia": { href: "/", label: "Back to Dashboard" },
  
  // Sub-pages
  "/clubs/management": { href: "/clubs", label: "Back to Clubs" },
  "/checkout": { href: "/programs", label: "Back to Programs" },
};

function getBackNavigation(currentPath: string): { href: string; label: string } {
  // Check exact match first
  if (BACK_NAVIGATION[currentPath]) {
    return BACK_NAVIGATION[currentPath];
  }
  
  // Handle dynamic routes like /programs/123
  for (const [pattern, backNav] of Object.entries(BACK_NAVIGATION)) {
    if (pattern.endsWith("/") && currentPath.startsWith(pattern)) {
      return backNav;
    }
  }
  
  // Default fallback to dashboard
  return { href: "/", label: "Back to Dashboard" };
}

export function BackNavigation({ href, className = "", text }: BackNavigationProps) {
  const [location] = useLocation();
  const backNavigation = getBackNavigation(location);
  const backPath = href || backNavigation.href;
  const backText = text || backNavigation.label;

  return (
    <Button
      variant="ghost" 
      className={`mb-4 text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 h-auto min-w-fit ${className}`}
      onClick={() => window.history.back()}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="whitespace-nowrap">{backText}</span>
    </Button>
  );
}