import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { existsSync } from "fs";

// Dynamically resolve React paths to ensure single instance
function resolveReactPath() {
  const root = process.cwd();
  return {
    react: path.resolve(root, "node_modules/react"),
    reactDom: path.resolve(root, "node_modules/react-dom"),
    jsxRuntime: path.resolve(root, "node_modules/react/jsx-runtime"),
    jsxDevRuntime: path.resolve(root, "node_modules/react/jsx-dev-runtime"),
  };
}

const reactPaths = resolveReactPath();

// Plugin to fix use-sync-external-store/shim CommonJS export issue
const useSyncExternalStoreShimPlugin = (): any => {
  const virtualModuleId = '\0virtual:use-sync-external-store-shim';
  return {
    name: 'use-sync-external-store-shim-fix',
    enforce: 'pre' as const, // Run before other plugins
    resolveId(id: string) {
      // Intercept use-sync-external-store/shim imports (any form)
      if (id === 'use-sync-external-store/shim' ||
        id.endsWith('use-sync-external-store/shim') ||
        id.includes('use-sync-external-store/shim/index')) {
        return virtualModuleId;
      }
      // Also catch the actual file path from pnpm
      if (id.includes('use-sync-external-store') && id.includes('/shim')) {
        return virtualModuleId;
      }
      return null;
    },
    load(id: string) {
      // Handle our virtual module
      if (id === virtualModuleId) {
        // Return ESM that exports React's built-in useSyncExternalStore
        return `
          import { useSyncExternalStore } from 'react';
          export { useSyncExternalStore };
          export default useSyncExternalStore;
        `;
      }
      return null;
    },
  };
};

// Plugin to force React into a single pre-bundled chunk
const forceSingleReactChunkPlugin = (): any => {
  return {
    name: 'force-single-react-chunk',
    enforce: 'pre' as const,
    resolveId(id: string) {
      // Force all React imports to resolve to the same location
      if (id === 'react') return reactPaths.react;
      if (id === 'react-dom') return reactPaths.reactDom;
      if (id === 'react/jsx-runtime') return reactPaths.jsxRuntime;
      if (id === 'react/jsx-dev-runtime') return reactPaths.jsxDevRuntime;
      return null;
    },
    configResolved() {
      // Ensure React dependencies are bundled together
    },
  };
};

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      host: "localhost",
      port: 8080,
      clientPort: 8080,
      protocol: "ws",
    },
  },
  build: {
    sourcemap: false, 
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  plugins: [
    react(),
    dyadComponentTagger(),
    useSyncExternalStoreShimPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "use-sync-external-store/shim": path.resolve(__dirname, "./src/lib/use-sync-external-store-shim.ts"),
    },
    dedupe: ["react", "react-dom", "framer-motion", "lucide-react", "react-router-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "framer-motion",
      "lucide-react",
      "@supabase/supabase-js",
      "@tanstack/react-query",
      "react-router-dom"
    ],
    exclude: [
      "use-sync-external-store",
      "use-sync-external-store/shim",
    ],
    holdUntilCrawlEnd: true,
  },
}));
