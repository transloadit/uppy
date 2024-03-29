import { vi, describe, it, expect } from 'vitest'
import nock from 'nock'
import Core from '@uppy/core'
import XHRUpload from './index.ts'

describe('XHRUpload', () => {
  describe('getResponseData', () => {
    it('has the XHRUpload options as its `this`', () => {
      nock('https://fake-endpoint.uppy.io')
        .defaultReplyHeaders({
          'access-control-allow-method': 'POST',
          'access-control-allow-origin': '*',
        })
        .options('/')
        .reply(200, {})
        .post('/')
        .reply(200, {})

      const core = new Core()
      const getResponseData = vi.fn(function getResponseData() {
        // @ts-expect-error TS can't know the type
        expect(this.some).toEqual('option')
        return {}
      })
      core.use(XHRUpload, {
        id: 'XHRUpload',
        endpoint: 'https://fake-endpoint.uppy.io',
        // @ts-expect-error that option does not exist
        some: 'option',
        getResponseData,
      })
      core.addFile({
        type: 'image/png',
        source: 'test',
        name: 'test.jpg',
        data: new Blob([new Uint8Array(8192)]),
      })

      return core.upload().then(() => {
        expect(getResponseData).toHaveBeenCalled()
      })
    })
  })

  describe('validateStatus', () => {
    it('emit upload error under status code 200', () => {
      nock('https://fake-endpoint.uppy.io')
        .defaultReplyHeaders({
          'access-control-allow-method': 'POST',
          'access-control-allow-origin': '*',
        })
        .options('/')
        .reply(200, {})
        .post('/')
        .reply(200, {
          code: 40000,
          message: 'custom upload error',
        })

      const core = new Core()
      const validateStatus = vi.fn((status, responseText) => {
        return JSON.parse(responseText).code !== 40000
      })

      core.use(XHRUpload, {
        id: 'XHRUpload',
        endpoint: 'https://fake-endpoint.uppy.io',
        // @ts-expect-error that option doesn't exist
        some: 'option',
        validateStatus,
        getResponseError(responseText) {
          return JSON.parse(responseText).message
        },
      })
      core.addFile({
        type: 'image/png',
        source: 'test',
        name: 'test.jpg',
        data: new Blob([new Uint8Array(8192)]),
      })

      return core.upload().then((result) => {
        expect(validateStatus).toHaveBeenCalled()
        expect(result!.failed!.length).toBeGreaterThan(0)
        result!.failed!.forEach((file) => {
          expect(file.error).toEqual('custom upload error')
        })
      })
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
