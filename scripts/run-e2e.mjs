import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const localUrl = 'http://127.0.0.1:4173'
const suppliedUrl = process.env.E2E_BASE_URL
let server

function run(command, args, environment) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: environment,
      stdio: 'inherit',
      windowsHide: true,
    })

    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })
}

async function waitUntilReady(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // O servidor ainda está iniciando.
    }
    await delay(200)
  }

  throw new Error(`O servidor E2E não respondeu em ${url}.`)
}

try {
  if (!suppliedUrl) {
    server = spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        '--host',
        '127.0.0.1',
        '--port',
        '4173',
        '--strictPort',
      ],
      { stdio: 'inherit', windowsHide: true },
    )
    await waitUntilReady(localUrl)
  }

  const exitCode = await run(
    process.execPath,
    ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)],
    { ...process.env, E2E_BASE_URL: suppliedUrl ?? localUrl },
  )
  process.exitCode = exitCode
} finally {
  if (server && !server.killed) {
    server.kill()
  }
}
