import { validateEnv, silenceConsoleInProduction } from "./lib/validateEnv";

// Handle Vite dynamic import errors (when new version is deployed)
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

window.addEventListener('error', (e) => {
  // Ignore Vercel/Analytics internal IndexedDB race conditions (common during page teardown)
  if (e.message?.includes('IDBDatabase') && e.message?.includes('closing')) {
    e.stopImmediatePropagation();
    return;
  }

  if (
    e.message?.includes('Failed to fetch dynamically imported module') || 
    e.message?.includes('Importing a module script failed') ||
    e.message?.includes('module script but the server responded with a MIME type of "text/html"')
  ) {
    // Avoid infinite reloads if the server is actually returning HTML for assets
    const lastReload = Number(sessionStorage.getItem('ca-last-reload') || 0);
    const now = Date.now();
    if (now - lastReload > 5000) {
      sessionStorage.setItem('ca-last-reload', String(now));
      window.location.reload();
    }
  }
});

window.addEventListener('unhandledrejection', (e) => {
  // Ignore Vercel/Analytics internal IndexedDB race conditions (common during page teardown)
  if (e.reason?.message?.includes('IDBDatabase') && e.reason?.message?.includes('closing')) {
    e.preventDefault();
    return;
  }

  if (
    e.reason?.message?.includes('Failed to fetch dynamically imported module') || 
    e.reason?.message?.includes('Importing a module script failed')
  ) {
    const lastReload = Number(sessionStorage.getItem('ca-last-reload') || 0);
    const now = Date.now();
    if (now - lastReload > 5000) {
      sessionStorage.setItem('ca-last-reload', String(now));
      window.location.reload();
    }
  }
});

// Fail fast before any rendering if env is misconfigured
validateEnv();
silenceConsoleInProduction();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { initWebVitals } from "./lib/utils/webVitals";

createRoot(document.getElementById("root")!).render(<App />);
initWebVitals();
