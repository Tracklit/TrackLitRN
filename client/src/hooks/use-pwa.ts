import { useState, useEffect } from 'react';

// Extend Navigator interface for PWA support
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

interface PWAInfo {
  isPWA: boolean;
  isIOS: boolean;
  canInstall: boolean;
  installPrompt: () => void;
}

export function usePWA(): PWAInfo {
  const [isPWA, setIsPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detect if running as PWA
    const detectPWA = () => {
      // iOS Safari standalone mode
      if (window.navigator.standalone) return true;
      
      // Android Chrome standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
      
      // Check URL parameter for PWA mode
      if (new URLSearchParams(window.location.search).has('pwa')) return true;
      
      return false;
    };

    // Detect iOS device
    const detectIOS = () => {
      return /iphone|ipad|ipod/i.test(navigator.userAgent);
    };

    setIsPWA(detectPWA());
    setIsIOS(detectIOS());

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPrompt = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
      }
    }
  };

  return {
    isPWA,
    isIOS,
    canInstall,
    installPrompt,
  };
}