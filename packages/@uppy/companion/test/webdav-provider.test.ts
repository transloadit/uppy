import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, expect, test, vi } from 'vitest'
import logger from '../dist/server/logger.js'
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

describe('webdav simpleAuth errors', () => {
  // A share link carries its own credential, so it must not reach the logs.
  const shareUrl =
    'https://cloud.example.com/public.php/webdav/s/SECRETSHARETOKEN'

  const failingAuth = (status: number) => {
    const provider = new WebdavProvider({ allowLocalUrls: false })
    vi.spyOn(provider, 'getClient').mockResolvedValue({
      getDirectoryContents: () =>
        Promise.reject(
          Object.assign(new Error(`HTTP ${status}`), {
            status,
            response: { status, url: shareUrl },
          }),
        ),
    } as never)
    const logged = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const err = provider
      .simpleAuth({ requestBody: { form: { webdavUrl: shareUrl } } } as never)
      .catch((e: unknown) => e)
    return { err, logged }
  }

  test('does not log the share URL', async () => {
    const { err, logged } = failingAuth(500)
    await err

    expect(logged).toHaveBeenCalled()
    for (const args of logged.mock.calls) {
      expect(JSON.stringify(args)).not.toContain('SECRETSHARETOKEN')
      for (const arg of args) {
        if (arg instanceof Error)
          expect(arg.stack).not.toContain('SECRETSHARETOKEN')
      }
    }
    logged.mockRestore()
  })

  test('a rejected login is an auth error', async () => {
    const { err, logged } = failingAuth(401)

    expect(((await err) as ProviderApiError).isAuthError).toBe(true)
    logged.mockRestore()
  })
})

describe('webdav transport errors', () => {
  // node-fetch quotes the request URL in transport errors (refused, DNS,
  // TLS) and in its refusal of `user:pass@` URLs; either can be the secret.
  const closedPortHost = async () => {
    const server = http.createServer()
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo
    await new Promise((resolve) => server.close(resolve))
    return `127.0.0.1:${port}`
  }

  // Captures what the logger actually writes, not the objects passed to it.
  const run = async (op: 'simpleAuth' | 'list', webdavUrl: string) => {
    const provider = new WebdavProvider({ allowLocalUrls: true })
    const output = vi.spyOn(console, 'log').mockImplementation(() => {})
    const err = (await (op === 'simpleAuth'
      ? provider.simpleAuth({ requestBody: { form: { webdavUrl } } } as never)
      : provider.list({ providerUserSession: { webdavUrl } } as never)
    ).catch((e: unknown) => e)) as
      | (Error & { code?: unknown; json?: unknown })
      | undefined
    const logged = output.mock.calls.flat().join('\n')
    output.mockRestore()
    return { err, logged }
  }

  for (const op of ['simpleAuth', 'list'] as const) {
    test(`${op}: a refused connection does not log the URL`, async () => {
      const host = await closedPortHost()
      const { err, logged } = await run(op, `http://${host}/dav/SECRETTOKEN/`)

      expect(logged).toContain('ECONNREFUSED')
      expect(logged).toContain(`http://${host}/[redacted]`)
      expect(logged).not.toContain('SECRETTOKEN')
      expect(`${err?.message}${err?.stack}`).not.toContain('SECRETTOKEN')
      if (op === 'simpleAuth') {
        expect(err?.json).toMatchObject({ code: 'WEBDAV_CANNOT_CONNECT' })
      } else {
        expect(err?.code).toBe('ECONNREFUSED')
      }
    })

    test(`${op}: a URL with credentials does not log them`, async () => {
      const host = await closedPortHost()
      const { err, logged } = await run(op, `http://USER:PASS@${host}/dav/`)

      expect(logged).toContain('embedded credentials')
      expect(logged).not.toMatch(/USER|PASS/)
      expect(`${err?.message}${err?.stack}`).not.toMatch(/USER|PASS/)
    })
  }
})
