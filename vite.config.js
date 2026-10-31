import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' so the built app also works when opened from a sub-folder or a file share.
export default defineConfig({
  plugins: [react()],
  base: './',
})
