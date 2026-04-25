import { validateEnv, silenceConsoleInProduction } from "./lib/validateEnv";

// Handle Vite dynamic import errors (when new version is deployed)
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

window.addEventListener('error', (e) => {
  if (
    e.message?.includes('Failed to fetch dynamically imported module') || 
    e.message?.includes('Importing a module script failed') ||
    e.message?.includes('Expected a JavaScript module script but the server responded with a MIME type of "text/html"')
  ) {
    window.location.reload();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (
    e.reason?.message?.includes('Failed to fetch dynamically imported module') || 
    e.reason?.message?.includes('Importing a module script failed')
  ) {
    window.location.reload();
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
