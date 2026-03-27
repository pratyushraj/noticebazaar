import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import React from "react";

console.log("[main.tsx] Initializing app...");

createRoot(document.getElementById("root")!).render(<App />);
