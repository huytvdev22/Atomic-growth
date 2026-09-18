import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Cấu hình Vite với React 19, Tailwind CSS v4 và Progressive Web App (PWA)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'favicon-32x32.png',
        'vite.svg',
        'sql-wasm.wasm'
      ],
      manifest: {
        name: 'Atomic Growth — Xây Dựng Thói Quen & Phát Triển Bản Thân',
        short_name: 'Atomic Growth',
        description: 'Ứng dụng xây dựng thói quen và phát triển bản thân bền vững theo phương pháp Atomic Habits',
        theme_color: '#F8F7F2',
        background_color: '#F8F7F2',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/vite.svg',
            sizes: '100x100',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,wasm}'],
        navigateFallbackDenylist: [/^\/.*\.wasm$/, /\.wasm$/],
        runtimeCaching: [
          {
            // Cache Google Fonts Stylesheet & WebFonts cho trải nghiệm offline trọn vẹn
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 năm
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
