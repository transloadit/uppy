import Core, { type UppyEventMap } from '@uppy/core'
import XHRUpload from '@uppy/xhr-upload'
import { HttpResponse, http } from 'msw'
import { describe, expect, vi } from 'vitest'
import { it } from './test-extend.js'

const corsHeaders = { 'access-control-allow-origin': '*' }

describe('XHRUpload', () => {
  it('should leverage hooks from fetcher', async ({ worker }) => {
    let postCount = 0
    worker.use(
      http.post('https://fake-endpoint.uppy.io/', () => {
        postCount += 1
        // First attempt fails (triggers a retry), second succeeds.
        if (postCount === 1) {
          return new HttpResponse(null, { status: 401, headers: corsHeaders })
        }
        return new HttpResponse('https://fake-endpoint.uppy.io/random-id', {
          status: 200,
          headers: corsHeaders,
        })
      }),
    )

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

  it('should send response object over upload-error event', async ({
    worker,
  }) => {
    worker.use(
      http.post('https://fake-endpoint.uppy.io/', () =>
        HttpResponse.json(
          { status: 400, message: 'Oh no' },
          { status: 400, headers: corsHeaders },
        ),
      ),
    )

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
    it('can be a function', async ({ worker }) => {
      let postCount = 0
      let receivedHeader: string | null = null
      worker.use(
        http.post('https://fake-endpoint.uppy.io/', ({ request }) => {
          postCount += 1
          receivedHeader = request.headers.get('x-sample-header')
          return HttpResponse.json({}, { status: 200, headers: corsHeaders })
        }),
      )

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

      expect(postCount).toBe(1)
      expect(receivedHeader).toBe('test.jpg')
    })
  })

  describe('endpoint', () => {
    it('can be a function', async ({ worker }) => {
      let postCount = 0
      worker.use(
        http.post('https://fake-endpoint.uppy.io/upload/test.jpg', () => {
          postCount += 1
          return HttpResponse.json({}, { status: 200, headers: corsHeaders })
        }),
      )

      const core = new Core()
      core.use(XHRUpload, {
        id: 'XHRUpload',
        endpoint: (file) =>
          !Array.isArray(file)
            ? `https://fake-endpoint.uppy.io/upload/${file.name}`
            : '',
        bundle: false,
      })
      core.addFile({
        type: 'image/png',
        source: 'test',
        name: 'test.jpg',
        data: new Blob([new Uint8Array(8192)]),
      })

      await core.upload()

      expect(postCount).toBe(1)
    })

    it('can be a function (bundle)', async ({ worker }) => {
      let postCount = 0
      worker.use(
        http.post(
          'https://fake-endpoint.uppy.io/upload-bundle/test.jpg,test2.jpg',
          () => {
            postCount += 1
            return HttpResponse.json({}, { status: 200, headers: corsHeaders })
          },
        ),
      )

      const core = new Core()
      core.use(XHRUpload, {
        id: 'XHRUpload',
        endpoint: (file) =>
          Array.isArray(file)
            ? `https://fake-endpoint.uppy.io/upload-bundle/${file.map((f) => f.name).join(',')}`
            : '',
        bundle: true,
      })
      core.addFile({
        type: 'image/png',
        source: 'test',
        name: 'test.jpg',
        data: new Blob([new Uint8Array(8192)]),
      })
      core.addFile({
        type: 'image/png',
        source: 'test',
        name: 'test2.jpg',
        data: new Blob([new Uint8Array(8192)]),
      })

      await core.upload()

      expect(postCount).toBe(1)
    })
  })
})
