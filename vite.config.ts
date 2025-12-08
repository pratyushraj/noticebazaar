import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Plugin to fix use-sync-external-store/shim CommonJS export issue
const useSyncExternalStoreShimPlugin = () => {
  const virtualModuleId = '\0virtual:use-sync-external-store-shim';
  return {
    name: 'use-sync-external-store-shim-fix',
    enforce: 'pre', // Run before other plugins
    resolveId(id, importer) {
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
    load(id) {
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

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    sourcemap: false, // Disable source maps in production to avoid 404 errors
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000 kB
    rollupOptions: {
      output: {
        // Optimized manual chunks to reduce bundle size
        manualChunks: (id) => {
          // CRITICAL: Never chunk React - keep it in main bundle to prevent multiple instances
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react/jsx-runtime') ||
              id.includes('node_modules/react/jsx-dev-runtime')) {
            return undefined; // Keep React in main bundle
          }
          // React Router
          if (id.includes('node_modules/react-router-dom/')) {
            return 'router';
          }
          // Supabase libraries
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }
          // Radix UI - keep in main to share React instance
          if (id.includes('node_modules/@radix-ui/')) {
            return undefined;
          }
          // React Query
          if (id.includes('node_modules/@tanstack/react-query/')) {
            return 'react-query';
          }
          // Framer Motion - keep in main to share React instance
          if (id.includes('node_modules/framer-motion/')) {
            return undefined;
          }
          // Lucide React icons
          if (id.includes('node_modules/lucide-react/')) {
            return 'icons';
          }
          // CometChat
          if (id.includes('node_modules/@cometchat')) {
            return 'cometchat';
          }
          // Other large dependencies
          if (id.includes('node_modules/html2canvas/') || id.includes('node_modules/jspdf/')) {
            return 'pdf-tools';
          }
        },
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
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
      // Force single React instance to prevent "Invalid hook call" errors
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      // Force use-sync-external-store/shim to use our ESM shim
      "use-sync-external-store/shim": path.resolve(__dirname, "./src/lib/use-sync-external-store-shim.ts"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "use-sync-external-store"],
    conditions: ["import", "module", "browser", "default"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      // Include framer-motion to ensure it uses the same React instance
      "framer-motion",
    ],
    exclude: [
      // Exclude use-sync-external-store from pre-bundling to prevent separate React instance
      "use-sync-external-store",
      "use-sync-external-store/shim",
    ],
    force: true, // Force re-optimization
    esbuildOptions: {
      // Ensure React is treated as external and deduped
      plugins: [],
    },
  },
  ssr: {
    noExternal: ["react", "react-dom"],
  },
}));
