#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { stdin, env } from 'node:process'
import { createInterface as readLines } from 'node:readline'
import { fileURLToPath } from 'node:url'

const fromYarn = 'npm_execpath' in env
const exe = fromYarn ? env.npm_execpath : 'corepack'
const argv0 = fromYarn ? [] : ['yarn']

const cwd = fileURLToPath(new URL('../', import.meta.url))

for await (const line of readLines(stdin)) {
  const { location, name } = JSON.parse(line)
  if (existsSync(path.join(cwd, location, 'tsconfig.json'))) {
    const cp = spawn(exe, [...argv0, 'tsc', '-p', location], {
      stdio: 'inherit',
      cwd,
    })
    await Promise.race([
      once(cp, 'error').then(err => Promise.reject(err)),
      await once(cp, 'exit')
        .then(([code]) => (code && Promise.reject(new Error(`Non-zero exit code when building "${name}": ${code}`)))),
    ])
  }
  if (existsSync(path.join(cwd, location, 'tsconfig.build.json'))) {
    const cp = spawn(exe, [...argv0, 'tsc', '--build', path.join(cwd, location, 'tsconfig.build.json')], {
      stdio: 'inherit',
      cwd,
    })
    await Promise.race([
      once(cp, 'error').then(err => Promise.reject(err)),
      await once(cp, 'exit')
        .then(([code]) => (code && Promise.reject(new Error(`Non-zero exit code when building "${name}": ${code}`)))),
    ])
  }
}
