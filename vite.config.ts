import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      jsx: 'react-jsx',
      // Explicitly include .tsx files for JSX transformation
      include: "**/*.tsx",
      // Exclude node_modules to prevent processing external libraries
      exclude: "node_modules/**",
    }),
    dyadComponentTagger()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));