import { spawn } from 'node:child_process'

const vitest = spawn(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'tests/contract'], {
  stdio: 'inherit',
  env: { ...process.env, RUN_CONTRACT_TESTS: '1' },
})

vitest.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})
