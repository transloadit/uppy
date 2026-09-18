import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { S3_USER_MESSAGE_KEYS } from '../src/server/provider/s3/messages.js'

describe('S3 provider user messages', () => {
  test('every key the provider sends is a @uppy/core locale key', () => {
    const coreLocale = readFileSync(
      new URL('../../core/src/locale.ts', import.meta.url),
      'utf8',
    )
    const missing = S3_USER_MESSAGE_KEYS.filter(
      (key) => !new RegExp(`^\\s*${key}:`, 'm').test(coreLocale),
    )
    expect(missing).toEqual([])
  })
})
