import { useState, useEffect } from "react";
import { Download, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
}

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { toast } = useToast();

  // Check if the app is already installed
  useEffect(() => {
    // If in standalone mode (PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    // For iOS devices, but needs to be checked safely
    const nav = window.navigator as any;
    if (nav && 'standalone' in nav && nav.standalone === true) {
      setIsInstalled(true);
    }
  }, []);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Listen for the appinstalled event
  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      
      // Show success toast when app is installed
      toast({
        title: "App installed successfully!",
        description: "You've earned 15 Spikes for installing the app!",
        action: (
          <div className="flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>+15</span>
          </div>
        ),
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }

    setIsInstalling(true);
    
    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('Install prompt failed', error);
    } finally {
      setIsInstalling(false);
      setInstallPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="flex items-center gap-2 text-green-600"
            >
              <Check className="h-4 w-4" />
              <span className="text-xs">Installed</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>TrackLit is installed on your device</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {installPrompt ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground relative"
            >
              {isInstalling ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="text-xs">Installing...</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <Download className="h-4 w-4" />
                  <span className="text-xs">Install App</span>
                </>
              )}
            </Button>
          ) : (
            <Link href="/install-app">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground relative"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <Download className="h-4 w-4" />
                <span className="text-xs">Install App</span>
              </Button>
            </Link>
          )}
        </TooltipTrigger>
        <TooltipContent className="flex flex-col gap-2">
          <p>Install TrackLit on your device</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Earn 15 Spikes when you install</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}