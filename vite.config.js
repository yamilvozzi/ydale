import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png', 'logo.png'],
      manifest: {
        name: 'YDALE',
        short_name: 'YDALE',
        lang: 'es',
        id: '/',
        start_url: '/',
        scope: '/',
        description: 'Cuaderno digital de la banda',
        theme_color: '#1a1d1c',
        background_color: '#1a1d1c',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/ydale-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/ydale-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/ydale-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/ydale-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Conservar logo.png original (2,38 MB) y disponible también sin conexión.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Precachea todo el bundle de la app (JS, CSS, HTML) para que
        // abra sin conexión una vez visitada al menos una vez.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            // Datos de los temas: red primero, y si no hay conexión
            // usa lo último que se guardó en caché (ensayo sin wifi).
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.includes('/rest/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-data',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
