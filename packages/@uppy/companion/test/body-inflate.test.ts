import { gzipSync } from 'node:zlib'
import request from 'supertest'
import { describe, expect, test, vi } from 'vitest'
import { getServer } from './mockserver.js'

vi.mock('express-prom-bundle')

// body-parser inflates compressed request bodies before applying its size
// limit, so a 140-byte gzip form could become a 600 KB session record or a
// 2 MB S3 completion payload. Browsers never send Content-Encoding on
// requests, so refuse it everywhere Companion parses a body.
describe('compressed request bodies', () => {
  test('are rejected with 415 on the OAuth connect route', async () => {
    await request(await getServer())
      .post('/connect/dropbox')
      .set('Content-Encoding', 'gzip')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(gzipSync('a=1'))
      .expect(415)
  })

  test('are rejected with 415 on JSON routes', async () => {
    await request(await getServer())
      .post('/url/meta')
      .set('Content-Encoding', 'gzip')
      .set('Content-Type', 'application/json')
      .send(gzipSync('{"url":"http://example.com/"}'))
      .expect(415)
  })

  test('plain bodies still parse', async () => {
    const res = await request(await getServer())
      .post('/url/meta')
      .set('Content-Type', 'application/json')
      .send({ url: 'ftp://not-allowed' })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid request body' })
  })
})
