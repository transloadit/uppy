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
