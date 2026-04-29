import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(),react()],
  define: {
    global: 'window', 
  },
  server: {
    proxy: {
      '/api/aicredits': {
        target: 'https://api.aicredits.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/aicredits/, '')
      }
    }
  }
})
