import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),     // must be before react() — processes CSS first
    react(),           // Oxc JSX transform + Fast Refresh (no Babel)
  ],
  resolve: {
    tsconfigPaths: true,   // native Vite 8 — reads @/* paths from tsconfig.app.json
  },
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
