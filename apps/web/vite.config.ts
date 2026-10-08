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
  // VITE_* lives in the repository root .env, not apps/web, so dev and the
  // Docker build read the same file the API and docker compose already use.
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
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
        // App shell only. Precaching every emitted file would pull the Mapbox
        // chunks down on the home page and defeat their lazy loading, so lazy
        // route chunks are cached the first time they are actually used.
        globPatterns: [
          'index.html',
          '**/*.webmanifest',
          'assets/index-*.js',
          'assets/index-*.css',
        ],
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
          {
            urlPattern: ({ sameOrigin, url }) =>
              sameOrigin && /\.(?:js|css)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'heatshift-chunks',
              expiration: { maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 },
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
  worker: {
    // mapbox-gl's ESM build starts its own worker with `{ type: 'module' }`.
    // Vite's default iife worker format cannot code-split, so the build fails.
    format: 'es',
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
