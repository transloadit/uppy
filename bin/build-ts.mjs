#!/usr/bin/env node

// eslint-disable-next-line import/no-extraneous-dependencies
import { execa } from 'execa'
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
  const { location } = JSON.parse(line)
  if (existsSync(path.join(cwd, location, 'tsconfig.json'))) {
    await execa(exe, [...argv0, 'tsc', '-p', location], {
      stdio: 'inherit',
      cwd,
    })
  }
}
