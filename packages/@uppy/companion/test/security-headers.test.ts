import request from 'supertest'
import { expect, test, vi } from 'vitest'
import { getServer } from './mockserver.js'

vi.mock('express-prom-bundle')

test('the standalone server sets its security headers', async () => {
  const res = await request(await getServer()).get('/')

  expect(res.headers).toMatchObject({
    'x-frame-options': 'SAMEORIGIN',
    'x-xss-protection': '0',
    'x-content-type-options': 'nosniff',
    'x-download-options': 'noopen',
  })
})
