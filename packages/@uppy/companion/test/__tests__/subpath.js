const request = require('supertest')
const { getServer } = require('../mockserver')

it('can be served under a subpath', async () => {
  const server = getServer({ COMPANION_PATH: '/subpath' })

  await request(server).get('/subpath').expect(200)
  await request(server).get('/subpath/metrics').expect(200)
  await request(server).get('/').expect(404)
  await request(server).get('/metrics').expect(404)
})

test('can be served without a subpath', async () => {
  const server = getServer()

  await request(server).get('/').expect(200)
  await request(server).get('/metrics').expect(200)
  await request(server).get('/subpath').expect(404)
  await request(server).get('/subpath/metrics').expect(404)
})
