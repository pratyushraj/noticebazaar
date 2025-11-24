import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    sourcemap: false, // Disable source maps in production to avoid 404 errors
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Use default chunking to avoid circular dependency issues
        manualChunks: undefined,
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
