import nock from 'nock'
import request from 'supertest'
import { afterAll, afterEach, beforeEach, describe, test, vi } from 'vitest'
import { getServer } from './mockserver.js'

vi.mock('express-prom-bundle')

afterEach(() => {
  nock.cleanAll()
})
afterAll(() => {
  nock.restore()
})

describe('handle deauthorization callback', () => {
  beforeEach(() => {
    nock('https://api.zoom.us').post('/oauth/data/compliance').reply(200)
  })

  test('providers without support for callback endpoint', async () => {
    return request(await getServer())
      .post('/dropbox/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .send({
        foo: 'bar',
      })
      .expect(500)
  })

  test('validate that request credentials match', async () => {
    return request(await getServer())
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'wrong-verfication-token')
      .send({
        event: 'app_deauthorized',
        payload: {
          user_data_retention: 'false',
          account_id: 'EabCDEFghiLHMA',
          user_id: 'z9jkdsfsdfjhdkfjQ',
          signature:
            '827edc3452044f0bc86bdd5684afb7d1e6becfa1a767f24df1b287853cf73000',
          deauthorization_time: '2019-06-17T13:52:28.632Z',
          client_id: 'ADZ9k9bTWmGUoUbECUKU_a',
        },
      })
      .expect(400)
  })

  test('validate request credentials is present', async () => {
    // Authorization header is absent
    return request(await getServer())
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .send({
        event: 'app_deauthorized',
        payload: {
          user_data_retention: 'false',
          account_id: 'EabCDEFghiLHMA',
          user_id: 'z9jkdsfsdfjhdkfjQ',
          signature:
            '827edc3452044f0bc86bdd5684afb7d1e6becfa1a767f24df1b287853cf73000',
          deauthorization_time: '2019-06-17T13:52:28.632Z',
          client_id: 'ADZ9k9bTWmGUoUbECUKU_a',
        },
      })
      .expect(400)
  })

  test('validate request content', async () => {
    return request(await getServer())
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'zoom_verfication_token')
      .send({
        invalid: 'content',
      })
      .expect(400)
  })

  test('validate request content (event name)', async () => {
    return request(await getServer())
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'zoom_verfication_token')
      .send({
        event: 'wrong_event_name',
        payload: {
          user_data_retention: 'false',
          account_id: 'EabCDEFghiLHMA',
          user_id: 'z9jkdsfsdfjhdkfjQ',
          signature:
            '827edc3452044f0bc86bdd5684afb7d1e6becfa1a767f24df1b287853cf73000',
          deauthorization_time: '2019-06-17T13:52:28.632Z',
          client_id: 'ADZ9k9bTWmGUoUbECUKU_a',
        },
      })
      .expect(400)
  })

  test('allow valid request', async () => {
    return request(await getServer())
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'zoom_verfication_token')
      .send({
        event: 'app_deauthorized',
        payload: {
          user_data_retention: 'false',
          account_id: 'EabCDEFghiLHMA',
          user_id: 'z9jkdsfsdfjhdkfjQ',
          signature:
            '827edc3452044f0bc86bdd5684afb7d1e6becfa1a767f24df1b287853cf73000',
          deauthorization_time: '2019-06-17T13:52:28.632Z',
          client_id: 'ADZ9k9bTWmGUoUbECUKU_a',
        },
      })
      .expect(200)
  })
})
