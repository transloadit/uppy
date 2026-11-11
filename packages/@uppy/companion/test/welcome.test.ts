import request from 'supertest'
import { expect, test, vi } from 'vitest'
import packageJson from '../package.json' with { type: 'json' }
import { getServer } from './mockserver.js'

vi.mock('express-prom-bundle')

// scripts/check-companion-compat.mjs reads hosted Companion's version from
// this line before releasing the client, so changing its format, or the
// plain-text content type, breaks that check. Update both together.
test('the welcome page starts with the exact version line', async () => {
  const server = await getServer()

  const res = await request(server).get('/').expect(200)

  expect(res.headers['content-type']).toMatch(/^text\/plain/)
  expect(res.text.split('\n')[0]).toBe(
    `Welcome to Companion v${packageJson.version}`,
  )
})

test('COMPANION_HIDE_WELCOME hides the version line', async () => {
  const server = await getServer({ COMPANION_HIDE_WELCOME: 'true' })

  const res = await request(server).get('/')

  expect(res.text ?? '').not.toContain('Welcome to Companion')
})
