import { afterEach, expect, test, vi } from 'vitest'
import logger from '../src/server/logger.js'
import {
  ProviderApiError,
  ProviderAuthError,
  ProviderUserError,
} from '../src/server/provider/error.js'
import Provider from '../src/server/provider/Provider.js'

afterEach(() => vi.restoreAllMocks())

class MappingProvider extends Provider {
  mapped: unknown = new ProviderApiError('Provider unavailable', 502)

  override mapProviderError(): unknown {
    return this.mapped
  }

  fail(error: unknown): Promise<unknown> {
    return this.withErrorHandling('test.provider', () => {
      throw error
    })
  }
}

test('logs and throws the mapped error while preserving unexpected-error severity', async () => {
  const provider = new MappingProvider({ allowLocalUrls: false })
  provider.mapped = new ProviderUserError({ code: 'S3_REQUEST_FAILED' })
  const log = vi.spyOn(logger, 'error').mockImplementation(() => {})
  await expect(provider.fail(new Error('SDK failure'))).rejects.toBe(
    provider.mapped,
  )
  expect(log).toHaveBeenCalledExactlyOnceWith(provider.mapped, 'test.provider')
})

test('keeps intentional authorization failures at debug level after mapping', async () => {
  const provider = new MappingProvider({ allowLocalUrls: false })
  const mapped = new ProviderAuthError()
  provider.mapped = mapped
  const log = vi.spyOn(logger, 'debug').mockImplementation(() => {})
  const errors = vi.spyOn(logger, 'error').mockImplementation(() => {})
  await expect(provider.fail(new ProviderAuthError())).rejects.toBe(
    provider.mapped,
  )
  expect(log).toHaveBeenCalledExactlyOnceWith(
    `${mapped.name}: ${mapped.message}`,
    'test.provider',
  )
  expect(errors).not.toHaveBeenCalled()
})
