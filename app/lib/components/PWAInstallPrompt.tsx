"use client";
import React, { useEffect, useState } from "react";

// Minimal type for the beforeinstallprompt event (not yet in lib.dom.d.ts in some setups)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = window.localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') return;

    function handleBeforeInstall(e: Event) {
      const ev = e as BeforeInstallPromptEvent;
      // Prevent the browser from showing the default prompt
      e.preventDefault();
      setDeferredPrompt(ev);
      setVisible(true);
    }

    function handleAppInstalled() {
      // App installed -> hide prompt and mark dismissed
      setVisible(false);
      setDeferredPrompt(null);
      window.localStorage.setItem('pwa-install-dismissed', 'true');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled as EventListener);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        // user accepted — hide prompt and remember
        setVisible(false);
        window.localStorage.setItem('pwa-install-dismissed', 'true');
        setDeferredPrompt(null);
      } else {
        // dismissed — hide for now but allow future attempts
        setVisible(false);
      }
    } catch (err) {
      // ignore errors and hide the prompt
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    window.localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-4 z-50 md:left-8">
      <div className="flex items-center gap-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-lg rounded-full px-4 py-2">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 2v6M12 22v-6M4.93 4.93l4.24 4.24M18.36 18.36l-4.24-4.24M2 12h6M22 12h-6" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">Install Missouri Crossroads</span>
          <span className="text-xs text-muted-foreground">Add this app to your device for quick access</span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleInstallClick}
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="text-sm text-muted-foreground hover:text-gray-500 px-2"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
