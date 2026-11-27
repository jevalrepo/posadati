import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En GitHub Pages el sitio vive en /<repo>/ (https://jevalrepo.github.io/posadati/)
export default defineConfig({
  base: process.env.VITE_BASE ?? '/posadati/',
  plugins: [react(), tailwindcss()],
})
