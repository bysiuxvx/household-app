import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@household/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  optimizeDeps: {
    include: ['@household/shared'],
  },
  server: {
    watch: {
      // Ensure Vite watches the shared package for changes
      ignored: ['!../../packages/shared/**/*'],
    },
  },
})
