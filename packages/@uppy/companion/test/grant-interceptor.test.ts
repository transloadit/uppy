import express from 'express'
import interceptor from 'express-interceptor'
import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { shouldInterceptGrantError } from '../dist/companion.js'

describe('grant error interceptor scope', () => {
  test('only grant callback paths are intercepted', () => {
    expect(shouldInterceptGrantError('/connect/dropbox/callback')).toBe(true)
    expect(shouldInterceptGrantError('/connect/googledrive/callback')).toBe(
      true,
    )
    expect(shouldInterceptGrantError('/box/thumbnail/123')).toBe(false)
    expect(shouldInterceptGrantError('/health')).toBe(false)
    expect(shouldInterceptGrantError('/connect/dropbox/redirect')).toBe(false)
  })

  // The bug: express-interceptor replaces res.write with one returning
  // undefined, dropping backpressure, on every route it is mounted on.
  // Mounting it only where shouldInterceptGrantError is true keeps res.write
  // native everywhere else.
  test('an unguarded interceptor drops the res.write flag; the guard restores it', async () => {
    const mk = (guard: boolean) => {
      const app = express()
      const mw = interceptor(() => ({
        isInterceptable: () => true,
        intercept: (body, send) => send(body),
      }))
      app.use((req, res, next) =>
        !guard || shouldInterceptGrantError(req.path)
          ? mw(req, res, next)
          : next(),
      )
      app.get('/health', (_req, res) => {
        const flag = res.write('')
        res.end(String(flag))
      })
      return app
    }
    expect((await request(mk(false)).get('/health')).text).toBe('undefined')
    expect(['true', 'false']).toContain(
      (await request(mk(true)).get('/health')).text,
    )
  })
})
