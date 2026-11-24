import express from 'express'
import session from 'express-session'
import request from 'supertest'
import { expect, test, vi } from 'vitest'

import { app as companionApp } from '../dist/companion.js'
import { decodeState } from '../dist/server/helpers/oauth-state.js'

vi.mock('express-prom-bundle')

const secret = 'test-secret'
const clientOrigin = 'http://client.test'

async function savedOrigin(
  answer: boolean | string | RegExp | (string | RegExp)[],
) {
  const app = express()
  app.use(session({ secret, resave: false, saveUninitialized: false }))
  app.use(
    companionApp({
      secret,
      filePath: './test/output',
      metrics: false,
      server: { protocol: 'http', host: 'localhost:3020' },
      providerOptions: { dropbox: { key: 'key', secret: 'secret' } },
      corsOrigins: (_origin, callback) => callback(null, answer),
    }).app,
  )
  const response = await request(app)
    .get('/dropbox/connect')
    .query({ state: btoa(JSON.stringify({ origin: clientOrigin })) })
    .expect(302)
  const state = new URL(response.get('location') ?? '').searchParams.get(
    'state',
  )
  return state == null ? undefined : decodeState(state, secret).origin
}

test.each([
  true,
  clientOrigin,
  [clientOrigin, 'http://other.test'],
  /^http:\/\/client\./,
])(
  'saves the client origin when a corsOrigins function allows it (%o)',
  async (answer) => {
    expect(await savedOrigin(answer)).toBe(clientOrigin)
  },
)

test.each([false, ['http://other.test'], /^http:\/\/other\./])(
  'saves no origin when a corsOrigins function refuses it (%o)',
  async (answer) => {
    expect(await savedOrigin(answer)).toBeUndefined()
  },
)
