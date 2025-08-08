import Core from '@uppy/core'
import {describe, expect, expectTypeOf, it} from 'vitest'
import Tus, {type TusBody} from './index.js'
import getFingerprint from './getFingerprint.js'

describe('Tus', () => {
  it('Throws errors if autoRetry option is true', () => {
    const uppy = new Core()

    expect(() => {
      // @ts-expect-error removed
      uppy.use(Tus, { autoRetry: true })
    }).toThrowError(
      /The `autoRetry` option was deprecated and has been removed/,
    )
  })

  it('Throws errors if autoRetry option is false', () => {
    const uppy = new Core()

    expect(() => {
      // @ts-expect-error removed
      uppy.use(Tus, { autoRetry: false })
    }).toThrowError(
      /The `autoRetry` option was deprecated and has been removed/,
    )
  })

  it('Throws errors if autoRetry option is `undefined`', () => {
    const uppy = new Core()

    expect(() => {
      // @ts-expect-error removed
      uppy.use(Tus, { autoRetry: undefined })
    }).toThrowError(
      /The `autoRetry` option was deprecated and has been removed/,
    )
  })

  it('propagates the TusBody type', () => {
    const uppy = new Core<any, TusBody>()
    const id = uppy.addFile({ name: 'test.jpg', data: { size: 1024 } })
    const file = uppy.getFile(id)
    expectTypeOf(file.response?.body).toEqualTypeOf<
      { xhr: XMLHttpRequest } | undefined
    >()
  })
})

describe('getFingerprint', () => {
  it('includes extra metadata in the fingerprint', async () => {
    const file = {
      id: 'file1',
      meta: {
        customField: 'value1',
      },
    }
    const extraKeys = ['customField']
    const fingerprintFn = getFingerprint(file, extraKeys)
    const options = { endpoint: 'http://example.com/upload' }
    const fingerprint = await fingerprintFn({}, options)
    expect(fingerprint).toBe('tus-file1-http://example.com/upload-value1')
  })

  it('does not include extra metadata when extraKeys is not provided', async () => {
    const file = {
      id: 'file2',
      meta: {
        customField: 'value1',
      },
    }
    const fingerprintFn = getFingerprint(file)
    const options = { endpoint: 'http://example.com/upload' }
    const fingerprint = await fingerprintFn({}, options)
    expect(fingerprint).toBe('tus-file2-http://example.com/upload')
  })

  it('handles multiple extra keys', async () => {
    const file = {
      id: 'file3',
      meta: {
        customField: 'value1',
        anotherField: 'value2',
      },
    }
    const extraKeys = ['customField', 'anotherField']
    const fingerprintFn = getFingerprint(file, extraKeys)
    const options = { endpoint: 'http://example.com/upload' }
    const fingerprint = await fingerprintFn({}, options)
    expect(fingerprint).toBe('tus-file3-http://example.com/upload-value1:value2')
  })

  it('handles missing metadata keys', async () => {
    const file = {
      id: 'file4',
      meta: {},
    }
    const extraKeys = ['customField']
    const fingerprintFn = getFingerprint(file, extraKeys)
    const options = { endpoint: 'http://example.com/upload' }
    const fingerprint = await fingerprintFn({}, options)
    expect(fingerprint).toBe('tus-file4-http://example.com/upload-')
  })

  it('handles multiple extra keys with some missing', async () => {
    const file = {
      id: 'file5',
      meta: {
        customField: 'value1',
      },
    }
    const extraKeys = ['customField', 'missingField']
    const fingerprintFn = getFingerprint(file, extraKeys)
    const options = { endpoint: 'http://example.com/upload' }
    const fingerprint = await fingerprintFn({}, options)
    expect(fingerprint).toBe('tus-file5-http://example.com/upload-value1:')
  })

  it('converts metadata values to strings', async () => {
    const file = {
      id: 'file6',
      meta: {
        numberField: 123,
        objectField: { key: 'value' },
      },
    }
    const extraKeys = ['numberField', 'objectField']
    const fingerprintFn = getFingerprint(file, extraKeys)
    const options = { endpoint: 'http://example.com/upload' }
    const fingerprint = await fingerprintFn({}, options)
    expect(fingerprint).toBe('tus-file6-http://example.com/upload-123:[object Object]')
  })

  it('handles special characters in metadata', async () => {
    const file = {
      id: 'file7',
      meta: {
        customField: 'value:with:colon',
      },
    }
    const extraKeys = ['customField']
    const fingerprintFn = getFingerprint(file, extraKeys)
    const options = { endpoint: 'http://example.com/upload' }
    const fingerprint = await fingerprintFn({}, options)
    expect(fingerprint).toBe('tus-file7-http://example.com/upload-value:with:colon')
  })
})
