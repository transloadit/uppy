import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

import 'whatwg-fetch'
import nock from 'nock'
import Core from '@uppy/core'
import AwsS3Multipart from './index.js'

const KB = 1024
const MB = KB * KB

describe('AwsS3Multipart', () => {
  beforeEach(() => nock.disableNetConnect())

  it('Registers AwsS3Multipart upload plugin', () => {
    const core = new Core()
    core.use(AwsS3Multipart)

    const pluginNames = core[Symbol.for('uppy test: getPlugins')]('uploader').map((plugin) => plugin.constructor.name)
    expect(pluginNames).toContain('AwsS3Multipart')
  })

  describe('companionUrl assertion', () => {
    it('Throws an error for main functions if configured without companionUrl', () => {
      const core = new Core()
      core.use(AwsS3Multipart)
      const awsS3Multipart = core.getPlugin('AwsS3Multipart')

      const err = 'Expected a `companionUrl` option'
      const file = {}
      const opts = {}

      expect(() => awsS3Multipart.opts.createMultipartUpload(file)).toThrow(
        err,
      )
      expect(() => awsS3Multipart.opts.listParts(file, opts)).toThrow(err)
      expect(() => awsS3Multipart.opts.completeMultipartUpload(file, opts)).toThrow(err)
      expect(() => awsS3Multipart.opts.abortMultipartUpload(file, opts)).toThrow(err)
      expect(() => awsS3Multipart.opts.prepareUploadParts(file, opts)).toThrow(err)
    })
  })

  describe('without companionUrl (custom main functions)', () => {
    let core
    let awsS3Multipart

    beforeEach(() => {
      core = new Core()
      core.use(AwsS3Multipart, {
        createMultipartUpload: jest.fn(() => {
          return {
            uploadId: '6aeb1980f3fc7ce0b5454d25b71992',
            key: 'test/upload/multitest.dat',
          }
        }),
        completeMultipartUpload: jest.fn(async () => ({ location: 'test' })),
        abortMultipartUpload: jest.fn(),
        prepareUploadParts: jest.fn(async (file, { parts }) => {
          const presignedUrls = {}
          parts.forEach(({ number }) => {
            presignedUrls[
              number
            ] = `https://bucket.s3.us-east-2.amazonaws.com/test/upload/multitest.dat?partNumber=${number}&uploadId=6aeb1980f3fc7ce0b5454d25b71992&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATEST%2F20210729%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210729T014044Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`
          })
          return { presignedUrls, headers: { 1: { 'Content-MD5': 'foo' } } }
        }),
      })
      awsS3Multipart = core.getPlugin('AwsS3Multipart')
    })

    it('Calls the prepareUploadParts function totalChunks / limit times', async () => {
      const scope = nock(
        'https://bucket.s3.us-east-2.amazonaws.com',
      ).defaultReplyHeaders({
        'access-control-allow-headers': '*',
        'access-control-allow-method': 'PUT',
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'ETag, Content-MD5',
      })
      // 6MB file will give us 2 chunks, so there will be 2 PUT and 2 OPTIONS
      // calls to the presigned URL from 1 prepareUploadParts calls
      const fileSize = 5 * MB + 1 * MB

      scope
        .options((uri) => uri.includes('test/upload/multitest.dat?partNumber=1'))
        .reply(function replyFn () {
          expect(this.req.headers['access-control-request-headers']).toEqual('Content-MD5')
          return [200, '']
        })
      scope
        .options((uri) => uri.includes('test/upload/multitest.dat?partNumber=2'))
        .reply(function replyFn () {
          expect(this.req.headers['access-control-request-headers']).toBeUndefined()
          return [200, '']
        })
      scope
        .put((uri) => uri.includes('test/upload/multitest.dat?partNumber=1'))
        .reply(200, '', { ETag: 'test1' })
      scope
        .put((uri) => uri.includes('test/upload/multitest.dat?partNumber=2'))
        .reply(200, '', { ETag: 'test2' })

      core.addFile({
        source: 'jest',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], {
          type: 'application/octet-stream',
        }),
      })

      await core.upload()

      expect(
        awsS3Multipart.opts.prepareUploadParts.mock.calls.length,
      ).toEqual(1)

      scope.done()
    })

    it('Calls prepareUploadParts with a Math.ceil(limit / 2) minimum, instead of one at a time for the remaining chunks after the first limit batch', async () => {
      const scope = nock(
        'https://bucket.s3.us-east-2.amazonaws.com',
      ).defaultReplyHeaders({
        'access-control-allow-headers': '*',
        'access-control-allow-method': 'PUT',
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'ETag',
      })
      // 50MB file will give us 10 chunks, so there will be 10 PUT and 10 OPTIONS
      // calls to the presigned URL from 3 prepareUploadParts calls
      //
      // The first prepareUploadParts call will be for 5 parts, the second
      // will be for 3 parts, the third will be for 2 parts.
      const fileSize = 50 * MB

      scope
        .options((uri) => uri.includes('test/upload/multitest.dat'))
        .reply(200, '')
      scope
        .put((uri) => uri.includes('test/upload/multitest.dat'))
        .reply(200, '', { ETag: 'test' })
      scope.persist()

      core.addFile({
        source: 'jest',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], {
          type: 'application/octet-stream',
        }),
      })

      await core.upload()

      function validatePartData ({ parts }, expected) {
        expect(parts.map((part) => part.number)).toEqual(expected)

        for (const part of parts) {
          expect(part.chunk).toBeDefined()
        }
      }

      expect(awsS3Multipart.opts.prepareUploadParts.mock.calls.length).toEqual(3)

      validatePartData(awsS3Multipart.opts.prepareUploadParts.mock.calls[0][1], [1, 2, 3, 4, 5])
      validatePartData(awsS3Multipart.opts.prepareUploadParts.mock.calls[1][1], [6, 7, 8])
      validatePartData(awsS3Multipart.opts.prepareUploadParts.mock.calls[2][1], [9, 10])

      const completeCall = awsS3Multipart.opts.completeMultipartUpload.mock.calls[0][1]

      expect(completeCall.parts).toEqual([
        { ETag: 'test', PartNumber: 1 },
        { ETag: 'test', PartNumber: 2 },
        { ETag: 'test', PartNumber: 3 },
        { ETag: 'test', PartNumber: 4 },
        { ETag: 'test', PartNumber: 5 },
        { ETag: 'test', PartNumber: 6 },
        { ETag: 'test', PartNumber: 7 },
        { ETag: 'test', PartNumber: 8 },
        { ETag: 'test', PartNumber: 9 },
        { ETag: 'test', PartNumber: 10 },
      ])
    })

    it('Keeps chunks marked as busy through retries until they complete', async () => {
      const scope = nock(
        'https://bucket.s3.us-east-2.amazonaws.com',
      ).defaultReplyHeaders({
        'access-control-allow-headers': '*',
        'access-control-allow-method': 'PUT',
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'ETag',
      })

      const fileSize = 50 * MB

      scope
        .options((uri) => uri.includes('test/upload/multitest.dat'))
        .reply(200, '')
      scope
        .put((uri) => uri.includes('test/upload/multitest.dat') && !uri.includes('partNumber=7'))
        .reply(200, '', { ETag: 'test' })

      // Fail the part 7 upload once, then let it succeed
      let calls = 0
      scope
        .put((uri) => uri.includes('test/upload/multitest.dat') && uri.includes('partNumber=7'))
        .reply(() => (calls++ === 0 ? [500] : [200, '', { ETag: 'test' }]))

      scope.persist()

      // Spy on the busy/done state of the test chunk (part 7, chunk index 6)
      let busySpy
      let doneSpy
      awsS3Multipart.setOptions({
        createMultipartUpload: jest.fn((file) => {
          const multipartUploader = awsS3Multipart.uploaders[file.id]
          const testChunkState = multipartUploader.chunkState[6]
          let busy = false
          let done = false
          busySpy = jest.fn((value) => { busy = value })
          doneSpy = jest.fn((value) => { done = value })
          Object.defineProperty(testChunkState, 'busy', { get: () => busy, set: busySpy })
          Object.defineProperty(testChunkState, 'done', { get: () => done, set: doneSpy })

          return {
            uploadId: '6aeb1980f3fc7ce0b5454d25b71992',
            key: 'test/upload/multitest.dat',
          }
        }),
      })

      core.addFile({
        source: 'jest',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], {
          type: 'application/octet-stream',
        }),
      })

      await core.upload()

      // The chunk should be marked as done once
      expect(doneSpy.mock.calls.length).toEqual(1)
      expect(doneSpy.mock.calls[0][0]).toEqual(true)

      // Any changes that set busy to false should only happen after the chunk has been marked done,
      // otherwise a race condition occurs (see PR #3955)
      const doneCallOrderNumber = doneSpy.mock.invocationCallOrder[0]
      for (const [index, callArgs] of busySpy.mock.calls.entries()) {
        if (callArgs[0] === false) {
          expect(busySpy.mock.invocationCallOrder[index]).toBeGreaterThan(doneCallOrderNumber)
        }
      }

      expect(awsS3Multipart.opts.prepareUploadParts.mock.calls.length).toEqual(3)
    })
  })

  describe('MultipartUploader', () => {
    const createMultipartUpload = jest.fn(() => {
      return {
        uploadId: '6aeb1980f3fc7ce0b5454d25b71992',
        key: 'test/upload/multitest.dat',
      }
    })

    const prepareUploadParts = jest
      .fn(async () => {
        const presignedUrls = {}
        const possiblePartNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

        possiblePartNumbers.forEach((partNumber) => {
          presignedUrls[
            partNumber
          ] = `https://bucket.s3.us-east-2.amazonaws.com/test/upload/multitest.dat?partNumber=${partNumber}&uploadId=6aeb1980f3fc7ce0b5454d25b71992&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATEST%2F20210729%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210729T014044Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`
        })

        return { presignedUrls }
      })

    afterEach(() => jest.clearAllMocks())

    it('retries prepareUploadParts when it fails once', async () => {
      const core = new Core()
        .use(AwsS3Multipart, {
          createMultipartUpload,
          completeMultipartUpload: jest.fn(async () => ({ location: 'test' })),
          // eslint-disable-next-line no-throw-literal
          abortMultipartUpload: jest.fn(() => { throw 'should ignore' }),
          prepareUploadParts:
            prepareUploadParts
              // eslint-disable-next-line prefer-promise-reject-errors
              .mockImplementationOnce(() => Promise.reject({ source: { status: 500 } })),
        })
      const awsS3Multipart = core.getPlugin('AwsS3Multipart')
      const fileSize = 5 * MB + 1 * MB

      core.addFile({
        source: 'jest',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], {
          type: 'application/octet-stream',
        }),
      })

      await core.upload()

      expect(awsS3Multipart.opts.prepareUploadParts.mock.calls.length).toEqual(2)
    })

    it('calls `upload-error` when prepareUploadParts fails after all retries', async () => {
      const core = new Core()
        .use(AwsS3Multipart, {
          retryDelays: [100],
          createMultipartUpload,
          completeMultipartUpload: jest.fn(async () => ({ location: 'test' })),
          abortMultipartUpload: jest.fn(),
          prepareUploadParts: prepareUploadParts
            // eslint-disable-next-line prefer-promise-reject-errors
            .mockImplementation(() => Promise.reject({ source: { status: 500 } })),
        })
      const awsS3Multipart = core.getPlugin('AwsS3Multipart')
      const fileSize = 5 * MB + 1 * MB
      const mock = jest.fn()
      core.on('upload-error', mock)

      core.addFile({
        source: 'jest',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], {
          type: 'application/octet-stream',
        }),
      })

      await expect(core.upload()).rejects.toEqual({ source: { status: 500 } })

      expect(awsS3Multipart.opts.prepareUploadParts.mock.calls.length).toEqual(2)
      expect(mock.mock.calls.length).toEqual(1)
    })
  })

  describe('dynamic companionHeader', () => {
    let core
    let awsS3Multipart
    const oldToken = 'old token'
    const newToken = 'new token'

    beforeEach(() => {
      core = new Core()
      core.use(AwsS3Multipart, {
        companionHeaders: {
          authorization: oldToken,
        },
      })
      awsS3Multipart = core.getPlugin('AwsS3Multipart')
    })

    it('companionHeader is updated before uploading file', async () => {
      awsS3Multipart.setOptions({
        companionHeaders: {
          authorization: newToken,
        },
      })

      await core.upload()

      const client = awsS3Multipart[Symbol.for('uppy test: getClient')]()

      expect(client[Symbol.for('uppy test: getCompanionHeaders')]().authorization).toEqual(newToken)
    })
  })
})
