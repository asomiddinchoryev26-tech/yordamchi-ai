import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: true,   // barcha tarmoq interfeyslarida eshitadi (WiFi, LAN)
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Post-splitting the shared app shell (app code + the 3-language i18n table,
    // which must load eagerly) settles at ~560 KB raw / ~177 KB gzip. Calibrate
    // the warning above that baseline so it still flags genuine regressions.
    chunkSizeWarningLimit: 600,
    // Split rarely-changing vendor libs into their own long-cacheable chunks,
    // keeping the app chunk smaller. Pure build optimization — no app changes.
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            {
              name: 'vendor-react',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: 'vendor-motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            },
          ],
        },
      },
    },
  },
})
