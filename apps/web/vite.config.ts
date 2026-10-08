import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

/** public/manifest.webmanifest is the source of truth, also used in dev mode. */
const manifestPath = fileURLToPath(
  new URL('./public/manifest.webmanifest', import.meta.url),
);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The static manifest already exists in public/ and is linked from index.html.
      manifest,
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/apple-touch-icon.png',
      ],
      workbox: {
        // Precache the app shell; API calls stay network-first (no offline sync yet).
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'heatshift-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 300 },
            },
          },
        ],
      },
      devOptions: {
        // Service workers need a secure context; useful for `vite preview` checks.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    // Keep the first paint small for low-end Android on 3G.
    chunkSizeWarningLimit: 600,
  },
});
