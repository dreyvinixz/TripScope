import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { localApi } from './server/viteApiPlugin.ts'
export default defineConfig({
  plugins: [react(), tailwindcss(), localApi()],
  server: { watch: { ignored: ['**/playwright-report/**', '**/test-results/**'] } },
})
