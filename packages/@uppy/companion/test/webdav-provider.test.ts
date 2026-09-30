import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest'
import { FORBIDDEN_IP_ADDRESS } from '../dist/server/helpers/request.js'
import { ProviderApiError } from '../dist/server/provider/error.js'
import WebdavProvider from '../dist/server/provider/webdav/index.js'

const providerUserSession = { webdavUrl: 'https://example.com/webdav/' }

// The `webdav` package's createErrorFromResponse sets both `status` and
// `response` on every non-2xx response, which is what made the old
// assign-then-overwrite mapping lose the auth classification.
const webdavError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { status, response: { status } })

const providerRejecting = (status: number) => {
  const provider = new WebdavProvider({ allowLocalUrls: false })
  vi.spyOn(provider, 'getClient').mockResolvedValue({
    getDirectoryContents: () => Promise.reject(webdavError(status)),
  } as never)
  return provider
}

describe('webdav provider error mapping', () => {
  test('a 401 is an auth error, so the client re-authenticates', async () => {
    const err = await providerRejecting(401)
      .list({ providerUserSession } as never)
      .catch((e: unknown) => e)

    expect(err).toBeInstanceOf(ProviderApiError)
    expect((err as ProviderApiError).isAuthError).toBe(true)
  })

  test('any other status stays a plain api error', async () => {
    const err = await providerRejecting(507)
      .list({ providerUserSession } as never)
      .catch((e: unknown) => e)

    expect(err).toBeInstanceOf(ProviderApiError)
    // ProviderAuthError extends ProviderApiError, so instanceof proves
    // nothing here; isAuthError is the field errorToResponse branches on.
    expect((err as ProviderApiError).isAuthError).toBe(false)
    expect((err as ProviderApiError).statusCode).toBe(507)
  })
})

describe('webdav network protection', () => {
  let server: http.Server
  let port: number
  let hits: number
  let redirectTarget: string | undefined

  beforeAll(async () => {
    server = http.createServer((_req, res) => {
      hits++
      if (redirectTarget) {
        res.writeHead(302, { location: redirectTarget }).end()
        return
      }
      res.writeHead(207, { 'content-type': 'application/xml' })
      res.end('<d:multistatus xmlns:d="DAV:"/>')
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No port')
    port = address.port
  })

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))
  afterEach(() => vi.restoreAllMocks())

  beforeEach(() => {
    hits = 0
    redirectTarget = undefined
    vi.spyOn(dns, 'lookup').mockImplementation(((
      _hostname: string,
      options: dns.LookupOptions,
      cb: (
        err: NodeJS.ErrnoException | null,
        address: string | dns.LookupAddress[],
        family?: number,
      ) => void,
    ) => {
      cb(
        null,
        options.all ? [{ address: '127.0.0.1', family: 4 }] : '127.0.0.1',
        4,
      )
    }) as typeof dns.lookup)

    const connect = http.Agent.prototype.createConnection
    vi.spyOn(http.Agent.prototype, 'createConnection').mockImplementation(
      function (this: http.Agent, options, cb) {
        // Route the synthetic public hop to our fixture after the protected
        // agent has checked it. No test can contact an external/private host.
        if (options.host === 'public.example.test') {
          options = { ...options, host: '127.0.0.1', port }
        }
        if (
          options.host !== '127.0.0.1' &&
          options.host !== 'private.example.test'
        ) {
          throw new Error('Unexpected unprotected HTTP connection')
        }
        return connect.call(this, options, cb)
      },
    )
    vi.spyOn(https.Agent.prototype, 'createConnection').mockImplementation(
      () => {
        throw new Error('Unexpected unprotected HTTPS connection')
      },
    )
  })

  test.each([
    'http',
    'https',
  ])('%s blocks forbidden literal IPs', async (scheme) => {
    const provider = new WebdavProvider({ allowLocalUrls: false })
    for (const host of [
      '127.0.0.1',
      '10.0.0.1',
      '172.16.0.1',
      '192.168.1.1',
      '169.254.169.254',
      '[::1]',
      '[::ffff:127.0.0.1]',
    ]) {
      const client = await provider.getClient({
        providerUserSession: { webdavUrl: `${scheme}://${host}:${port}/` },
      })
      await expect(client.stat('/')).rejects.toThrow(FORBIDDEN_IP_ADDRESS)
    }
    expect(http.Agent.prototype.createConnection).not.toHaveBeenCalled()
    expect(https.Agent.prototype.createConnection).not.toHaveBeenCalled()
    expect(hits).toBe(0)
  })

  test('blocks a hostname resolving to loopback', async () => {
    const provider = new WebdavProvider({ allowLocalUrls: false })
    const client = await provider.getClient({
      providerUserSession: {
        webdavUrl: `http://private.example.test:${port}/`,
      },
    })
    await expect(client.stat('/')).rejects.toThrow(
      'Forbidden resolved IP address',
    )
    expect(dns.lookup).toHaveBeenCalled()
    expect(hits).toBe(0)
  })

  test.each([
    'http',
    'https',
  ])('blocks redirects to private %s destinations', async (scheme) => {
    redirectTarget = `${scheme}://127.0.0.1:${port}/private/`
    const provider = new WebdavProvider({ allowLocalUrls: false })
    const client = await provider.getClient({
      providerUserSession: { webdavUrl: `http://public.example.test:${port}/` },
    })
    await expect(client.stat('/')).rejects.toThrow(FORBIDDEN_IP_ADDRESS)
    expect(hits).toBe(1)
    expect(https.Agent.prototype.createConnection).not.toHaveBeenCalled()
  })

  test('allows a public WebDAV authentication check', async () => {
    const provider = new WebdavProvider({ allowLocalUrls: false })
    const webdavUrl = `http://public.example.test:${port}/`
    await expect(
      provider.simpleAuth({ requestBody: { form: { webdavUrl } } }),
    ).resolves.toEqual({ webdavUrl })
    expect(hits).toBe(1)
  })

  test.each([
    '127.0.0.1',
    'private.example.test',
  ])('allows %s when explicitly configured', async (host) => {
    const provider = new WebdavProvider({ allowLocalUrls: true })
    const webdavUrl = `http://${host}:${port}/`
    await expect(
      provider.simpleAuth({ requestBody: { form: { webdavUrl } } }),
    ).resolves.toEqual({ webdavUrl })
    expect(hits).toBe(1)
  })
})
