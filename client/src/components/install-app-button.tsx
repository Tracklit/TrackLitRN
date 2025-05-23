import { useState, useEffect } from "react";
import { Download, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
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
      
      // Here you would also call an API to award the user with spikes
      // Example: apiRequest("POST", "/api/user/spikes/add", { amount: 15, reason: "app_install" });
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      // If the install prompt is not available, provide manual instructions
      setIsInstalling(true);
      
      toast({
        title: "Install TrackLit",
        description: "Add to Home Screen in your browser's menu to install",
      });
      
      return;
    }

    // Show the install prompt
    setIsInstalling(true);
    
    try {
      await installPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        // User accepted the prompt, app is being installed
        // Reward is handled by the appinstalled event
      } else {
        // User dismissed the prompt
        toast({
          title: "Installation canceled",
          description: "You can install the app later from the top bar",
        });
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
            <Button variant="ghost" size="sm" className="gap-1 text-green-500">
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline-block">Installed</span>
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
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 border-primary text-primary hover:bg-primary/10"
            onClick={handleInstallClick}
            disabled={isInstalling}
          >
            {isInstalling ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="hidden sm:inline-block">Installing...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline-block">Install App</span>
              </>
            )}
          </Button>
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