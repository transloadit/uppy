import { createServer } from 'node:http'
import express from 'express'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { defaultOptions } from '../src/config/companion.ts'
import * as tokenService from '../src/server/helpers/jwt.ts'
import * as oAuthState from '../src/server/helpers/oauth-state.ts'
import { gentleVerifyToken, verifyToken } from '../src/server/middlewares.ts'
import { getCredentialsOverrideMiddleware } from '../src/server/provider/credentials.ts'
import Provider from '../src/server/provider/Provider.ts'
import type { CompanionRuntimeOptions } from '../src/types/companion-options.ts'

vi.mock('express-prom-bundle')

class DriveProvider extends Provider {
  static override get oauthProvider(): string {
    return 'drive'
  }
}

const secret = Buffer.from([
  0xff, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x10, 0x11, 0x12,
  0x13, 0x14, 0x15,
])
const preAuthSecret = Buffer.from([
  0xab, 0xcd, 0xef, 0x42, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80, 0x90,
  0xa0, 0xb0, 0xc0,
])

type OAuthReqOptions = {
  secret: Buffer
}

function createOAuthApp(options: OAuthReqOptions) {
  const app = express()
  const companionOptions = {
    ...defaultOptions,
  } satisfies CompanionRuntimeOptions
  Reflect.set(companionOptions, 'secret', options.secret)
  app.use((req, _res, next) => {
    req.companion = {
      options: companionOptions,
      providerClass: DriveProvider,
      authToken: req.get('uppy-auth-token') ?? undefined,
    }
    next()
  })
  return app
}

describe('buffer secret compatibility', () => {
  test('verifyToken accepts auth tokens signed with Buffer secrets', async () => {
    const app = createOAuthApp({ secret })
    app.get('/verify/:providerName', verifyToken, (req, res) => {
      res.json({ session: req.companion.providerUserSession })
    })

    const token = tokenService.generateEncryptedAuthToken(
      { drive: { accessToken: 'buffer-token' } },
      secret,
    )

    const res = await request(app)
      .get('/verify/drive')
      .set('uppy-auth-token', token)
      .expect(200)

    expect(res.body).toEqual({
      session: { accessToken: 'buffer-token' },
    })
  })

  test('gentleVerifyToken decodes auth tokens with Buffer secrets', async () => {
    const app = createOAuthApp({ secret })
    app.get('/gentle/:providerName', gentleVerifyToken, (req, res) => {
      res.json({ session: req.companion.providerUserSession ?? null })
    })

    const token = tokenService.generateEncryptedAuthToken(
      { drive: { accessToken: 'buffer-token' } },
      secret,
    )

    const res = await request(app)
      .get('/gentle/drive')
      .set('uppy-auth-token', token)
      .expect(200)

    expect(res.body).toEqual({
      session: { accessToken: 'buffer-token' },
    })
  })

  describe('credentials override middleware', () => {
    const providers = {
      drive: DriveProvider,
    }

    let credentialsURL = ''
    let credentialsServer: ReturnType<typeof createServer> | undefined

    beforeAll(async () => {
      credentialsServer = createServer((req, res) => {
        if (req.url !== '/keys' || req.method !== 'POST') {
          res.statusCode = 404
          res.end()
          return
        }
        res.setHeader('content-type', 'application/json')
        res.end(
          JSON.stringify({
            credentials: {
              key: 'dynamic-key',
              secret: 'dynamic-secret',
            },
          }),
        )
      })

      await new Promise<void>((resolve) => {
        credentialsServer?.listen(0, '127.0.0.1', () => resolve())
      })

      const address = credentialsServer.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected credentials server to listen on a TCP port')
      }
      credentialsURL = `http://127.0.0.1:${address.port}/keys`
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => {
        credentialsServer?.close(() => resolve())
      })
    })

    test('supports Buffer secret/preAuthSecret for dynamic credentials', async () => {
      const app = express()
      const companionOptions = {
        ...defaultOptions,
        providerOptions: {
          drive: {
            credentialsURL,
          },
        },
      } satisfies CompanionRuntimeOptions
      Reflect.set(companionOptions, 'secret', secret)
      Reflect.set(companionOptions, 'preAuthSecret', preAuthSecret)

      app.get(
        '/:oauthProvider/connect',
        getCredentialsOverrideMiddleware(providers, companionOptions),
        (_req, res) => {
          res.json(res.locals['grant'] ?? null)
        },
      )

      const preAuthToken = tokenService.generateEncryptedToken(
        'dynamic-credentials-request',
        preAuthSecret,
      )
      const state = oAuthState.encodeState(
        { id: 'test-state', preAuthToken },
        secret,
      )

      const res = await request(app)
        .get('/drive/connect')
        .query({ state })
        .expect(200)

      expect(res.body).toEqual({
        dynamic: {
          key: 'dynamic-key',
          secret: 'dynamic-secret',
        },
      })
    })
  })
})
