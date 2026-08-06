import Core, { type UppyEventMap } from '@uppy/core'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import Tus, { type TusBody } from './index.js'

// Shared fake XHR object — must be declared via vi.hoisted so it's available
// inside the vi.mock factory (which is hoisted before imports).
const { fakeXhr } = vi.hoisted(() => ({
  fakeXhr: {
    status: 403,
    responseText: JSON.stringify({
      message: 'File cannot be uploaded as the BIN content type is disallowed!',
      status_code: 403,
    }),
  },
}))

// Mock tus-js-client so the upload-error test never touches the network.
// The mock Upload fires onError immediately with a fake DetailedError.
vi.mock('tus-js-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('tus-js-client')>()
  class MockUpload {
    private options: Record<string, any>

    constructor(_file: any, options: Record<string, any>) {
      this.options = options
    }

    start() {
      const err = Object.assign(new Error('tus: server responded with 403'), {
        originalResponse: {
          getStatus: () => 403,
          getUnderlyingObject: () => fakeXhr,
        },
        originalRequest: null,
      })
      setTimeout(() => this.options.onError(err), 0)
    }

    abort() {
      // Mirrors XMLHttpRequest.abort(): the response object is reset. This
      // makes the test fail if Tus aborts the completed errored request.
      fakeXhr.status = 0
      fakeXhr.responseText = ''
    }

    // ponytail: tus calls this before start(); return empty so no resume logic runs
    findPreviousUploads() {
      return Promise.resolve([])
    }
  }
  return { ...actual, Upload: MockUpload }
})

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
    it('sends the server response over the upload-error event', async () => {
      const core = new Core<any, TusBody>()
      core.use(Tus, {
        endpoint: 'https://fake-endpoint.uppy.io/files/',
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
          expect(response?.body?.xhr.status).toBe(403)
          expect(JSON.parse(response!.body!.xhr.responseText).message).toBe(
            'File cannot be uploaded as the BIN content type is disallowed!',
          )
        }),
      ])

      const file = core.getFile(id)
      expect(file.response?.status).toBe(403)
      expect(file.response?.body?.xhr.status).toBe(403)
      expect(JSON.parse(file.response!.body!.xhr.responseText).message).toBe(
        'File cannot be uploaded as the BIN content type is disallowed!',
      )
    })
  })
})
