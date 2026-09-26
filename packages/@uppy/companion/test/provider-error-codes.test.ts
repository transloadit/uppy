import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { PROVIDER_ERROR_CODES } from '../src/server/provider/errorCodes.js'

describe('provider error codes', () => {
  test('every code a provider sends is known to @uppy/core', () => {
    const clientMap = readFileSync(
      new URL('../../core/src/companion-client/errorCodes.ts', import.meta.url),
      'utf8',
    )
    const unknown = PROVIDER_ERROR_CODES.filter(
      (code) => !new RegExp(`^\\s*${code}:`, 'm').test(clientMap),
    )
    expect(unknown).toEqual([])
  })
})
