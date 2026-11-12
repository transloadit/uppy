import request from 'supertest'
import { describe, expect, test, vi } from 'vitest'
import { getServer } from './mockserver.js'

vi.mock('express-prom-bundle')

// The provider param middleware must always call `next()`, so that
// `hasSessionAndProvider` answers 400 instead of the request hanging.
describe('unknown provider', () => {
  test.each([
    '/nonexistent/list/',
    '/nonexistent/connect',
    '/instagram/list/',
  ])('%s responds with 400 instead of hanging', async (path) => {
    const res = await request(await getServer()).get(path)
    expect(res.status).toBe(400)
  })
})
