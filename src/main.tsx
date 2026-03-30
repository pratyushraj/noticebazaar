import { validateEnv } from "./lib/validateEnv";

// Fail fast before any rendering if env is misconfigured
validateEnv();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { initWebVitals } from "./lib/utils/webVitals";

createRoot(document.getElementById("root")!).render(<App />);
initWebVitals();
