import Core, { type UppyEventMap } from '@uppy/core'
import nock from 'nock'
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'
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

  describe('upload-error response', () => {
    afterEach(() => {
      nock.cleanAll()
    })

    it('sends the server response over the upload-error event', async () => {
      nock('https://fake-endpoint.uppy.io')
        .post('/files/')
        .reply(
          403,
          JSON.stringify({
            message:
              'File cannot be uploaded as the BIN content type is disallowed!',
            status_code: 403,
          }),
          { 'Content-Type': 'application/json' },
        )

      const core = new Core<any, TusBody>()
      core.use(Tus, {
        endpoint: 'https://fake-endpoint.uppy.io/files/',
        // Avoid retrying so the failure surfaces immediately.
        retryDelays: [],
      })
      const id = core.addFile({
        type: 'application/octet-stream',
        source: 'test',
        name: 'test.bin',
        data: new Blob([new Uint8Array(1024)]),
      })

      const event = new Promise<
        Parameters<UppyEventMap<any, TusBody>['upload-error']>
      >((resolve) => {
        core.once('upload-error', (...args) => resolve(args))
      })

      await Promise.all([
        core.upload().catch(() => {
          // Core rejects the upload; we assert on the event/state instead.
        }),
        event.then(([, , response]) => {
          expect(response?.status).toBe(403)
          const { xhr } = response!.body!
          expect(xhr).toBeInstanceOf(XMLHttpRequest)
          expect(JSON.parse(xhr.responseText).message).toBe(
            'File cannot be uploaded as the BIN content type is disallowed!',
          )
        }),
      ])

      // The response is also persisted on the file so it is available on the
      // `complete` result and via `getFile`.
      expect(core.getFile(id).response?.status).toBe(403)
    })
  })
})
