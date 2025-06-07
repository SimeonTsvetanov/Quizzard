import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Quizzard/', // GitHub Pages repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Improve caching and performance
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/system']
        }
      }
    }
  },
  server: {
    // Disable aggressive caching during development
    hmr: {
      overlay: true
    },
    // Force refresh for better development experience
    headers: {
      'Cache-Control': 'no-store'
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', '@mui/icons-material']
  }
})
