import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [react()],
  resolve: {
    alias: {
      // Použití import.meta.url pro vytvoření spolehlivého aliasu,
      // který mapuje '@' na složku 'src'.
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

