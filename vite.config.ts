import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Mettre l'url exact en production
        changeOrigin: true, // pour les requetes cross-origin
        secure: false, // pour les requetes http
        ws: true, // pour les websockets
      }
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
