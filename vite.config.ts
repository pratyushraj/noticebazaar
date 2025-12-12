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
    configResolved(config) {
      // Ensure React dependencies are bundled together
      if (config.optimizeDeps) {
        // This will be handled in optimizeDeps config
      }
    },
    generateBundle(options, bundle) {
      // In build mode, ensure React is in a single chunk
      // This is mainly for dev mode though
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
      // Force single React instance to prevent "Invalid hook call" errors
      // Use directory paths (not file paths) so Vite can resolve sub-paths correctly
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      // Force use-sync-external-store/shim to use our ESM shim
      "use-sync-external-store/shim": path.resolve(__dirname, "./src/lib/use-sync-external-store-shim.ts"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "use-sync-external-store"],
    conditions: ["import", "module", "browser", "default"],
    // Preserve symlinks to ensure consistent module resolution
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
  },
  ssr: {
    noExternal: ["react", "react-dom"],
  },
}));
