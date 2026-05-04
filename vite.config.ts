import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(() => ({
  server: {
    host: true,
    port: 8080,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '.trycloudflare.com',
      '.ngrok.io',
      '.framer.wtf',
    ],
    hmr: {
      overlay: false,
      clientPort: 8080,
      host: 'localhost',
    },
    headers: {
      'Permissions-Policy': 'accelerometer=(self "https://api.razorpay.com"), gyroscope=(self "https://api.razorpay.com"), magnetometer=(self "https://api.razorpay.com"), payment=(self)',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
      '/supabase-proxy': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'framer-motion',
      'lucide-react',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'react-router-dom',
    ],
    holdUntilCrawlEnd: true,
  },
}))
