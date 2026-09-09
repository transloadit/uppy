import Core, { type UppyEventMap } from '@uppy/core'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import Tus, { type TusBody } from './index.js'

// Shared fake XHR object and mock control state — must be declared via
// vi.hoisted so they're available inside the vi.mock factory (which is hoisted
// before imports).
const { fakeXhr, tusMock } = vi.hoisted(() => ({
  fakeXhr: {
    status: 403,
    responseText: JSON.stringify({
      message: 'File cannot be uploaded as the BIN content type is disallowed!',
      status_code: 403,
    }),
  },
  tusMock: {
    // When true, `start()` leaves the upload in flight instead of failing it,
    // and `abort(true)` rejects the way a compliant server does when asked to
    // terminate an upload it already considers finished.
    failTerminate: false,
    // Set by `start()`, so tests can wait until the upload is actually running.
    started: false,
  },
}))

// Mock tus-js-client so the upload-error test never touches the network.
// The mock Upload fires onError immediately with a fake DetailedError.
vi.mock('tus-js-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('tus-js-client')>()
  class MockUpload {
    private options: Record<string, any>

    // tus sets this once the creation request succeeded; Tus reads it to decide
    // whether the abort should also terminate the upload on the server.
    url: string | null = null

    constructor(_file: any, options: Record<string, any>) {
      this.options = options
    }

    start() {
      tusMock.started = true
      this.url = 'https://fake-endpoint.uppy.io/files/abc'

      // Leave the upload in flight so the test can abort it itself.
      if (tusMock.failTerminate) return

      const err = Object.assign(new Error('tus: server responded with 403'), {
        originalResponse: {
          getStatus: () => 403,
          getUnderlyingObject: () => fakeXhr,
        },
        originalRequest: null,
      })
      setTimeout(() => this.options.onError(err), 0)
    }

    abort(shouldTerminate?: boolean) {
      if (shouldTerminate) {
        return tusMock.failTerminate
          ? Promise.reject(
              new Error('tus: 400 cannot terminate finished upload'),
            )
          : Promise.resolve()
      }
      // Mirrors XMLHttpRequest.abort(): the response object is reset. This
      // makes the test fail if Tus aborts the completed errored request.
      fakeXhr.status = 0
      fakeXhr.responseText = ''
      return Promise.resolve()
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

  describe('terminate rejection', () => {
    afterEach(() => {
      tusMock.failTerminate = false
      tusMock.started = false
    })

    it('logs a failed best-effort terminate instead of leaving an unhandled rejection', async () => {
      tusMock.failTerminate = true

      const core = new Core<any, TusBody>()
      core.use(Tus, { endpoint: 'https://fake-endpoint.uppy.io/files/' })
      const logSpy = vi.spyOn(core, 'log')

      const id = core.addFile({
        type: 'application/octet-stream',
        name: 'finished.bin',
        data: new Blob([new Uint8Array(8)]),
      })

      core.upload()
      // The upload has to be in flight (and have a URL) before removing the
      // file, else Tus aborts without terminating on the server.
      await vi.waitFor(() => expect(tusMock.started).toBe(true))

      // Removing the file aborts with `terminate: true`, which a compliant
      // server rejects for an upload it already considers finished.
      core.removeFile(id)

      await vi.waitFor(() =>
        expect(logSpy).toHaveBeenCalledWith(expect.any(Error), 'warning'),
      )
    })
  })
})
