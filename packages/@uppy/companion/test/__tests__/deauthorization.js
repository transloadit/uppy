const nock = require('nock')
const request = require('supertest')
const { getServer } = require('../mockserver')

const authServer = getServer()

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

describe('handle deauthorization callback', () => {
  nock('https://api.zoom.us')
    .post('/oauth/data/compliance')
    .reply(200)

  test('providers without support for callback endpoint', () => {
    return request(authServer)
      .post('/dropbox/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .send({
        foo: 'bar',
      })
    // @todo consider receiving 501 instead
      .expect(500)
  })

  test('validate that request credentials match', () => {
    return request(authServer)
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'wrong-verfication-token')
      .send({
        event: 'app_deauthorized',
        payload: {
          user_data_retention: 'false',
          account_id: 'EabCDEFghiLHMA',
          user_id: 'z9jkdsfsdfjhdkfjQ',
          signature: '827edc3452044f0bc86bdd5684afb7d1e6becfa1a767f24df1b287853cf73000',
          deauthorization_time: '2019-06-17T13:52:28.632Z',
          client_id: 'ADZ9k9bTWmGUoUbECUKU_a',
        },
      })
      .expect(400)
  })

  test('validate request credentials is present', () => {
    // Authorization header is absent
    return request(authServer)
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .send({
        event: 'app_deauthorized',
        payload: {
          user_data_retention: 'false',
          account_id: 'EabCDEFghiLHMA',
          user_id: 'z9jkdsfsdfjhdkfjQ',
          signature: '827edc3452044f0bc86bdd5684afb7d1e6becfa1a767f24df1b287853cf73000',
          deauthorization_time: '2019-06-17T13:52:28.632Z',
          client_id: 'ADZ9k9bTWmGUoUbECUKU_a',
        },
      })
      .expect(400)
  })

  test('validate request content', () => {
    return request(authServer)
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'zoom_verfication_token')
      .send({
        invalid: 'content',
      })
      .expect(400)
  })

  test('validate request content (event name)', () => {
    return request(authServer)
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'zoom_verfication_token')
      .send({
        event: 'wrong_event_name',
        payload: {
          user_data_retention: 'false',
          account_id: 'EabCDEFghiLHMA',
          user_id: 'z9jkdsfsdfjhdkfjQ',
          signature: '827edc3452044f0bc86bdd5684afb7d1e6becfa1a767f24df1b287853cf73000',
          deauthorization_time: '2019-06-17T13:52:28.632Z',
          client_id: 'ADZ9k9bTWmGUoUbECUKU_a',
        },
      })
      .expect(400)
  })

  test('allow valid request', () => {
    return request(authServer)
      .post('/zoom/deauthorization/callback')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'zoom_verfication_token')
      .send({
        event: 'app_deauthorized',
        payload: {
          user_data_retention: 'false',
          account_id: 'EabCDEFghiLHMA',
          user_id: 'z9jkdsfsdfjhdkfjQ',
          signature: '827edc3452044f0bc86bdd5684afb7d1e6becfa1a767f24df1b287853cf73000',
          deauthorization_time: '2019-06-17T13:52:28.632Z',
          client_id: 'ADZ9k9bTWmGUoUbECUKU_a',
        },
      })
      .expect(200)
  })
})
