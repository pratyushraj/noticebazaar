/**
 * PWA install prompt for Android Chrome.
 * Captures the beforeinstallprompt event and exposes a trigger function.
 */
import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Singleton state to share the prompt across all hook instances
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

// Initial global listener (setup once)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach(l => l(globalDeferredPrompt));
  });
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [canInstall, setCanInstall] = useState(!!globalDeferredPrompt);

  useEffect(() => {
    const handler = (p: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(p);
      setCanInstall(!!p);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const prompt = deferredPrompt || globalDeferredPrompt;
    if (!prompt) return false;
    
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    
    globalDeferredPrompt = null;
    setDeferredPrompt(null);
    setCanInstall(false);
    listeners.forEach(l => l(null));
    
    return outcome === 'accepted';
  }, [deferredPrompt]);

  return { canInstall, promptInstall, deferredPrompt: deferredPrompt || globalDeferredPrompt };
}
