import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Objetivo moderno: menos polyfills, bundles más chicos y rápidos.
    target: 'es2020',
    cssCodeSplit: true,
    // Sube el límite del warning (ya separamos vendors en chunks cacheables).
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Separar librerías grandes en chunks propios: se cachean aparte y
        // se descargan en paralelo, acelerando la carga inicial.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id))
            return 'react-vendor'
          if (id.includes('framer-motion')) return 'motion-vendor'
          if (id.includes('gsap') || id.includes('lenis')) return 'scroll-vendor'
          if (id.includes('@supabase')) return 'supabase-vendor'
          return 'vendor'
        },
      },
    },
  },
})
