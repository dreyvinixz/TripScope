import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/server/**/*.test.ts'],
    environment: 'jsdom', setupFiles: ['./tests/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'html', 'json-summary'], include: ['src/**/*.{ts,tsx}', 'server/gemini.ts'],
      exclude: ['src/main.tsx'] },
  },
})
