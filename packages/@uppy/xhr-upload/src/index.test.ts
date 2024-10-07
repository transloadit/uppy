import { vi, describe, it, expect } from 'vitest'
import nock from 'nock'
import Core from '@uppy/core'
import XHRUpload from './index.ts'

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
