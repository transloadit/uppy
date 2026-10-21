import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { createGzip } from 'node:zlib'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { downloadURL } from '../dist/server/download.js'

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void

let server: http.Server
let baseUrl: string
let handler: Handler = (_req, res) => res.end()

// Streams a large compressed body in chunks and records how far it got before
// the client went away. With a 500 or an unfollowable redirect, got used to
// read all of it; a hostile body could inflate to gigabytes.
const TOTAL_CHUNKS = 40
const CHUNK = ' '.repeat(64 * 1024)
const streaming = { chunksWritten: 0 }

function streamGzipBody(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  status: number,
  headers: Record<string, string> = {},
) {
  res.writeHead(status, { 'content-encoding': 'gzip', ...headers })
  const gzip = createGzip()
  gzip.pipe(res)
  let closed = false
  req.socket.once('close', () => {
    closed = true
  })
  const tick = () => {
    if (closed || streaming.chunksWritten >= TOTAL_CHUNKS) {
      gzip.end()
      return
    }
    streaming.chunksWritten++
    gzip.write(CHUNK)
    gzip.flush(() => setTimeout(tick, 10))
  }
  tick()
}

beforeAll(async () => {
  server = http.createServer((req, res) => handler(req, res))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  streaming.chunksWritten = 0
})

const settle = () => new Promise((r) => setTimeout(r, 100))

describe('downloadURL', () => {
  test('does not read the body of an error response', async () => {
    handler = (req, res) => streamGzipBody(req, res, 500)
    await expect(downloadURL(`${baseUrl}/err`, true)).rejects.toMatchObject({
      statusCode: 500,
    })
    await settle()
    expect(streaming.chunksWritten).toBeLessThan(TOTAL_CHUNKS)
  })

  // One Location got rejects outright (scheme), one that fails at connect
  // time; both used to make got buffer the whole redirect body.
  test.each([
    'ftp://example.invalid/',
    'http://127.0.0.1:1/',
  ])('does not read a redirect body it cannot follow (%s)', async (location) => {
    handler = (req, res) => streamGzipBody(req, res, 302, { location })
    await expect(downloadURL(`${baseUrl}/redir`, true)).rejects.toThrow()
    await settle()
    expect(streaming.chunksWritten).toBeLessThan(TOTAL_CHUNKS)
  })

  test('a redirect without a Location is an error, not the file', async () => {
    handler = (_req, res) => {
      res.writeHead(302, { 'content-type': 'text/html' })
      res.end('<a href="/elsewhere">moved</a>')
    }
    await expect(downloadURL(`${baseUrl}/moved`, true)).rejects.toMatchObject({
      statusCode: 302,
    })
  })

  test('follows a redirect', async () => {
    handler = (req, res) => {
      if (req.url === '/final') {
        res.writeHead(200, {
          'content-type': 'text/plain',
          'content-length': '5',
        })
        res.end('hello')
        return
      }
      res.writeHead(302, { location: `${baseUrl}/final` })
      res.end()
    }
    const { stream, size } = await downloadURL(`${baseUrl}/start`, true)
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    expect(Buffer.concat(chunks).toString()).toBe('hello')
    expect(size).toBe(5)
  })
})
