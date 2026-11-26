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

test('logs the original unexpected error and throws the mapped one', async () => {
  const provider = new MappingProvider({ allowLocalUrls: false })
  provider.mapped = new ProviderUserError({ code: 'S3_REQUEST_FAILED' })
  const original = new Error('SDK failure')
  const log = vi.spyOn(logger, 'error').mockImplementation(() => {})
  await expect(provider.fail(original)).rejects.toBe(provider.mapped)
  expect(log).toHaveBeenCalledExactlyOnceWith(original, 'test.provider')
})

test('keeps intentional authorization failures at debug level', async () => {
  const provider = new MappingProvider({ allowLocalUrls: false })
  provider.mapped = new ProviderAuthError()
  const original = new ProviderAuthError()
  const log = vi.spyOn(logger, 'debug').mockImplementation(() => {})
  const errors = vi.spyOn(logger, 'error').mockImplementation(() => {})
  await expect(provider.fail(original)).rejects.toBe(provider.mapped)
  expect(log).toHaveBeenCalledExactlyOnceWith(
    `${original.name}: ${original.message}`,
    'test.provider',
  )
  expect(errors).not.toHaveBeenCalled()
})

test('logs the original error even when mapping throws', async () => {
  const provider = new MappingProvider({ allowLocalUrls: false })
  const original = new Error('SDK failure')
  const mappingError = new Error('Mapping failed')
  vi.spyOn(provider, 'mapProviderError').mockImplementation(() => {
    throw mappingError
  })
  const log = vi.spyOn(logger, 'error').mockImplementation(() => {})
  await expect(provider.fail(original)).rejects.toBe(mappingError)
  expect(log).toHaveBeenCalledExactlyOnceWith(original, 'test.provider')
})
