import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const PWAUpdatePrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Handle PWA installation prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallPrompt(true);
    };

    // Handle PWA update detection
    const handleSWUpdate = () => {
      setUpdateAvailable(true);
      setShowUpdatePrompt(true);
      toast.info('App update available! Refresh to get the latest version.');
    };

    // Check if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isPWA) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    // Service Worker update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleSWUpdate);
      
      // Check for updates on app focus
      window.addEventListener('focus', async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            registration.update();
          }
        } catch (error) {
          console.error('Error checking for SW updates:', error);
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleSWUpdate);
      }
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        toast.success('LAB404 app installed successfully!');
      }
      
      setInstallPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast.error('Failed to install app. Please try again.');
    }
  };

  const handleUpdateApp = () => {
    if ('serviceWorker' in navigator) {
      // Clear all caches and reload
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
      window.location.reload();
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setInstallPrompt(null);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  const dismissUpdatePrompt = () => {
    setShowUpdatePrompt(false);
    setUpdateAvailable(false);
  };

  // Don't show install prompt if dismissed in this session
  if (showInstallPrompt && sessionStorage.getItem('pwa-install-dismissed')) {
    setShowInstallPrompt(false);
  }

  return (
    <>
      {/* Install App Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
          <Card className="border-2 border-primary/20 shadow-lg bg-background/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Install LAB404 App
                  </CardTitle>
                  <CardDescription>
                    Install our app for a better shopping experience with offline access
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={dismissInstallPrompt}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button onClick={handleInstallApp} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </Button>
                <Button variant="outline" onClick={dismissInstallPrompt}>
                  Not Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Available Prompt */}
      {showUpdatePrompt && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
          <Card className="border-2 border-green-500/20 shadow-lg bg-background/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-green-600" />
                    Update Available
                  </CardTitle>
                  <CardDescription>
                    A new version of LAB404 is available with bug fixes and improvements
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={dismissUpdatePrompt}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button onClick={handleUpdateApp} className="flex-1 bg-green-600 hover:bg-green-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Now
                </Button>
                <Button variant="outline" onClick={dismissUpdatePrompt}>
                  Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default PWAUpdatePrompt;