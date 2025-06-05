import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { BackNavigation } from "@/components/back-navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Share, 
  Home, 
  Sparkles, 
  Check,
  Chrome,
  Globe,
  Plus,
  MoreHorizontal
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
}

function InstallAppPage() {
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
      e.preventDefault();
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

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-16 md:pt-18 md:pl-72 pb-20 h-screen overflow-y-auto">
      <BackNavigation />
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Download className="h-6 w-6" />
            Install TrackLit App
          </h1>
          <p className="text-muted-foreground">
            Install TrackLit on your device for the best experience and offline access.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Earn 15 Spikes when you install!
            </Badge>
          </div>
        </div>

        {isInstalled ? (
          <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">App Installed Successfully!</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    TrackLit is now installed on your device and ready to use.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : installPrompt ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-3">Ready to Install</h3>
                <p className="text-muted-foreground mb-4">
                  Your browser supports automatic installation. Click the button below to install TrackLit.
                </p>
                <Button 
                  size="lg" 
                  onClick={handleInstallClick} 
                  disabled={isInstalling}
                  className="gap-2"
                >
                  {isInstalling ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Install Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Tabs defaultValue="ios" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
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

          <TabsContent value="ios">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  iOS Installation (Safari)
                </CardTitle>
                <CardDescription>
                  Follow these steps to add TrackLit to your iPhone or iPad home screen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <p className="font-medium">Open in Safari</p>
                      <p className="text-sm text-muted-foreground">Make sure you're viewing this page in Safari browser</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <p className="font-medium">Tap the Share button</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Look for the <Share className="h-3 w-3" /> icon at the bottom of the screen
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <p className="font-medium">Select "Add to Home Screen"</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Scroll down and tap <Home className="h-3 w-3" /> "Add to Home Screen"
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <p className="font-medium">Confirm installation</p>
                      <p className="text-sm text-muted-foreground">Tap "Add" to install TrackLit on your home screen</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="android">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chrome className="h-5 w-5" />
                  Android Installation (Chrome)
                </CardTitle>
                <CardDescription>
                  Follow these steps to install TrackLit on your Android device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <p className="font-medium">Open Chrome menu</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Tap the <MoreHorizontal className="h-3 w-3" /> menu button in the top right
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <p className="font-medium">Select "Add to Home screen"</p>
                      <p className="text-sm text-muted-foreground">Look for this option in the dropdown menu</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <p className="font-medium">Customize app name</p>
                      <p className="text-sm text-muted-foreground">You can change the app name if desired, then tap "Add"</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <p className="font-medium">Install to home screen</p>
                      <p className="text-sm text-muted-foreground">Tap "Install" to add TrackLit to your home screen</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="desktop">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Desktop Installation
                </CardTitle>
                <CardDescription>
                  Install TrackLit as a desktop app for quick access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <p className="font-medium">Look for the install icon</p>
                      <p className="text-sm text-muted-foreground">
                        Chrome/Edge: Look for a small install icon in the address bar
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <p className="font-medium">Click install</p>
                      <p className="text-sm text-muted-foreground">Click the install button when prompted</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <p className="font-medium">Alternative method</p>
                      <p className="text-sm text-muted-foreground">
                        Use browser menu → "Install TrackLit..." or "Create shortcut..."
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Benefits Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Benefits of Installing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Faster loading and offline capabilities</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Native app experience with push notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Easy access from your home screen or desktop</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Automatic updates in the background</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Earn 15 Spikes reward when you install</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function Component() {
  return (
    <ProtectedRoute path="/install-app" component={InstallAppPage} />
  );
}

export default InstallAppPage;