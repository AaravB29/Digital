/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Only process.env is used here, so declare it instead of adding @types/node.
declare const process: { env: Record<string, string | undefined> };

import pkg from './package.json';

// VITE_PREVIEW=1: one self-contained file for the sandboxed preview page (no service worker there).
const isPreview = !!process.env.VITE_PREVIEW;

export default defineConfig(({ mode }) => ({
  // `--mode desktop` builds the Windows app (Tauri): relative paths, #/ addresses, no service worker.
  // A relative base also lets the web build run from any folder, e.g. https://<user>.github.io/<repo>/.
  base: mode === 'desktop' ? './' : (process.env.VITE_BASE ?? '/'),
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      disable: isPreview || mode === 'desktop',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Budget Tracker',
        short_name: 'Budget',
        description: 'Track monthly spending, fixed costs and trends. Works offline; data stays on your device.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f8fafc',
        theme_color: '#0f766e',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  build: isPreview ? { rollupOptions: { output: { inlineDynamicImports: true } } } : {},
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
