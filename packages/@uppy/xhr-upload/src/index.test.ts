import { vi, describe, it, expect } from 'vitest'
import nock from 'nock'
import Core from '@uppy/core'
import XHRUpload from './index.ts'

describe('XHRUpload', () => {
  it('should leverage hooks from fetcher', () => {
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
      .reply(200, {})

    const core = new Core()
    const shouldRetry = vi.fn(() => true)
    const onBeforeRequest = vi.fn(() => {})
    const onAfterResponse = vi.fn(() => {})

    core.use(XHRUpload, {
      id: 'XHRUpload',
      endpoint: 'https://fake-endpoint.uppy.io',
      shouldRetry,
      onBeforeRequest,
      onAfterResponse,
    })
    core.addFile({
      type: 'image/png',
      source: 'test',
      name: 'test.jpg',
      data: new Blob([new Uint8Array(8192)]),
    })

    return core.upload().then(() => {
      expect(shouldRetry).toHaveBeenCalledTimes(1)
      expect(onAfterResponse).toHaveBeenCalledTimes(2)
      expect(onBeforeRequest).toHaveBeenCalledTimes(2)
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
          'x-sample-header': file.name,
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
