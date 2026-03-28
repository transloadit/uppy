import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import 'whatwg-fetch'
import Core, { type Meta, type UppyFile } from '@uppy/core'
import AwsS3, { type AwsBody, type AwsS3Options } from '../src/index.js'

const KB = 1024
const MB = KB * KB

// ---------------------------------------------------------------------------
// Helpers for multipart upload tests
// ---------------------------------------------------------------------------

/** Minimal XML responses that S3 returns for multipart operations */
const s3Responses = {
  createMultipart: (uploadId: string, key: string) =>
    `<?xml version="1.0" encoding="UTF-8"?>
     <InitiateMultipartUploadResult>
       <UploadId>${uploadId}</UploadId>
       <Key>${key}</Key>
     </InitiateMultipartUploadResult>`,

  uploadPart: (etag: string) => '',

  listParts: (parts: { partNumber: number; etag: string }[]) =>
    `<?xml version="1.0" encoding="UTF-8"?>
     <ListPartsResult>
       ${parts.map((p) => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`).join('')}
     </ListPartsResult>`,

  completeMultipart: (location: string, key: string) =>
    `<?xml version="1.0" encoding="UTF-8"?>
     <CompleteMultipartUploadResult>
       <Location>${location}</Location>
       <Key>${key}</Key>
       <Bucket>test-bucket</Bucket>
     </CompleteMultipartUploadResult>`,

  abortMultipart: () => '',
}

const server = setupServer()
const s3Url = 'https://test-bucket.s3.us-east-1.amazonaws.com/:key'

/**
 * Creates signRequest + MSW handler state for multipart upload tests.
 */
function createMultipartMocks(opts: { uploadId?: string; key?: string } = {}) {
  const uploadId = opts.uploadId ?? 'test-upload-id'
  const key = opts.key ?? 'test-key'

  // signRequest encodes operation details in the URL for MSW routing
  const signRequest = vi.fn().mockImplementation(async (req: any) => {
    const params = new URLSearchParams()
    if (req.uploadId) params.set('uploadId', req.uploadId)
    if (req.partNumber) params.set('partNumber', String(req.partNumber))
    params.set('method', req.method)
    return {
      url: `https://test-bucket.s3.us-east-1.amazonaws.com/${req.key || key}?${params}`,
    }
  })

  const operations: string[] = []

  const registerHandlers = ({
    hangNonCreate = false,
    listParts = [] as { partNumber: number; etag: string }[],
  } = {}) => {
    const maybeHang = () =>
      hangNonCreate ? (new Promise(() => {}) as Promise<any>) : null

    server.use(
      http.post(s3Url, ({ request }) => {
        const hasUploadId = new URL(request.url).searchParams.has('uploadId')
        if (!hasUploadId) {
          operations.push('createMultipart')
          return new HttpResponse(s3Responses.createMultipart(uploadId, key), {
            status: 200,
            headers: { 'Content-Type': 'application/xml' },
          })
        }

        operations.push('completeMultipart')
        const hung = maybeHang()
        if (hung) return hung

        return new HttpResponse(
          s3Responses.completeMultipart(
            `https://test-bucket.s3.amazonaws.com/${key}`,
            key,
          ),
          { status: 200, headers: { 'Content-Type': 'application/xml' } },
        )
      }),
      http.put(s3Url, () => {
        operations.push('uploadPart')
        const hung = maybeHang()
        if (hung) return hung
        return new HttpResponse('', {
          status: 200,
          headers: { ETag: '"etag-1"' },
        })
      }),
      http.get(s3Url, ({ request }) => {
        const hasUploadId = new URL(request.url).searchParams.has('uploadId')
        if (!hasUploadId) {
          return new HttpResponse('Not Found', { status: 404 })
        }

        operations.push('listParts')
        const hung = maybeHang()
        if (hung) return hung

        return new HttpResponse(s3Responses.listParts(listParts), {
          status: 200,
          headers: { 'Content-Type': 'application/xml' },
        })
      }),
      http.delete(s3Url, () => {
        operations.push('abortMultipart')
        return new HttpResponse('', { status: 204 })
      }),
    )
  }

  return { signRequest, operations, uploadId, key, registerHandlers }
}

describe('AwsS3', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it('Registers AwsS3 upload plugin', () => {
    const core = new Core().use(AwsS3, {
      region: 'us-east-1',
      s3Endpoint: 'https://companion.example.com',
      companionEndpoint: 'https://companion.example.com',
    })

    const pluginNames = core[Symbol.for('uppy test: getPlugins')](
      'uploader',
    ).map((plugin: AwsS3<Meta, AwsBody>) => plugin.constructor.name)
    expect(pluginNames).toContain('AwsS3')
  })

  describe('configuration validation', () => {
    it('throws if no signing method is provided', () => {
      expect(() => {
        const core = new Core()
        // @ts-expect-error - testing runtime validation, so omit required options
        core.use(AwsS3, {
          s3Endpoint: 'https://companion.example.com',
          region: 'us-east-1',
        })
      }).toThrow(
        'One of options `companionEndpoint`, `signRequest`, or `getCredentials` is required',
      )
    })

    it('accepts endpoint option', () => {
      const core = new Core()
      core.use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        companionEndpoint: 'https://companion.example.com',
      })
      expect(core.getPlugin('AwsS3')).toBeDefined()
    })

    it('accepts signRequest option', () => {
      const core = new Core()
      core.use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        signRequest: vi.fn(),
      })
      expect(core.getPlugin('AwsS3')).toBeDefined()
    })

    it('accepts getCredentials option', () => {
      const core = new Core()
      core.use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        getCredentials: vi.fn(),
      })
      expect(core.getPlugin('AwsS3')).toBeDefined()
    })
  })

  describe('shouldUseMultipart', () => {
    const MULTIPART_THRESHOLD = 100 * MB

    // Helper that creates a mock file without allocating memory
    const createFile = (size: number): UppyFile<Meta, AwsBody> =>
      ({
        name: 'test.dat',
        size,
        data: { size } as Blob,
      }) as unknown as UppyFile<Meta, AwsBody>

    it('defaults to multipart for files > 100MB', () => {
      const core = new Core<Meta, AwsBody>().use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        companionEndpoint: 'https://companion.example.com',
      })
      const opts = core.getPlugin('AwsS3')!.opts as AwsS3Options<Meta, AwsBody>
      const shouldUseMultipart = opts.shouldUseMultipart as (
        file: UppyFile<Meta, AwsBody>,
      ) => boolean

      expect(shouldUseMultipart(createFile(MULTIPART_THRESHOLD + 1))).toBe(true)
      expect(shouldUseMultipart(createFile(MULTIPART_THRESHOLD))).toBe(false)
      expect(shouldUseMultipart(createFile(MULTIPART_THRESHOLD - 1))).toBe(
        false,
      )
      expect(shouldUseMultipart(createFile(0))).toBe(false)
    })

    it('handles very large files', () => {
      const core = new Core<Meta, AwsBody>().use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        companionEndpoint: 'https://companion.example.com',
      })
      const opts = core.getPlugin('AwsS3')!.opts as AwsS3Options<Meta, AwsBody>
      const shouldUseMultipart = opts.shouldUseMultipart as (
        file: UppyFile<Meta, AwsBody>,
      ) => boolean

      expect(shouldUseMultipart(createFile(70 * 1024 * MB))).toBe(true) // 70GB
      expect(shouldUseMultipart(createFile(400 * 1024 * MB))).toBe(true) // 400GB
    })
  })

  describe('upload events', () => {
    it('emits upload-start when upload begins', async () => {
      const signRequest = vi.fn().mockRejectedValue(new Error('Test stop'))

      const core = new Core().use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        signRequest,
        shouldUseMultipart: false,
      })

      core.addFile({
        source: 'test',
        name: 'test.txt',
        type: 'text/plain',
        data: new File([new Uint8Array(1024)], 'test.txt'),
      })

      const uploadStartHandler = vi.fn()
      core.on('upload-start', uploadStartHandler)

      try {
        await core.upload()
      } catch {
        // Expected
      }

      expect(uploadStartHandler).toHaveBeenCalledTimes(1)
    })

    it('emits upload-error on failure', async () => {
      const signRequest = vi.fn().mockRejectedValue(new Error('Sign failed'))

      const core = new Core().use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        signRequest,
        shouldUseMultipart: false,
      })

      core.addFile({
        source: 'test',
        name: 'test.txt',
        type: 'text/plain',
        data: new File([new Uint8Array(1024)], 'test.txt'),
      })

      const uploadErrorHandler = vi.fn()
      core.on('upload-error', uploadErrorHandler)

      try {
        await core.upload()
      } catch {
        // Expected
      }

      expect(uploadErrorHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('abort', () => {
    it('aborts when file is removed', async () => {
      const signRequest = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        )

      const core = new Core().use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        signRequest,
        shouldUseMultipart: false,
      })

      core.addFile({
        source: 'test',
        name: 'test.txt',
        type: 'text/plain',
        data: new File([new Uint8Array(1024)], 'test.txt'),
      })

      const fileId = Object.keys(core.getState().files)[0]
      const uploadPromise = core.upload()
      setTimeout(() => core.removeFile(fileId), 10)

      const result = await uploadPromise
      // When a file is removed mid-upload, it should not appear in successful uploads
      expect(result).toBeDefined()
      expect(result?.successful).toHaveLength(0)
    })

    it('aborts when cancelAll is called', async () => {
      const signRequest = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        )

      const core = new Core().use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        signRequest,
        shouldUseMultipart: false,
      })

      core.addFile({
        source: 'test',
        name: 'test.txt',
        type: 'text/plain',
        data: new File([new Uint8Array(1024)], 'test.txt'),
      })

      const uploadPromise = core.upload()
      setTimeout(() => core.cancelAll(), 10)

      const result = await uploadPromise
      // When cancelAll is called, no files should complete successfully
      expect(result).toBeDefined()
      expect(result?.successful).toHaveLength(0)
    })
  })

  describe('Golden Retriever resume state (s3Multipart)', () => {
    it('persists s3Multipart on file state after creating multipart upload', async () => {
      const { signRequest, uploadId, registerHandlers } = createMultipartMocks()
      // After createMultipart succeeds, hang on subsequent requests so we can inspect state
      registerHandlers({ hangNonCreate: true })

      const core = new Core().use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        signRequest,
        shouldUseMultipart: true,
      })

      const fileId = core.addFile({
        source: 'test',
        name: 'big.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(6 * MB)], 'big.dat'),
      })

      const uploadPromise = core.upload()

      // Wait for createMultipart to complete and state to be persisted
      await new Promise((resolve) => setTimeout(resolve, 100))

      const file = core.getFile(fileId)
      expect(file.s3Multipart).toBeDefined()
      expect(file.s3Multipart?.uploadId).toBe(uploadId)

      // Clean up
      core.cancelAll()
      await uploadPromise
    })

    it('clears s3Multipart when upload is aborted via cancelAll', async () => {
      const { signRequest, registerHandlers } = createMultipartMocks({
        uploadId: 'cancel-test-id',
        key: 'cancel-key',
      })
      registerHandlers({ hangNonCreate: true })

      const core = new Core().use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        signRequest,
        shouldUseMultipart: true,
      })

      const fileId = core.addFile({
        source: 'test',
        name: 'big.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(6 * MB)], 'big.dat'),
      })

      const uploadPromise = core.upload()

      // Wait for createMultipart, then cancel
      await new Promise((resolve) => setTimeout(resolve, 50))
      core.cancelAll()

      await uploadPromise

      const file = core.getFile(fileId)
      // s3Multipart should be cleared so retries don't use a dead uploadId
      expect(file?.s3Multipart).toBeUndefined()
    })

    it('uses persisted s3Multipart key for resume (listParts, not createMultipart)', async () => {
      const persistedKey = 'persisted-object-key'
      const persistedUploadId = 'persisted-upload-id'
      const { signRequest, operations, registerHandlers } =
        createMultipartMocks({
          uploadId: persistedUploadId,
          key: persistedKey,
        })
      registerHandlers()

      const core = new Core().use(AwsS3, {
        s3Endpoint: 'https://companion.example.com',
        region: 'us-east-1',
        signRequest,
        shouldUseMultipart: false, // Would normally be simple upload
      })

      const fileId = core.addFile({
        source: 'test',
        name: 'big.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(6 * MB)], 'big.dat'),
      })

      // Simulate Golden Retriever restoring s3Multipart state
      core.setFileState(fileId, {
        s3Multipart: { uploadId: persistedUploadId, key: persistedKey },
      })

      const uploadPromise = core.upload()

      // Wait for the resume flow to call listParts (via fetch), then cancel
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should have resumed (listParts) instead of creating a new multipart upload
      expect(operations).toContain('listParts')
      expect(operations).not.toContain('createMultipart')

      // The signRequest calls should use the persisted key, not a generated one
      const signedKeys = signRequest.mock.calls.map((call: any) => call[0].key)
      expect(signedKeys.every((k: string) => k === persistedKey)).toBe(true)

      // Clean up
      core.cancelAll()
      await uploadPromise
    })
  })
})
