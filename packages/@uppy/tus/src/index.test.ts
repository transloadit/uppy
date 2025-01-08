import { describe, expect, expectTypeOf, it } from 'vitest'
import Core from '@uppy/core'
import Tus, { type TusBody } from './index.js'

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
