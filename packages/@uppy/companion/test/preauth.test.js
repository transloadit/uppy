import request from 'supertest'
import { describe, expect, test, vi } from 'vitest'
import { getServer } from './mockserver.js'

vi.mock('express-prom-bundle')

vi.mock('../src/server/helpers/jwt.js', () => {
  return {
    generateEncryptedToken: () => 'dummy token',
    verifyEncryptedToken: () => '',
    addToCookiesIfNeeded: () => {},
    removeFromCookies: () => {},
  }
})

const getServerWithDynamicOauth = async () =>
  getServer({
    COMPANION_DROPBOX_KEYS_ENDPOINT: 'http://localhost:1000/endpoint',
  })

describe('handle preauth endpoint', () => {
  test('happy path', async () => {
    return (
      request(await getServerWithDynamicOauth())
        .post('/dropbox/preauth')
        .set('Content-Type', 'application/json')
        .send({
          params: 'param value',
        })
        .expect(200)
        // see jwt.generateEncryptedToken mock above
        .then((res) => expect(res.body.token).toBe('dummy token'))
    )
  })

  test('preauth request without params in body', async () => {
    return request(await getServerWithDynamicOauth())
      .post('/dropbox/preauth')
      .set('Content-Type', 'application/json')
      .send({
        notParams: 'value',
      })
      .expect(400)
  })

  test('providers with dynamic credentials disabled', async () => {
    return request(await getServerWithDynamicOauth())
      .post('/drive/preauth')
      .set('Content-Type', 'application/json')
      .send({
        params: 'param value',
      })
      .expect(501)
  })

  test('server with dynamic credentials disabled', async () => {
    return request(await getServer())
      .post('/dropbox/preauth')
      .set('Content-Type', 'application/json')
      .send({
        params: 'param value',
      })
      .expect(501)
  })
})
