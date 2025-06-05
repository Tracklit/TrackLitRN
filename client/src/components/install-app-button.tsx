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
  const [showModal, setShowModal] = useState(false);
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
      // Show detailed installation instructions
      setShowModal(true);
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
        // User dismissed the prompt - show manual instructions
        setShowModal(true);
      }
    } catch (error) {
      console.error('Install prompt failed', error);
      setShowModal(true);
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
            <Button variant="ghost" size="sm" className="gap-2 text-green-500 px-3 min-w-[100px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
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
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-primary text-primary hover:bg-primary/10 px-3 min-w-[100px]"
              onClick={handleInstallClick}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="text-xs">Installing...</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <Download className="h-4 w-4" />
                  <span className="text-xs">Install App</span>
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

      {/* Installation Instructions Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Install TrackLit App
            </DialogTitle>
            <DialogDescription>
              Follow the instructions below to install TrackLit on your device for the best experience.
              <div className="flex items-center gap-1 mt-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">Earn 15 Spikes when you install!</span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="ios" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ios" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                iPhone/iPad
              </TabsTrigger>
              <TabsTrigger value="android" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Android
              </TabsTrigger>
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Desktop
              </TabsTrigger>
            </TabsList>

            {/* iOS Instructions */}
            <TabsContent value="ios" className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="secondary">iOS</Badge>
                  Safari Installation
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Open <strong>Safari</strong> browser on your iPhone or iPad</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Navigate to TrackLit in Safari (you're already here!)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <span>Tap the <strong>Share</strong> button </span>
                      <Share className="inline h-4 w-4 mx-1" />
                      <span> at the bottom of your screen</span>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <span>Scroll down and tap <strong>"Add to Home Screen"</strong> </span>
                      <Plus className="inline h-4 w-4 mx-1" />
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">5</span>
                    <span>Tap <strong>"Add"</strong> in the top-right corner</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    <span>TrackLit will now appear on your home screen like a native app!</span>
                  </li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> This only works in Safari browser. Other browsers like Chrome won't show the "Add to Home Screen" option.
                </p>
              </div>
            </TabsContent>

            {/* Android Instructions */}
            <TabsContent value="android" className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Android</Badge>
                  Chrome Installation
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Open <strong>Chrome</strong> browser on your Android device</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Navigate to TrackLit in Chrome (you're already here!)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <span>Tap the <strong>Menu</strong> button </span>
                      <MoreVertical className="inline h-4 w-4 mx-1" />
                      <span> (three dots) in the top-right corner</span>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <span>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></span>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">5</span>
                    <span>Confirm by tapping <strong>"Add"</strong> or <strong>"Install"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    <span>TrackLit will be installed and appear in your app drawer!</span>
                  </li>
                </ol>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">Samsung Internet</Badge>
                  Alternative Method
                </h3>
                <p className="text-sm mb-2">If using Samsung Internet browser:</p>
                <ol className="space-y-2 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xs">1</span>
                    <span>Tap the menu button and look for <strong>"Add page to"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xs">2</span>
                    <span>Select <strong>"Home screen"</strong></span>
                  </li>
                </ol>
              </div>
            </TabsContent>

            {/* Desktop Instructions */}
            <TabsContent value="desktop" className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Desktop</Badge>
                  Chrome Installation
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Open <strong>Chrome</strong> browser on your computer</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Look for the <strong>install icon</strong> in the address bar (or try the button above)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Click <strong>"Install"</strong> when prompted</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    <span>TrackLit will open in its own window and be added to your applications!</span>
                  </li>
                </ol>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">Alternative</Badge>
                  Manual Installation
                </h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xs">1</span>
                    <span>Click the three-dot menu in Chrome</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xs">2</span>
                    <span>Go to <strong>"More tools"</strong> → <strong>"Create shortcut"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xs">3</span>
                    <span>Check <strong>"Open as window"</strong> and click <strong>"Create"</strong></span>
                  </li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>

          <div className="bg-primary/10 p-4 rounded-lg mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">Benefits of Installing</span>
            </div>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Faster loading and offline capabilities</li>
              <li>• Native app experience with push notifications</li>
              <li>• Easy access from your home screen</li>
              <li>• Automatic updates in the background</li>
              <li>• Earn 15 Spikes reward when you install</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}