import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";



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


export default defineConfig(() => ({
  server: {
    // Use the host from the current URL for HMR (mobile + LAN testing).
    // Avoid hardcoding `hmr.host = "localhost"` which breaks WebSocket on phones.
    host: true,
    port: 8080,
    strictPort: true,
  },
  build: {
    sourcemap: false, 
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split heavy vendor libraries into separate chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('vaul') || id.includes('embla-carousel')) {
              return 'vendor-ui';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Framer motion (heavy animation lib)
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Data/state
            if (id.includes('@tanstack')) {
              return 'vendor-query';
            }
            // Charts
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
          }
        },
      },
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
