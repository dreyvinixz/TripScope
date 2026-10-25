import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { handleGemini } from './gemini.ts'
import { Readable } from 'node:stream'
export function localApi(): Plugin {
  return {
    name: 'travelai-local-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      process.env.GEMINI_API_KEY ??= env.GEMINI_API_KEY
      process.env.GEMINI_MODEL ??= env.GEMINI_MODEL
      process.env.GEMINI_FALLBACK_MODELS ??= env.GEMINI_FALLBACK_MODELS
      process.env.GEMINI_FALLBACK_MODEL ??= env.GEMINI_FALLBACK_MODEL
      server.middlewares.use('/api/gemini', (req, res) => {
        void (async () => {
          const origin = `http://${req.headers.host ?? 'localhost'}`
          const request = new Request(`${origin}/api/gemini`, {
            method: req.method,
            headers: new Headers(Object.entries(req.headers).flatMap(([name, value]) => value ? [[name, String(value)]] : [])),
            ...(!['GET', 'HEAD'].includes(req.method ?? 'GET')
              ? { body: Readable.toWeb(req) as ReadableStream<Uint8Array>, duplex: 'half' } : {}),
          })
          const response = await handleGemini(request)
          res.writeHead(response.status, Object.fromEntries(response.headers))
          res.end(await response.text())
        })().catch(() => { res.writeHead(500); res.end('Serviço indisponível.') })
      })
    },
  }
}
