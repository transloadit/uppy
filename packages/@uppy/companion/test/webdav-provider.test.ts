import { describe, expect, test, vi } from 'vitest'
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
