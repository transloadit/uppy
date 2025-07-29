import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest'

import 'whatwg-fetch'
import Core, { type UppyFile } from '@uppy/core'
import nock from 'nock'
import AwsS3Multipart, {
  type AwsBody,
  type AwsS3MultipartOptions,
} from './index.js'

const KB = 1024
const MB = KB * KB

describe('AwsS3Multipart', () => {
  beforeEach(() => nock.disableNetConnect())

  it('Registers AwsS3Multipart upload plugin', () => {
    const core = new Core().use(AwsS3Multipart)

    // @ts-expect-error private property
    const pluginNames = core[Symbol.for('uppy test: getPlugins')](
      'uploader',
    ).map((plugin: AwsS3Multipart<any, AwsBody>) => plugin.constructor.name)
    expect(pluginNames).toContain('AwsS3Multipart')
  })

  describe('defaultOptions', () => {
    let opts: Partial<AwsS3MultipartOptions<any, any>>

    beforeEach(() => {
      const core = new Core<any, AwsBody>().use(AwsS3Multipart)
      const awsS3Multipart = core.getPlugin('AwsS3Multipart') as any
      opts = awsS3Multipart.opts
    })

    it('allowedMetaFields is true', () => {
      expect(opts.allowedMetaFields).toBe(true)
    })

    it('limit is 6', () => {
      expect(opts.limit).toBe(6)
    })

    it('getTemporarySecurityCredentials is false', () => {
      expect(opts.getTemporarySecurityCredentials).toBe(false)
    })

    describe('shouldUseMultipart', () => {
      const MULTIPART_THRESHOLD = 100 * MB

      let shouldUseMultipart: (file: UppyFile<any, AwsBody>) => boolean

      beforeEach(() => {
        shouldUseMultipart = opts.shouldUseMultipart as (
          file: UppyFile<any, AwsBody>,
        ) => boolean
      })

      const createFile = (size: number): UppyFile<any, any> => ({
        size,
        data: new Blob(),
        extension: '',
        id: '',
        isRemote: false,
        isGhost: false,
        meta: undefined,
        progress: {
          percentage: 0,
          bytesUploaded: 0,
          bytesTotal: size,
          uploadComplete: false,
          uploadStarted: 0,
        },
        type: '',
      })

      it('returns true for files larger than 100MB', () => {
        const file = createFile(MULTIPART_THRESHOLD + 1)
        expect(shouldUseMultipart(file)).toBe(true)
      })

      it('returns false for files exactly 100MB', () => {
        const file = createFile(MULTIPART_THRESHOLD)
        expect(shouldUseMultipart(file)).toBe(false)
      })

      it('returns false for files smaller than 100MB', () => {
        const file = createFile(MULTIPART_THRESHOLD - 1)
        expect(shouldUseMultipart(file)).toBe(false)
      })

      it('returns true for large files (~70GB)', () => {
        const file = createFile(70 * 1024 * MB)
        expect(shouldUseMultipart(file)).toBe(true)
      })

      it('returns true for very large files (~400GB)', () => {
        const file = createFile(400 * 1024 * MB)
        expect(shouldUseMultipart(file)).toBe(true)
      })

      it('returns false for files with size 0', () => {
        const file = createFile(0)
        expect(shouldUseMultipart(file)).toBe(false)
      })
    })

    it('retryDelays is [0, 1000, 3000, 5000]', () => {
      expect(opts.retryDelays).toEqual([0, 1000, 3000, 5000])
    })
  })

  describe('companionUrl assertion', () => {
    it('Throws an error for main functions if configured without companionUrl', () => {
      const core = new Core().use(AwsS3Multipart)
      const awsS3Multipart = core.getPlugin('AwsS3Multipart')!

      const err = 'Expected a `endpoint` option'
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
      const core = new Core().use(AwsS3Multipart, {
        shouldUseMultipart: false,
        limit: 0,
        getUploadParameters: () => ({
          method: 'POST',
          url: 'https://bucket.s3.us-east-2.amazonaws.com/',
          fields: {
            key: 'file',
            bucket: 'https://bucket.s3.us-east-2.amazonaws.com/',
          },
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
          etag: 'test',
          location: 'http://example.com',
          key: 'file',
          bucket: 'https://bucket.s3.us-east-2.amazonaws.com/',
        },
        status: 200,
        uploadURL: 'http://example.com',
      })

      scope.done()
    })
  })

  describe('without companionUrl (custom main functions)', () => {
    let core: Core<any, AwsBody>
    let awsS3Multipart: AwsS3Multipart<any, AwsBody>

    beforeEach(() => {
      core = new Core<any, AwsBody>()
      core.use(AwsS3Multipart, {
        shouldUseMultipart: true,
        limit: 0,
        createMultipartUpload: vi.fn(() => {
          return {
            uploadId: '6aeb1980f3fc7ce0b5454d25b71992',
            key: 'test/upload/multitest.dat',
          }
        }),
        completeMultipartUpload: vi.fn(async () => ({ location: 'test' })),
        abortMultipartUpload: vi.fn(),
        signPart: vi.fn(async (file, { number }) => {
          return {
            url: `https://bucket.s3.us-east-2.amazonaws.com/test/upload/multitest.dat?partNumber=${number}&uploadId=6aeb1980f3fc7ce0b5454d25b71992&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATEST%2F20210729%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210729T014044Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`,
            headers: number === 1 ? { 'Content-MD5': 'foo' } : undefined,
          }
        }),
        listParts: undefined as any,
      })
      awsS3Multipart = core.getPlugin('AwsS3Multipart') as any
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
      let busySpy: Mock
      let doneSpy: Mock
      awsS3Multipart.setOptions({
        shouldUseMultipart: true,
        retryDelays: [10],
        createMultipartUpload: vi.fn((file) => {
          // @ts-expect-error protected property
          const multipartUploader = awsS3Multipart.uploaders[file.id]!
          const testChunkState =
            // @ts-expect-error private method
            multipartUploader[Symbol.for('uppy test: getChunkState')]()[6]
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

      expect((awsS3Multipart.opts as any).signPart.mock.calls.length).toEqual(
        10,
      )
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
        url: `https://bucket.s3.us-east-2.amazonaws.com/test/upload/${file.name}?partNumber=${partNumber}&uploadId=6aeb1980f3fc7ce0b5454d25b71992&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATEST%2F20210729%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210729T014044Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`,
      }
    })

    const uploadPartBytes = vi.fn()

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('retries uploadPartBytes when it fails once', async () => {
      const core = new Core().use(AwsS3Multipart, {
        shouldUseMultipart: true,
        createMultipartUpload,
        completeMultipartUpload: vi.fn(async () => ({ location: 'test' })),
        abortMultipartUpload: vi.fn(() => {
          throw 'should ignore'
        }),
        signPart,
        uploadPartBytes: uploadPartBytes.mockImplementationOnce(() =>
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
      const core = new Core().use(AwsS3Multipart, {
        shouldUseMultipart: true,
        retryDelays: [10],
        createMultipartUpload: vi.fn((file) => ({
          uploadId: '6aeb1980f3fc7ce0b5454d25b71992',
          key: `test/upload/${file.name}`,
        })),
        completeMultipartUpload: vi.fn(async () => ({ location: 'test' })),
        abortMultipartUpload: vi.fn(),
        signPart,
        uploadPartBytes: uploadPartBytes.mockImplementation((options) => {
          if (options.signature.url.includes('succeed.dat')) {
            return new Promise((resolve) => {
              // delay until after multitest.dat has failed.
              setTimeout(() => resolve({ status: 200 }), 100)
            })
          }
          return Promise.reject({ source: { status: 500 } })
        }),
        listParts: undefined as any,
      })
      const fileSize = 5 * MB + 1 * MB
      const awsS3Multipart = core.getPlugin('AwsS3Multipart')!
      const uploadErrorMock = vi.fn()
      const uploadSuccessMock = vi.fn()
      core.on('upload-error', uploadErrorMock)
      core.on('upload-success', uploadSuccessMock)

      core.addFile({
        source: 'vi',
        name: 'fail.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], '', {
          type: 'application/octet-stream',
        }),
      })

      core.addFile({
        source: 'vi',
        name: 'succeed.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(fileSize)], '', {
          type: 'application/octet-stream',
        }),
      })

      try {
        const results = await core.upload()
        expect(results!.successful!.length).toEqual(1)
        expect(results!.failed!.length).toEqual(1)
      } catch {
        // Catch Promise.all reject
      }

      expect(awsS3Multipart.opts.uploadPartBytes.mock.calls.length).toEqual(5)
      expect(uploadErrorMock.mock.calls.length).toEqual(1)
      expect(uploadSuccessMock.mock.calls.length).toEqual(1) // This fails for me becuase upload returned early.
    })

    it('retries signPart when it fails', async () => {
      // The retry logic for signPart happens in the uploadChunk method of HTTPCommunicationQueue
      // For a 6MB file, we expect 2 parts, so signPart should be called for each part
      let callCount = 0
      const signPartWithRetry = vi.fn((file, { partNumber }) => {
        callCount++
        if (callCount === 1) {
          // First call fails with a retryable error
          throw { source: { status: 500 } }
        }
        return {
          url: `https://bucket.s3.us-east-2.amazonaws.com/test/upload/multitest.dat?partNumber=${partNumber}&uploadId=6aeb1980f3fc7ce0b5454d25b71992`,
        }
      })

      const core = new Core().use(AwsS3Multipart, {
        shouldUseMultipart: true,
        retryDelays: [10],
        createMultipartUpload: vi.fn(() => ({
          uploadId: '6aeb1980f3fc7ce0b5454d25b71992',
          key: 'test/upload/multitest.dat',
        })),
        completeMultipartUpload: vi.fn(async () => ({ location: 'test' })),
        abortMultipartUpload: vi.fn(),
        signPart: signPartWithRetry,
        uploadPartBytes: vi.fn().mockResolvedValue({ status: 200 }),
        listParts: undefined as any,
      })
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

      // Should be called 3 times: 1 failed + 1 retry + 1 for second part
      expect(signPartWithRetry).toHaveBeenCalledTimes(3)
    })
  })

  describe('dynamic companionHeader', () => {
    let core: Core<any, any>
    let awsS3Multipart: AwsS3Multipart<any, any>
    const oldToken = 'old token'
    const newToken = 'new token'

    beforeEach(() => {
      core = new Core()
      core.use(AwsS3Multipart, {
        endpoint: '',
        headers: {
          authorization: oldToken,
        },
      })
      awsS3Multipart = core.getPlugin('AwsS3Multipart') as any
    })

    it('companionHeader is updated before uploading file', async () => {
      awsS3Multipart.setOptions({
        endpoint: 'http://localhost',
        headers: {
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
    let core: Core<any, AwsBody>
    let awsS3Multipart: AwsS3Multipart<any, AwsBody>
    const newToken = 'new token'

    it('companionHeader is updated before uploading file', async () => {
      core = new Core()
      core.use(AwsS3Multipart)
      /* Set up preprocessor */
      core.addPreProcessor(() => {
        awsS3Multipart =
          core.getPlugin<AwsS3Multipart<any, AwsBody>>('AwsS3Multipart')!
        awsS3Multipart.setOptions({
          endpoint: 'http://localhost',
          headers: {
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
    let core: Core
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
      core = new Core().use(AwsS3Multipart, {
        shouldUseMultipart: true,
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
      expect(signPart).toHaveBeenCalledTimes(11)
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

      core = new Core().use(AwsS3Multipart, {
        shouldUseMultipart: true,
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

      core = new Core().use(AwsS3Multipart, {
        shouldUseMultipart: true,
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
