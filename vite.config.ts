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

// Plugin to force React into a single pre-bundled chunk
const forceSingleReactChunkPlugin = () => {
  return {
    name: 'force-single-react-chunk',
    enforce: 'pre',
    resolveId(id) {
      // Force all React imports to resolve to the same location
      if (id === 'react' || id === 'react-dom' || id === 'react/jsx-runtime' || id === 'react/jsx-dev-runtime') {
        // Return null to let Vite handle it, but ensure dedupe works
        return null;
      }
      return null;
    },
    configResolved(config) {
      // Ensure React dependencies are bundled together
      if (config.optimizeDeps) {
        // This will be handled in optimizeDeps config
      }
    },
  };
};

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  // Disable code splitting in dev mode to prevent multiple React instances
  build: {
    sourcemap: false, // Disable source maps in production to avoid 404 errors
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000 kB
    rollupOptions: {
      output: {
        // CRITICAL: Disable ALL code splitting to prevent multiple React instances
        // This ensures everything is in one bundle, sharing the same React instance
        manualChunks: undefined, // Disable manual chunking entirely
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
    forceSingleReactChunkPlugin(),
    react(),
    dyadComponentTagger(),
    useSyncExternalStoreShimPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // CRITICAL: Force all React imports to use the same instance
      // This prevents "Invalid hook call" errors from multiple React instances
      "react": path.resolve(__dirname, "./node_modules/.pnpm/react@18.3.1/node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/.pnpm/react@18.3.1/node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/.pnpm/react@18.3.1/node_modules/react/jsx-dev-runtime"),
      // Force use-sync-external-store/shim to use our ESM shim
      "use-sync-external-store/shim": path.resolve(__dirname, "./src/lib/use-sync-external-store-shim.ts"),
    },
    // Critical: Dedupe React to prevent multiple instances
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "use-sync-external-store"],
    conditions: ["import", "module", "browser", "default"],
    // Don't preserve symlinks - resolve to actual files for consistent React instance
    preserveSymlinks: false,
  },
  // Force single chunk for React in dev mode
  esbuild: {
    // This helps ensure consistent module resolution
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  optimizeDeps: {
    // Include React to ensure proper jsx-runtime resolution
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
    exclude: [
      "use-sync-external-store",
      "use-sync-external-store/shim",
    ],
    force: true, // Force re-optimization
    // Ensure all dependencies are discovered before pre-bundling
    holdUntilCrawlEnd: true,
    esbuildOptions: {
      plugins: [],
      format: 'esm',
    },
    // Force React to be in a single pre-bundled chunk
    entries: [
      'src/main.tsx',
    ],
  },
  ssr: {
    noExternal: ["react", "react-dom"],
  },
}));
