import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import 'whatwg-fetch'
import nock from 'nock'
import Core from '@uppy/core'
import AwsS3Multipart from './index.ts'
import type { Body } from './utils.ts'

const KB = 1024
const MB = KB * KB

describe('AwsS3Multipart', () => {
  beforeEach(() => nock.disableNetConnect())

  it('Registers AwsS3Multipart upload plugin', () => {
    const core = new Core<any, Body>()
    core.use(AwsS3Multipart)

    // @ts-expect-error private property
    const pluginNames = core[Symbol.for('uppy test: getPlugins')](
      'uploader',
    ).map((plugin: AwsS3Multipart<any, Body>) => plugin.constructor.name)
    expect(pluginNames).toContain('AwsS3Multipart')
  })

  describe('companionUrl assertion', () => {
    it('Throws an error for main functions if configured without companionUrl', () => {
      const core = new Core<any, Body>()
      core.use(AwsS3Multipart)
      const awsS3Multipart = core.getPlugin('AwsS3Multipart')!

      const err = 'Expected a `companionUrl` option'
      const file = {}
      const opts = {}

      expect(() => awsS3Multipart.opts.createMultipartUpload(file)).toThrow(err)
      expect(() => awsS3Multipart.opts.listParts(file, opts)).toThrow(err)
      expect(() =>
        awsS3Multipart.opts.completeMultipartUpload(file, opts),
      ).toThrow(err)
      expect(() =>
        awsS3Multipart.opts.abortMultipartUpload(file, opts),
      ).toThrow(err)
      expect(() => awsS3Multipart.opts.signPart(file, opts)).toThrow(err)
    })
  })

  describe('non-multipart upload', () => {
    it('should handle POST uploads', async () => {
      const core = new Core<any, Body>()
      core.use(AwsS3Multipart, {
        shouldUseMultipart: false,
        limit: 0,
        getUploadParameters: () => ({
          method: 'POST',
          url: 'https://bucket.s3.us-east-2.amazonaws.com/',
          fields: {},
        }),
      })
      const scope = nock(
        'https://bucket.s3.us-east-2.amazonaws.com',
      ).defaultReplyHeaders({
        'access-control-allow-headers': '*',
        'access-control-allow-method': 'POST',
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'ETag, Location',
      })

      scope.options('/').reply(204, '')
      scope
        .post('/')
        .reply(201, '', { ETag: 'test', Location: 'http://example.com' })

      const fileSize = 1

      core.addFile({
        source: 'vi',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], '', {
          type: 'application/octet-stream',
        }),
      })

      const uploadSuccessHandler = vi.fn()
      core.on('upload-success', uploadSuccessHandler)

      await core.upload()

      expect(uploadSuccessHandler.mock.calls).toHaveLength(1)
      expect(uploadSuccessHandler.mock.calls[0][1]).toStrictEqual({
        body: {
          ETag: 'test',
          location: 'http://example.com',
        },
        status: 200,
        uploadURL: 'http://example.com',
      })

      scope.done()
    })
  })

  describe('without companionUrl (custom main functions)', () => {
    let core: Core<any, Body>
    let awsS3Multipart: AwsS3Multipart<any, Body>

    beforeEach(() => {
      core = new Core<any, Body>()
      core.use(AwsS3Multipart, {
        limit: 0,
        createMultipartUpload: vi.fn(() => {
          return {
            uploadId: '6aeb1980f3fc7ce0b5454d25b71992',
            key: 'test/upload/multitest.dat',
          }
        }),
        completeMultipartUpload: vi.fn(async () => ({ location: 'test' })),
        abortMultipartUpload: vi.fn(),
        prepareUploadParts: vi.fn(
          async (file, { parts }: { parts: { number: number }[] }) => {
            const presignedUrls: Record<number, string> = {}
            parts.forEach(({ number }) => {
              presignedUrls[number] =
                `https://bucket.s3.us-east-2.amazonaws.com/test/upload/multitest.dat?partNumber=${number}&uploadId=6aeb1980f3fc7ce0b5454d25b71992&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATEST%2F20210729%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210729T014044Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`
            })
            return { presignedUrls, headers: { 1: { 'Content-MD5': 'foo' } } }
          },
        ),
        listParts: undefined as any,
      })
      awsS3Multipart = core.getPlugin('AwsS3Multipart') as any
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
        .options((uri) =>
          uri.includes('test/upload/multitest.dat?partNumber=1'),
        )
        .reply(function replyFn() {
          expect(this.req.headers['access-control-request-headers']).toEqual(
            'Content-MD5',
          )
          return [200, '']
        })
      scope
        .options((uri) =>
          uri.includes('test/upload/multitest.dat?partNumber=2'),
        )
        .reply(function replyFn() {
          expect(
            this.req.headers['access-control-request-headers'],
          ).toBeUndefined()
          return [200, '']
        })
      scope
        .put((uri) => uri.includes('test/upload/multitest.dat?partNumber=1'))
        .reply(200, '', { ETag: 'test1' })
      scope
        .put((uri) => uri.includes('test/upload/multitest.dat?partNumber=2'))
        .reply(200, '', { ETag: 'test2' })

      core.addFile({
        source: 'vi',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], '', {
          type: 'application/octet-stream',
        }),
      })

      await core.upload()

      expect(
        (awsS3Multipart.opts as any).prepareUploadParts.mock.calls.length,
      ).toEqual(2)

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
        source: 'vi',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], '', {
          type: 'application/octet-stream',
        }),
      })

      await core.upload()

      function validatePartData(
        { parts }: { parts: { number: number; chunk: unknown }[] },
        expected: number[],
      ) {
        expect(parts.map((part) => part.number)).toEqual(expected)

        for (const part of parts) {
          expect(part.chunk).toBeDefined()
        }
      }

      expect(
        (awsS3Multipart.opts as any).prepareUploadParts.mock.calls.length,
      ).toEqual(10)

      validatePartData(
        (awsS3Multipart.opts as any).prepareUploadParts.mock.calls[0][1],
        [1],
      )
      validatePartData(
        (awsS3Multipart.opts as any).prepareUploadParts.mock.calls[1][1],
        [2],
      )
      validatePartData(
        (awsS3Multipart.opts as any).prepareUploadParts.mock.calls[2][1],
        [3],
      )

      const completeCall = (awsS3Multipart.opts as any).completeMultipartUpload
        .mock.calls[0][1]

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
        .put(
          (uri) =>
            uri.includes('test/upload/multitest.dat') &&
            !uri.includes('partNumber=7'),
        )
        .reply(200, '', { ETag: 'test' })

      // Fail the part 7 upload once, then let it succeed
      let calls = 0
      scope
        .put(
          (uri) =>
            uri.includes('test/upload/multitest.dat') &&
            uri.includes('partNumber=7'),
        )
        .reply(() => (calls++ === 0 ? [500] : [200, '', { ETag: 'test' }]))

      scope.persist()

      // Spy on the busy/done state of the test chunk (part 7, chunk index 6)
      let busySpy
      let doneSpy
      awsS3Multipart.setOptions({
        retryDelays: [10],
        createMultipartUpload: vi.fn((file) => {
          // @ts-expect-error protected property
          const multipartUploader = awsS3Multipart.uploaders[file.id]!
          const testChunkState = multipartUploader.chunkState[6]
          let busy = false
          let done = false
          busySpy = vi.fn((value) => {
            busy = value
          })
          doneSpy = vi.fn((value) => {
            done = value
          })
          Object.defineProperty(testChunkState, 'busy', {
            get: () => busy,
            set: busySpy,
          })
          Object.defineProperty(testChunkState, 'done', {
            get: () => done,
            set: doneSpy,
          })

          return {
            uploadId: '6aeb1980f3fc7ce0b5454d25b71992',
            key: 'test/upload/multitest.dat',
          }
        }),
      })

      core.addFile({
        source: 'vi',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], '', {
          type: 'application/octet-stream',
        }),
      })

      await core.upload()

      // The chunk should be marked as done once
      expect(doneSpy!.mock.calls.length).toEqual(1)
      expect(doneSpy!.mock.calls[0][0]).toEqual(true)

      // Any changes that set busy to false should only happen after the chunk has been marked done,
      // otherwise a race condition occurs (see PR #3955)
      const doneCallOrderNumber = doneSpy!.mock.invocationCallOrder[0]
      for (const [index, callArgs] of busySpy!.mock.calls.entries()) {
        if (callArgs[0] === false) {
          expect(busySpy!.mock.invocationCallOrder[index]).toBeGreaterThan(
            doneCallOrderNumber,
          )
        }
      }

      expect(
        (awsS3Multipart.opts as any).prepareUploadParts.mock.calls.length,
      ).toEqual(10)
    })
  })

  describe('MultipartUploader', () => {
    const createMultipartUpload = vi.fn(() => {
      return {
        uploadId: '6aeb1980f3fc7ce0b5454d25b71992',
        key: 'test/upload/multitest.dat',
      }
    })

    const signPart = vi.fn(async (file, { partNumber }) => {
      return {
        url: `https://bucket.s3.us-east-2.amazonaws.com/test/upload/multitest.dat?partNumber=${partNumber}&uploadId=6aeb1980f3fc7ce0b5454d25b71992&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATEST%2F20210729%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210729T014044Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`,
      }
    })

    const uploadPartBytes = vi.fn()

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('retries uploadPartBytes when it fails once', async () => {
      const core = new Core<any, Body>().use(AwsS3Multipart, {
        createMultipartUpload,
        completeMultipartUpload: vi.fn(async () => ({ location: 'test' })),
        abortMultipartUpload: vi.fn(() => {
          // eslint-disable-next-line no-throw-literal
          throw 'should ignore'
        }),
        signPart,
        uploadPartBytes: uploadPartBytes.mockImplementationOnce(() =>
          // eslint-disable-next-line prefer-promise-reject-errors
          Promise.reject({ source: { status: 500 } }),
        ),
        listParts: undefined as any,
      })
      const awsS3Multipart = core.getPlugin('AwsS3Multipart')!
      const fileSize = 5 * MB + 1 * MB

      core.addFile({
        source: 'vi',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], '', {
          type: 'application/octet-stream',
        }),
      })

      await core.upload()

      expect(awsS3Multipart.opts.uploadPartBytes.mock.calls.length).toEqual(3)
    })

    it('calls `upload-error` when uploadPartBytes fails after all retries', async () => {
      const core = new Core<any, Body>().use(AwsS3Multipart, {
        retryDelays: [10],
        createMultipartUpload,
        completeMultipartUpload: vi.fn(async () => ({ location: 'test' })),
        abortMultipartUpload: vi.fn(),
        signPart,
        uploadPartBytes: uploadPartBytes.mockImplementation(() =>
          // eslint-disable-next-line prefer-promise-reject-errors
          Promise.reject({ source: { status: 500 } }),
        ),
        listParts: undefined as any,
      })
      const awsS3Multipart = core.getPlugin('AwsS3Multipart')!
      const fileSize = 5 * MB + 1 * MB
      const mock = vi.fn()
      core.on('upload-error', mock)

      core.addFile({
        source: 'vi',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], '', {
          type: 'application/octet-stream',
        }),
      })

      await expect(core.upload()).rejects.toEqual({ source: { status: 500 } })

      expect(awsS3Multipart.opts.uploadPartBytes.mock.calls.length).toEqual(3)
      expect(mock.mock.calls.length).toEqual(1)
    })
  })

  describe('dynamic companionHeader', () => {
    let core: Core<any, any>
    let awsS3Multipart: AwsS3Multipart<any, any>
    const oldToken = 'old token'
    const newToken = 'new token'

    beforeEach(() => {
      core = new Core<any, Body>()
      core.use(AwsS3Multipart, {
        companionUrl: '',
        companionHeaders: {
          authorization: oldToken,
        },
      })
      awsS3Multipart = core.getPlugin('AwsS3Multipart') as any
    })

    it('companionHeader is updated before uploading file', async () => {
      awsS3Multipart.setOptions({
        companionHeaders: {
          authorization: newToken,
        },
      })

      await core.upload()

      // @ts-expect-error private property
      const client = awsS3Multipart[Symbol.for('uppy test: getClient')]()

      expect(
        client[Symbol.for('uppy test: getCompanionHeaders')]().authorization,
      ).toEqual(newToken)
    })
  })

  describe('dynamic companionHeader using setOption', () => {
    let core: Core<any, Body>
    let awsS3Multipart: AwsS3Multipart<any, Body>
    const newToken = 'new token'

    it('companionHeader is updated before uploading file', async () => {
      core = new Core<any, Body>()
      core.use(AwsS3Multipart)
      /* Set up preprocessor */
      core.addPreProcessor(() => {
        awsS3Multipart = core.getPlugin('AwsS3Multipart') as AwsS3Multipart<
          any,
          Body
        >
        awsS3Multipart.setOptions({
          companionHeaders: {
            authorization: newToken,
          },
        })
      })

      await core.upload()

      // @ts-expect-error private property
      const client = awsS3Multipart[Symbol.for('uppy test: getClient')]()

      expect(
        client[Symbol.for('uppy test: getCompanionHeaders')]().authorization,
      ).toEqual(newToken)
    })
  })

  describe('file metadata across custom main functions', () => {
    let core: Core<any, Body>
    const createMultipartUpload = vi.fn((file) => {
      core.setFileMeta(file.id, {
        ...file.meta,
        createMultipartUpload: true,
      })

      return {
        uploadId: 'upload1234',
        key: file.name,
      }
    })

    const signPart = vi.fn((file, partData) => {
      expect(file.meta.createMultipartUpload).toBe(true)

      core.setFileMeta(file.id, {
        ...file.meta,
        signPart: true,
        [`part${partData.partNumber}`]: partData.partNumber,
      })

      return {
        url: `https://bucket.s3.us-east-2.amazonaws.com/test/upload/multitest.dat?partNumber=${partData.partNumber}&uploadId=6aeb1980f3fc7ce0b5454d25b71992&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATEST%2F20210729%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210729T014044Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`,
      }
    })

    const listParts = vi.fn((file) => {
      expect(file.meta.createMultipartUpload).toBe(true)
      core.setFileMeta(file.id, {
        ...file.meta,
        listParts: true,
      })

      const partKeys = Object.keys(file.meta).filter((metaKey) =>
        metaKey.startsWith('part'),
      )
      return partKeys.map((metaKey) => ({
        PartNumber: file.meta[metaKey],
        ETag: metaKey,
        Size: 5 * MB,
      }))
    })

    const completeMultipartUpload = vi.fn((file) => {
      expect(file.meta.createMultipartUpload).toBe(true)
      expect(file.meta.signPart).toBe(true)
      for (let i = 1; i <= 10; i++) {
        expect(file.meta[`part${i}`]).toBe(i)
      }
      return {}
    })

    const abortMultipartUpload = vi.fn((file) => {
      expect(file.meta.createMultipartUpload).toBe(true)
      expect(file.meta.signPart).toBe(true)
      expect(file.meta.abortingPart).toBe(5)
    })

    beforeEach(() => {
      createMultipartUpload.mockClear()
      signPart.mockClear()
      listParts.mockClear()
      abortMultipartUpload.mockClear()
      completeMultipartUpload.mockClear()
    })

    it('preserves file metadata if upload is completed', async () => {
      core = new Core<any, Body>().use(AwsS3Multipart, {
        createMultipartUpload,
        signPart,
        listParts,
        completeMultipartUpload,
        abortMultipartUpload,
      })

      nock('https://bucket.s3.us-east-2.amazonaws.com')
        .defaultReplyHeaders({
          'access-control-allow-headers': '*',
          'access-control-allow-method': 'PUT',
          'access-control-allow-origin': '*',
          'access-control-expose-headers': 'ETag',
        })
        .put((uri) => uri.includes('test/upload/multitest.dat'))
        .reply(200, '', { ETag: 'test' })
        .persist()

      const fileSize = 50 * MB
      core.addFile({
        source: 'vi',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], '', {
          type: 'application/octet-stream',
        }),
      })

      await core.upload()
      expect(createMultipartUpload).toHaveBeenCalled()
      expect(signPart).toHaveBeenCalledTimes(10)
      expect(completeMultipartUpload).toHaveBeenCalled()
    })

    it('preserves file metadata if upload is aborted', async () => {
      const signPartWithAbort = vi.fn((file, partData) => {
        expect(file.meta.createMultipartUpload).toBe(true)
        if (partData.partNumber === 5) {
          core.setFileMeta(file.id, {
            ...file.meta,
            abortingPart: partData.partNumber,
          })
          core.removeFile(file.id)
          return {
            url: undefined as any as string,
          }
        }

        core.setFileMeta(file.id, {
          ...file.meta,
          signPart: true,
          [`part${partData.partNumber}`]: partData.partNumber,
        })

        return {
          url: `https://bucket.s3.us-east-2.amazonaws.com/test/upload/multitest.dat?partNumber=${partData.partNumber}&uploadId=6aeb1980f3fc7ce0b5454d25b71992&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATEST%2F20210729%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210729T014044Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`,
        }
      })

      core = new Core<any, Body>().use(AwsS3Multipart, {
        createMultipartUpload,
        signPart: signPartWithAbort,
        listParts,
        completeMultipartUpload,
        abortMultipartUpload,
      })

      nock('https://bucket.s3.us-east-2.amazonaws.com')
        .defaultReplyHeaders({
          'access-control-allow-headers': '*',
          'access-control-allow-method': 'PUT',
          'access-control-allow-origin': '*',
          'access-control-expose-headers': 'ETag',
        })
        .put((uri) => uri.includes('test/upload/multitest.dat'))
        .reply(200, '', { ETag: 'test' })
        .persist()

      const fileSize = 50 * MB
      core.addFile({
        source: 'vi',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], '', {
          type: 'application/octet-stream',
        }),
      })

      await core.upload()
      expect(createMultipartUpload).toHaveBeenCalled()
      expect(signPartWithAbort).toHaveBeenCalled()
      expect(abortMultipartUpload).toHaveBeenCalled()
    })

    it('preserves file metadata if upload is paused and resumed', async () => {
      const completeMultipartUploadAfterPause = vi.fn((file) => {
        expect(file.meta.createMultipartUpload).toBe(true)
        expect(file.meta.signPart).toBe(true)
        for (let i = 1; i <= 10; i++) {
          expect(file.meta[`part${i}`]).toBe(i)
        }

        expect(file.meta.listParts).toBe(true)
        return {}
      })

      const signPartWithPause = vi.fn((file, partData) => {
        expect(file.meta.createMultipartUpload).toBe(true)
        if (partData.partNumber === 3) {
          core.setFileMeta(file.id, {
            ...file.meta,
            abortingPart: partData.partNumber,
          })
          core.pauseResume(file.id)
          setTimeout(() => core.pauseResume(file.id), 500)
        }

        core.setFileMeta(file.id, {
          ...file.meta,
          signPart: true,
          [`part${partData.partNumber}`]: partData.partNumber,
        })

        return {
          url: `https://bucket.s3.us-east-2.amazonaws.com/test/upload/multitest.dat?partNumber=${partData.partNumber}&uploadId=6aeb1980f3fc7ce0b5454d25b71992&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATEST%2F20210729%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210729T014044Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`,
        }
      })

      core = new Core<any, Body>().use(AwsS3Multipart, {
        createMultipartUpload,
        signPart: signPartWithPause,
        listParts,
        completeMultipartUpload: completeMultipartUploadAfterPause,
        abortMultipartUpload,
      })

      nock('https://bucket.s3.us-east-2.amazonaws.com')
        .defaultReplyHeaders({
          'access-control-allow-headers': '*',
          'access-control-allow-method': 'PUT',
          'access-control-allow-origin': '*',
          'access-control-expose-headers': 'ETag',
        })
        .put((uri) => uri.includes('test/upload/multitest.dat'))
        .reply(200, '', { ETag: 'test' })
        .persist()

      const fileSize = 50 * MB
      core.addFile({
        source: 'vi',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], '', {
          type: 'application/octet-stream',
        }),
      })

      await core.upload()
      expect(createMultipartUpload).toHaveBeenCalled()
      expect(signPartWithPause).toHaveBeenCalled()
      expect(listParts).toHaveBeenCalled()
      expect(completeMultipartUploadAfterPause).toHaveBeenCalled()
    })
  })
})
