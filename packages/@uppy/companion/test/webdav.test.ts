import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { gzipSync } from 'node:zlib'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { FORBIDDEN_IP_ADDRESS } from '../dist/server/helpers/request.js'
import { ProviderApiError } from '../dist/server/provider/error.js'
import WebdavProvider from '../dist/server/provider/webdav/index.js'

let server: http.Server
let requestCount = 0
let webdavUrl: string

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void

const emptyListing =
  '<?xml version="1.0"?><d:multistatus xmlns:d="DAV:"></d:multistatus>'

const fileResponse = (href: string) =>
  `<d:response><d:href>${href}</d:href><d:propstat><d:prop>` +
  '<d:resourcetype/><d:getcontentlength>5</d:getcontentlength>' +
  '<d:getcontenttype>text/plain</d:getcontenttype>' +
  '<d:getlastmodified>Mon, 20 Oct 2026 00:00:00 GMT</d:getlastmodified>' +
  '</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>'

const multistatus = (...responses: string[]) =>
  `<?xml version="1.0"?><d:multistatus xmlns:d="DAV:">${responses.join('')}</d:multistatus>`

const defaultHandler: Handler = (_req, res) => {
  res.writeHead(207, { 'content-type': 'application/xml' })
  res.end(emptyListing)
}
let handler: Handler = defaultHandler

beforeAll(async () => {
  server = http.createServer((req, res) => {
    requestCount++
    handler(req, res)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  webdavUrl = `http://127.0.0.1:${port}/`
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  requestCount = 0
  handler = defaultHandler
})

// WebDAV doesn't read the companion context
const simpleAuth = (allowLocalUrls: boolean) =>
  new WebdavProvider({ allowLocalUrls }).simpleAuth({
    requestBody: { form: { webdavUrl } },
    companion: {} as never,
  })

const provider = () => new WebdavProvider({ allowLocalUrls: true })

describe('webdav SSRF protection', () => {
  test('blocks local IPs when allowLocalUrls is false', async () => {
    await expect(simpleAuth(false)).rejects.toThrow(FORBIDDEN_IP_ADDRESS)
    expect(requestCount).toBe(0)
  })

  test('allows local IPs when allowLocalUrls is true', async () => {
    await expect(simpleAuth(true)).resolves.toEqual({ webdavUrl })
    expect(requestCount).toBe(1)
  })
})

describe('webdav response bounds', () => {
  test('rejects a PROPFIND body over 5 MiB', async () => {
    const padding = ' '.repeat(6 * 1024 * 1024)
    const body = gzipSync(
      `<?xml version="1.0"?><d:multistatus xmlns:d="DAV:">${padding}</d:multistatus>`,
    )
    handler = (_req, res) => {
      res.writeHead(207, {
        'content-type': 'application/xml',
        'content-encoding': 'gzip',
      })
      res.end(body)
    }
    await expect(simpleAuth(true)).rejects.toThrow(/max-size|over limit/)
  })

  test('builds item ids from the server path, not the route id', async () => {
    handler = (_req, res) => {
      res.writeHead(207, { 'content-type': 'application/xml' })
      res.end(multistatus(fileResponse('/a.txt')))
    }
    const { items } = await provider().list({
      providerUserSession: { webdavUrl },
      directory: '/other',
      query: {},
    } as never)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      id: encodeURIComponent('/a.txt'),
      requestPath: encodeURIComponent('/a.txt'),
      name: 'a.txt',
    })
  })
})

describe('webdav download', () => {
  const statThenGet = (onGet: Handler): Handler => {
    return (req, res) => {
      if (req.method === 'GET') {
        onGet(req, res)
        return
      }
      res.writeHead(207, { 'content-type': 'application/xml' })
      res.end(multistatus(fileResponse('/a.txt')))
    }
  }

  test('rejects a download whose GET is refused', async () => {
    handler = statThenGet((_req, res) => {
      res.writeHead(404)
      res.end('gone')
    })
    const err = await provider()
      .download({ id: 'a.txt', providerUserSession: { webdavUrl } } as never)
      .catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ProviderApiError)
    expect((err as ProviderApiError).statusCode).toBe(404)
  })

  test('streams a successful GET', async () => {
    handler = statThenGet((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain' })
      res.end('hello')
    })
    const { stream, size } = await provider().download({
      id: 'a.txt',
      providerUserSession: { webdavUrl },
    } as never)
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    expect(Buffer.concat(chunks).toString()).toBe('hello')
    expect(size).toBe(5)
  })
})
