import express from 'express'
import request from 'supertest'
import { describe, expect, test } from 'vitest'

import { cors } from '../src/server/middlewares.ts'

async function run({
  corsOptions = {},
  origin = 'https://localhost:1234',
  existingHeaders = {},
}: {
  corsOptions?: Record<string, unknown>
  origin?: string
  existingHeaders?: Record<string, string>
}): Promise<Record<string, string | string[] | undefined>> {
  const app = express()
  app.use((_req, res, next) => {
    for (const [k, v] of Object.entries(existingHeaders)) res.setHeader(k, v)
    next()
  })
  app.use(cors(corsOptions))
  app.options('*', (_req, res) => {
    res.status(204).end()
  })

  const res = await request(app).options('/').set('Origin', origin)
  return res.headers
}

describe('cors', () => {
  test('should properly merge with existing headers', () => {
    return run({
      corsOptions: {
        sendSelfEndpoint: true,
        corsOrigins: new RegExp('^https://localhost:.*$'),
      },
      existingHeaders: {
        'Access-Control-Allow-Methods': 'PATCH,OPTIONS, post',
        'Access-Control-Allow-Headers': 'test-allow-header',
        'Access-Control-Expose-Headers': 'test',
      },
    }).then((headers) => {
      expect(headers['access-control-allow-origin']).toBe(
        'https://localhost:1234',
      )
      expect(headers.vary).toBe('Origin')
      expect(headers['access-control-allow-credentials']).toBe('true')
      expect(headers['access-control-allow-methods']).toBe(
        'PATCH,OPTIONS,POST,GET,DELETE',
      )
      expect(headers['access-control-allow-headers']).toBe(
        'test-allow-header,uppy-auth-token,uppy-credentials-params,authorization,origin,content-type,accept',
      )
      expect(headers['access-control-expose-headers']).toBe('test,i-am')
      expect(headers['content-length']).toBe('0')
    })
  })

  test('should also work when nothing added', () => {
    return run({}).then((headers) => {
      expect(headers['access-control-allow-origin']).toBe(
        'https://localhost:1234',
      )
      expect(headers.vary).toBe('Origin')
      expect(headers['access-control-allow-credentials']).toBe('true')
      expect(headers['access-control-allow-methods']).toBe(
        'GET,POST,OPTIONS,DELETE',
      )
      expect(headers['access-control-allow-headers']).toBe(
        'uppy-auth-token,uppy-credentials-params,authorization,origin,content-type,accept',
      )
      expect(headers['content-length']).toBe('0')
    })
  })

  test('should support disabling cors', () => {
    return run({ corsOptions: { corsOrigins: false } }).then((headers) => {
      expect(headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  test('should support incorrect url', () => {
    return run({ corsOptions: { corsOrigins: /^incorrect$/ } }).then(
      (headers) => {
        expect(headers['access-control-allow-origin']).toBeUndefined()
        expect(headers.vary).toBe('Origin')
        expect(headers['access-control-allow-credentials']).toBe('true')
        expect(headers['access-control-allow-methods']).toBe(
          'GET,POST,OPTIONS,DELETE',
        )
        expect(headers['access-control-allow-headers']).toBe(
          'uppy-auth-token,uppy-credentials-params,authorization,origin,content-type,accept',
        )
        expect(headers['content-length']).toBe('0')
      },
    )
  })

  test('should support array origin', () => {
    return run({
      corsOptions: {
        corsOrigins: ['http://google.com', 'https://localhost:1234'],
      },
    }).then((headers) => {
      expect(headers['access-control-allow-origin']).toBe(
        'https://localhost:1234',
      )
      expect(headers.vary).toBe('Origin')
      expect(headers['access-control-allow-credentials']).toBe('true')
      expect(headers['access-control-allow-methods']).toBe(
        'GET,POST,OPTIONS,DELETE',
      )
      expect(headers['access-control-allow-headers']).toBe(
        'uppy-auth-token,uppy-credentials-params,authorization,origin,content-type,accept',
      )
      expect(headers['content-length']).toBe('0')
    })
  })
})
