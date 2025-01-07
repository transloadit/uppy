import { vi, describe, it, expect } from 'vitest'
import nock from 'nock'
import Core, { type UppyEventMap } from '@uppy/core'
import XHRUpload from './index.js'

describe('XHRUpload', () => {
  it('should leverage hooks from fetcher', async () => {
    nock('https://fake-endpoint.uppy.io')
      .defaultReplyHeaders({
        'access-control-allow-method': 'POST',
        'access-control-allow-origin': '*',
      })
      .options('/')
      .reply(204, {})
      .post('/')
      .reply(401, {})
      .options('/')
      .reply(204, {})
      .post('/')
      .reply(200, 'https://fake-endpoint.uppy.io/random-id')

    const core = new Core<any, { url: string }>()
    const shouldRetry = vi.fn(() => true)
    const onBeforeRequest = vi.fn(() => {})
    const onAfterResponse = vi.fn(() => {})
    // Test that we can turn a text response into a JSON response.
    const getResponseData = vi.fn((xhr: XMLHttpRequest) => ({
      url: xhr.responseText,
    }))

    core.use(XHRUpload, {
      id: 'XHRUpload',
      endpoint: 'https://fake-endpoint.uppy.io',
      shouldRetry,
      onBeforeRequest,
      onAfterResponse,
      getResponseData,
    })
    const id = core.addFile({
      type: 'image/png',
      source: 'test',
      name: 'test.jpg',
      data: new Blob([new Uint8Array(8192)]),
    })

    core.setFileState(id, {
      xhrUpload: {
        // Test that we don't have a TS error for setting endpoint
        // on metadata
        endpoint: 'https://fake-endpoint.uppy.io',
      },
    })

    await core.upload()

    expect(shouldRetry).toHaveBeenCalledTimes(1)
    expect(onAfterResponse).toHaveBeenCalledTimes(2)
    expect(onBeforeRequest).toHaveBeenCalledTimes(2)
    expect(core.getFile(id).response!.body).toEqual({
      url: 'https://fake-endpoint.uppy.io/random-id',
    })
  })

  it('should send response object over upload-error event', async () => {
    nock('https://fake-endpoint.uppy.io')
      .defaultReplyHeaders({
        'access-control-allow-method': 'POST',
        'access-control-allow-origin': '*',
      })
      .options('/')
      .reply(204, {})
      .post('/')
      .reply(400, { status: 400, message: 'Oh no' })

    const core = new Core()
    const shouldRetry = vi.fn(() => false)

    core.use(XHRUpload, {
      id: 'XHRUpload',
      endpoint: 'https://fake-endpoint.uppy.io',
      shouldRetry,
      async onAfterResponse(xhr) {
        if (xhr.status === 400) {
          // We want to test that we can define our own error message
          throw new Error(JSON.parse(xhr.responseText).message)
        }
      },
    })

    const id = core.addFile({
      type: 'image/png',
      source: 'test',
      name: 'test.jpg',
      data: new Blob([new Uint8Array(8192)]),
    })

    const event = new Promise<
      Parameters<UppyEventMap<any, any>['upload-error']>
    >((resolve) => {
      core.once('upload-error', (...args) => resolve(args))
    })

    await Promise.all([
      core.upload(),
      event.then(([file, error, response]) => {
        const newFile = core.getFile(id)
        // error and response are set inside upload-error in core.
        // When we subscribe to upload-error it is emitted before
        // these properties are set in core. Ideally we'd have an internal
        // emitter which calls an external one but it is what it is.
        delete newFile.error
        delete newFile.response
        // This is still useful to test because other properties
        // might have changed in the meantime
        expect(file).toEqual(newFile)
        expect(response).toBeInstanceOf(XMLHttpRequest)
        expect(error.message).toEqual('Oh no')
      }),
    ])

    expect(shouldRetry).toHaveBeenCalledTimes(1)
  })

  describe('headers', () => {
    it('can be a function', async () => {
      const scope = nock('https://fake-endpoint.uppy.io').defaultReplyHeaders({
        'access-control-allow-method': 'POST',
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'x-sample-header',
      })
      scope.options('/').reply(200, {})
      scope.post('/').matchHeader('x-sample-header', 'test.jpg').reply(200, {})

      const core = new Core()
      core.use(XHRUpload, {
        id: 'XHRUpload',
        endpoint: 'https://fake-endpoint.uppy.io',
        headers: (file) => ({
          'x-sample-header': file.name!,
        }),
      })
      core.addFile({
        type: 'image/png',
        source: 'test',
        name: 'test.jpg',
        data: new Blob([new Uint8Array(8192)]),
      })

      await core.upload()

      expect(scope.isDone()).toBe(true)
    })
  })
})
