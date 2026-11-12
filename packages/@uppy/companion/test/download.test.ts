import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { createGzip } from 'node:zlib'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { downloadURL } from '../dist/server/download.js'
import {
  getProtectedGot,
  openProtectedStream,
  UPSTREAM_TIMEOUTS,
} from '../dist/server/helpers/request.js'

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

  test('keeps credential headers on a same-origin redirect but drops them across origins', async () => {
    // got stripped authorization/cookie on cross-origin redirects; the manual
    // hop loop must do the same (Google Picker passes a bearer token).
    const seen: Array<{ origin: string; authorization: string | undefined }> =
      []
    const other = http.createServer((req, res) => {
      seen.push({ origin: 'other', authorization: req.headers.authorization })
      res.writeHead(200, { 'content-length': '0' })
      res.end()
    })
    await new Promise<void>((resolve) => other.listen(0, '127.0.0.1', resolve))
    const otherUrl = `http://127.0.0.1:${(other.address() as AddressInfo).port}`
    try {
      handler = (req, res) => {
        if (req.url === '/same') {
          seen.push({
            origin: 'same',
            authorization: req.headers.authorization,
          })
          res.writeHead(200, { 'content-length': '0' })
          res.end()
          return
        }
        res.writeHead(302, {
          location: req.url === '/to-same' ? `${baseUrl}/same` : `${otherUrl}/`,
        })
        res.end()
      }
      const headers = { authorization: 'Bearer secret', 'x-other': '1' }
      await downloadURL(`${baseUrl}/to-same`, true, undefined, { headers })
      await downloadURL(`${baseUrl}/to-other`, true, undefined, { headers })
      expect(seen).toEqual([
        { origin: 'same', authorization: 'Bearer secret' },
        { origin: 'other', authorization: undefined },
      ])
    } finally {
      other.close()
    }
  })

  test('got clients carry header timeouts but no read timeout', () => {
    const { timeout } = getProtectedGot({ allowLocalIPs: true }).defaults
      .options
    expect(timeout).toMatchObject(UPSTREAM_TIMEOUTS)
    expect(timeout.request).toBeUndefined()
    expect(timeout.read).toBeUndefined()
  })

  test('a server that never answers times out instead of pinning the request', async () => {
    handler = () => {
      // accept the connection, never respond
    }
    await expect(
      openProtectedStream(`${baseUrl}/hole`, true, {
        timeout: { response: 200 },
      }),
    ).rejects.toThrow(/timed out|Timeout/i)
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
