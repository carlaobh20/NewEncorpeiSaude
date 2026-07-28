import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH permite publicar o mesmo build em subpastas diferentes no
// GitHub Pages (ex.: "/" para main, "/dev/" para a branch dev), sem mexer
// no restante do app.
const basePath = process.env.BASE_PATH || '/'

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Encorpei · Paciente',
        short_name: 'Encorpei',
        description: 'Seu acompanhamento contínuo de saúde — peso, água, treino e health score.',
        lang: 'pt-BR',
        theme_color: '#F7F8FC',
        background_color: '#F7F8FC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: { host: true, port: 5173 },
})
