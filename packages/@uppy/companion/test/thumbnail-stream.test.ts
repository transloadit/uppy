import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { PassThrough } from 'node:stream'
import express from 'express'
import { afterEach, describe, expect, test } from 'vitest'
import thumbnail from '../dist/server/controllers/thumbnail.js'

let stream: PassThrough
let server: http.Server

async function listen(provider: unknown): Promise<number> {
  const app = express()
  app.get('/t/:id', (req, res, next) => {
    ;(req as unknown as { companion: unknown }).companion = {
      provider,
      providerUserSession: {},
    }
    thumbnail(req, res, next)
  })
  server = app.listen(0, '127.0.0.1')
  await new Promise<void>((resolve) => server.once('listening', resolve))
  return (server.address() as AddressInfo).port
}

afterEach(() => {
  server?.close()
})

describe('thumbnail streaming', () => {
  test('destroys the provider stream when the client goes away', async () => {
    stream = new PassThrough()
    const port = await listen({
      thumbnail: async () => ({ stream, contentType: 'image/jpeg' }),
    })
    stream.write(Buffer.alloc(16 * 1024))
    await new Promise<void>((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${port}/t/thumb`, (res) => {
        res.once('data', () => {
          req.destroy()
          resolve()
        })
        res.on('error', () => {})
      })
      req.on('error', reject)
    })
    await new Promise((r) => setTimeout(r, 150))
    expect(stream.destroyed).toBe(true)
  })

  test('streams the whole body and sets the content type on the normal path', async () => {
    stream = new PassThrough()
    const port = await listen({
      thumbnail: async () => ({ stream, contentType: 'image/jpeg' }),
    })
    stream.end('thumbnail-bytes')
    const { status, body, type } = await new Promise<{
      status: number | undefined
      body: string
      type: string | undefined
    }>((resolve, reject) => {
      http
        .get(`http://127.0.0.1:${port}/t/thumb`, (res) => {
          const chunks: Buffer[] = []
          res.on('data', (c) => chunks.push(c as Buffer))
          res.on('end', () =>
            resolve({
              status: res.statusCode,
              body: Buffer.concat(chunks).toString(),
              type: res.headers['content-type'],
            }),
          )
        })
        .on('error', reject)
    })
    expect(status).toBe(200)
    expect(body).toBe('thumbnail-bytes')
    expect(type).toBe('image/jpeg')
  })
})
