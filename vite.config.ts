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
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000 kB
    rollupOptions: {
      output: {
        // Optimized manual chunks to reduce bundle size
        manualChunks: (id) => {
          // React core libraries
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // React Router
          if (id.includes('node_modules/react-router-dom/')) {
            return 'router';
          }
          // Supabase libraries
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }
          // Radix UI components (large library)
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-ui';
          }
          // React Query
          if (id.includes('node_modules/@tanstack/react-query/')) {
            return 'react-query';
          }
          // Framer Motion
          if (id.includes('node_modules/framer-motion/')) {
            return 'framer-motion';
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
    dyadComponentTagger()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force single React instance to prevent "Invalid hook call" errors
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    force: true, // Force re-optimization
  },
}));
