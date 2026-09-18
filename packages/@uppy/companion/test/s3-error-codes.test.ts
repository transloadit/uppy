import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { S3_ERROR_CODES } from '../src/server/provider/s3/errorCodes.js'

describe('S3 provider error codes', () => {
  test('every code the provider sends is known to @uppy/core', () => {
    const clientMap = readFileSync(
      new URL('../../core/src/companion-client/errorCodes.ts', import.meta.url),
      'utf8',
    )
    const unknown = S3_ERROR_CODES.filter(
      (code) => !new RegExp(`^\\s*${code}:`, 'm').test(clientMap),
    )
    expect(unknown).toEqual([])
  })
})
