import request from 'supertest'
import { describe, expect, test, vi } from 'vitest'
import { getServer } from './mockserver.js'

vi.mock('express-prom-bundle')

// The provider param middleware must always hand the request on. Before this
// test existed, an unknown provider name left the request without a response
// (the middleware returned without calling `next()`), so clients hung until
// their own timeout instead of getting the 400 that `hasSessionAndProvider`
// sends.
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
