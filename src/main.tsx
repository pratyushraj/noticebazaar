import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import React from "react";
import { initWebVitals } from "./lib/utils/webVitals";

createRoot(document.getElementById("root")!).render(<App />);
initWebVitals();
