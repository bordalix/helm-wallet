import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [nodePolyfills(), tailwindcss(), react()],
  server: {
    open: true, // automatically open the app in the browser
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
})
