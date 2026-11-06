import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, expect, test, vi } from 'vitest'
import { defaultOptions } from '../src/config/companion.js'
import { getCompanionOptions } from '../src/standalone/helper.js'

const directory = mkdtempSync(join(tmpdir(), 'companion-config-'))
const argv = [...process.argv]

afterEach(() => {
  vi.unstubAllEnvs()
  process.argv = [...argv]
})

test('loads inline JSON between environment and explicit options', () => {
  vi.stubEnv('COMPANION_CONFIG_FILE', undefined)
  vi.stubEnv('COMPANION_GOOGLE_KEY', 'environment-key')
  vi.stubEnv(
    'COMPANION_CONFIG_JSON',
    JSON.stringify({
      providerOptions: { drive: { key: 'configured-key' } },
      server: { host: 'configured.example' },
    }),
  )
  expect(
    getCompanionOptions({
      ...defaultOptions,
      secret: 'fixture',
      filePath: tmpdir(),
      server: { host: 'explicit.example' },
    }),
  ).toMatchObject({
    providerOptions: { drive: { key: 'configured-key' } },
    server: { host: 'explicit.example' },
  })
})

test('loads an environment config file and lets the CLI select another file', () => {
  const envPath = join(directory, 'environment.json')
  const cliPath = join(directory, 'cli.json')
  writeFileSync(
    envPath,
    JSON.stringify({ server: { host: 'environment.example' } }),
  )
  writeFileSync(cliPath, JSON.stringify({ server: { host: 'cli.example' } }))
  vi.stubEnv('COMPANION_CONFIG_JSON', undefined)
  vi.stubEnv('COMPANION_CONFIG_FILE', envPath)
  expect(getCompanionOptions().server?.host).toBe('environment.example')
  process.argv = ['node', 'companion', '--config', cliPath]
  expect(getCompanionOptions().server?.host).toBe('cli.example')
})

test.each(['-c', '--config'])('requires a path after %s', (flag) => {
  vi.stubEnv('COMPANION_CONFIG_FILE', undefined)
  vi.stubEnv('COMPANION_CONFIG_JSON', undefined)
  process.argv = ['node', 'companion', flag]
  expect(() => getCompanionOptions()).toThrow('requires a config file path')
})

test('rejects conflicting file and inline configuration', () => {
  vi.stubEnv('COMPANION_CONFIG_JSON', '{}')
  vi.stubEnv('COMPANION_CONFIG_FILE', 'unused.json')
  expect(() => getCompanionOptions()).toThrow('Choose either')
})

test.each([
  '[]',
  'null',
  '"credential-value"',
  '{"secret":"credential-value"',
])('rejects invalid configuration without echoing it (%s)', (inline) => {
  vi.stubEnv('COMPANION_CONFIG_FILE', undefined)
  vi.stubEnv('COMPANION_CONFIG_JSON', inline)
  expect(() => getCompanionOptions()).toThrow(
    'Invalid Companion JSON configuration',
  )
})

test('resolves allowlist patterns from inline configuration', () => {
  vi.stubEnv('COMPANION_CONFIG_FILE', undefined)
  vi.stubEnv(
    'COMPANION_CONFIG_JSON',
    JSON.stringify({
      uploadUrls: ['^https://uploads\\.example/'],
      server: { validHosts: ['^companion\\.example$'] },
    }),
  )
  const options = getCompanionOptions()
  expect(options.uploadUrls).toEqual([/^https:\/\/uploads\.example\//])
  expect(options.server?.validHosts).toEqual([/^companion\.example$/])
})

afterAll(() => rmSync(directory, { recursive: true, force: true }))
