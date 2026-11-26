import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves the site at https://<user>.github.io/<repo>/ → all paths start with this
  base: '/pokemon-team-builder/',
})
