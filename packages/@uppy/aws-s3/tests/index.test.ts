import { afterEach, describe, expect, it, vi } from 'vitest'

import 'whatwg-fetch'
import Core, { type Meta, type UppyFile } from '@uppy/core'
import AwsS3, { type AwsBody, type AwsS3Options } from '../src/index.js'

const KB = 1024
const MB = KB * KB

// ============================================================================
// XHR Mock for simulating S3 upload responses
// ============================================================================

/**
 * Creates a mock XMLHttpRequest that simulates successful S3 PUT uploads.
 * This allows testing the full upload pipeline without a real S3/MinIO server.
 *
 * The mock intercepts XMLHttpRequest globally. Call `restore()` when done.
 */
function createXHRMock(options?: {
  /** Custom response headers to include */
  responseHeaders?: Record<string, string>
  /** HTTP status code to return. Default: 200 */
  status?: number
  /** Response body text. Default: '' */
  responseText?: string
  /** Delay before responding (ms). Default: 0 (microtask) */
  delay?: number
}) {
  const {
    responseHeaders = {},
    status = 200,
    responseText = '',
    delay = 0,
  } = options ?? {}

  const OriginalXHR = globalThis.XMLHttpRequest
  const xhrInstances: InstanceType<typeof MockXHR>[] = []

  class MockXHR {
    status = 0
    responseType = ''
    responseText = ''
    readyState = 0
    withCredentials = false

    upload = {
      onprogress: null as ((ev: ProgressEvent) => void) | null,
    }

    onload: ((ev: Event) => void) | null = null
    onerror: ((ev: Event) => void) | null = null

    _method = ''
    _url = ''
    _headers: Record<string, string> = {}
    _body: unknown = null
    _aborted = false
    _responseHeaders: Record<string, string> = {
      etag: '"test-etag-123"',
      ...responseHeaders,
    }

    open(method: string, url: string) {
      this._method = method
      this._url = url
    }

    setRequestHeader(key: string, value: string) {
      this._headers[key] = value
    }

    getResponseHeader(name: string): string | null {
      return this._responseHeaders[name.toLowerCase()] ?? null
    }

    getAllResponseHeaders(): string {
      return Object.entries(this._responseHeaders)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n')
    }

    abort() {
      this._aborted = true
    }

    send(body?: unknown) {
      this._body = body
      xhrInstances.push(this)

      const respond = () => {
        if (this._aborted) return
        const bodySize =
          body instanceof Blob
            ? body.size
            : typeof body === 'string'
              ? body.length
              : body instanceof ArrayBuffer
                ? body.byteLength
                : 0

        // Fire progress event with exact body size
        if (this.upload.onprogress) {
          this.upload.onprogress(
            new ProgressEvent('progress', {
              loaded: bodySize,
              total: bodySize,
              lengthComputable: true,
            }),
          )
        }

        this.status = status
        this.responseText = responseText
        this.readyState = 4

        if (this.onload) {
          this.onload(new Event('load'))
        }
      }

      if (delay > 0) {
        setTimeout(respond, delay)
      } else {
        queueMicrotask(respond)
      }
    }
  }

  // Replace global XMLHttpRequest
  globalThis.XMLHttpRequest = MockXHR as unknown as typeof XMLHttpRequest

  return {
    instances: xhrInstances,
    MockXHR,
    restore() {
      globalThis.XMLHttpRequest = OriginalXHR
    },
  }
}

/**
 * Creates a method-aware fetch mock for S3 XML API responses.
 * Multipart operations use fetch (via _presignedRequest → _sendRequest),
 * while data uploads use XHR (via _xhrUpload → fetcher).
 *
 * Returns a restore function to undo the mock.
 */
function createMultipartFetchMock(options?: {
  /** Upload ID to return from CreateMultipartUpload */
  uploadId?: string
  /** Callback when CompleteMultipartUpload is called, receives the XML body */
  onComplete?: (body: string) => void
  /** Custom key for Location in CompleteMultipartUploadResult */
  key?: string
}) {
  const {
    uploadId = 'test-upload-id',
    onComplete,
    key = 'test.dat',
  } = options ?? {}

  const origFetch = globalThis.fetch
  globalThis.fetch = (async (
    _input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const method = init?.method ?? 'GET'
    const body = init?.body

    if (method === 'POST' && (!body || body === '')) {
      // CreateMultipartUpload (POST with empty body)
      return new Response(
        `<InitiateMultipartUploadResult>
          <Bucket>test-bucket</Bucket>
          <Key>${key}</Key>
          <UploadId>${uploadId}</UploadId>
        </InitiateMultipartUploadResult>`,
        { status: 200, headers: { 'Content-Type': 'application/xml' } },
      )
    }

    if (
      method === 'POST' &&
      typeof body === 'string' &&
      body.includes('CompleteMultipartUpload')
    ) {
      // CompleteMultipartUpload (POST with XML body)
      onComplete?.(body)
      return new Response(
        `<CompleteMultipartUploadResult>
          <Location>https://test-bucket.s3.us-east-1.amazonaws.com/${key}</Location>
          <Bucket>test-bucket</Bucket>
          <Key>${key}</Key>
          <ETag>"final-etag"</ETag>
        </CompleteMultipartUploadResult>`,
        { status: 200, headers: { 'Content-Type': 'application/xml' } },
      )
    }

    if (method === 'GET') {
      // ListParts (returns empty — all parts need uploading)
      return new Response(
        `<ListPartsResult>
          <Bucket>test-bucket</Bucket>
          <Key>${key}</Key>
          <UploadId>${uploadId}</UploadId>
        </ListPartsResult>`,
        { status: 200, headers: { 'Content-Type': 'application/xml' } },
      )
    }

    if (method === 'DELETE') {
      // AbortMultipartUpload
      return new Response('', { status: 204 })
    }

    return new Response('', { status: 200 })
  }) as typeof fetch

  return {
    restore() {
      globalThis.fetch = origFetch
    },
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('AwsS3', () => {
  it('Registers AwsS3 upload plugin', () => {
    const core = new Core().use(AwsS3, {
      bucket: 'test-bucket',
      region: 'us-east-1',
      endpoint: 'https://companion.example.com',
    })

    const getPlugins = Symbol.for('uppy test: getPlugins')
    const pluginNames = (core as any)
      [getPlugins]('uploader')
      .map((plugin: AwsS3<Meta, AwsBody>) => plugin.constructor.name)
    expect(pluginNames).toContain('AwsS3')
  })

  describe('configuration validation', () => {
    it('throws if bucket is not provided', () => {
      expect(() => {
        const core = new Core()
        // @ts-expect-error - testing missing required option
        core.use(AwsS3, {})
      }).toThrow('`bucket` option is required')
    })

    it('throws if region is not provided', () => {
      expect(() => {
        const core = new Core()
        core.use(AwsS3, { bucket: 'test-bucket' })
      }).toThrow('`region` option is required')
    })

    it('throws if no signing method is provided', () => {
      expect(() => {
        const core = new Core()
        core.use(AwsS3, { bucket: 'test-bucket', region: 'us-east-1' })
      }).toThrow('`endpoint`, `signRequest`, or `getCredentials` is required')
    })

    it('accepts endpoint option', () => {
      const core = new Core()
      core.use(AwsS3, {
        bucket: 'test-bucket',
        region: 'us-east-1',
        endpoint: 'https://companion.example.com',
      })
      expect(core.getPlugin('AwsS3')).toBeDefined()
    })

    it('accepts signRequest option', () => {
      const core = new Core()
      core.use(AwsS3, {
        bucket: 'test-bucket',
        region: 'us-east-1',
        signRequest: vi.fn(),
      })
      expect(core.getPlugin('AwsS3')).toBeDefined()
    })

    it('accepts getCredentials option', () => {
      const core = new Core()
      core.use(AwsS3, {
        bucket: 'test-bucket',
        region: 'us-east-1',
        getCredentials: vi.fn(),
      })
      expect(core.getPlugin('AwsS3')).toBeDefined()
    })
  })

  describe('shouldUseMultipart', () => {
    const MULTIPART_THRESHOLD = 100 * MB

    const createFile = (size: number): UppyFile<Meta, AwsBody> =>
      ({
        name: 'test.dat',
        size,
        data: { size } as Blob,
      }) as unknown as UppyFile<Meta, AwsBody>

    it('defaults to multipart for files > 100MB', () => {
      const core = new Core<Meta, AwsBody>().use(AwsS3, {
        bucket: 'test-bucket',
        region: 'us-east-1',
        endpoint: 'https://companion.example.com',
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
        bucket: 'test-bucket',
        region: 'us-east-1',
        endpoint: 'https://companion.example.com',
      })
      const opts = core.getPlugin('AwsS3')!.opts as AwsS3Options<Meta, AwsBody>
      const shouldUseMultipart = opts.shouldUseMultipart as (
        file: UppyFile<Meta, AwsBody>,
      ) => boolean

      expect(shouldUseMultipart(createFile(70 * 1024 * MB))).toBe(true)
      expect(shouldUseMultipart(createFile(400 * 1024 * MB))).toBe(true)
    })
  })

  describe('upload events', () => {
    it('emits upload-start when upload begins', async () => {
      const signRequest = vi.fn().mockRejectedValue(new Error('Test stop'))

      const core = new Core().use(AwsS3, {
        bucket: 'test-bucket',
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
        bucket: 'test-bucket',
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
        bucket: 'test-bucket',
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
        bucket: 'test-bucket',
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
      expect(result).toBeDefined()
      expect(result?.successful).toHaveLength(0)
    })
  })

  // ==========================================================================
  // Regression tests for GitHub issues
  // ==========================================================================

  describe('regression: #5672 — upload-error event includes error object', () => {
    // https://github.com/transloadit/uppy/issues/5672
    // In the old plugin, `upload-error` was emitted without the response/error.

    it('passes the error object to upload-error event handlers', async () => {
      const signRequest = vi
        .fn()
        .mockRejectedValue(new Error('Signing failed: 403 Forbidden'))

      const core = new Core().use(AwsS3, {
        bucket: 'test-bucket',
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

      const errorHandler = vi.fn()
      core.on('upload-error', errorHandler)

      try {
        await core.upload()
      } catch {
        // Expected
      }

      expect(errorHandler).toHaveBeenCalledTimes(1)
      const [file, error] = errorHandler.mock.calls[0] as [
        UppyFile<Meta, AwsBody>,
        Error,
      ]
      expect(file).toBeDefined()
      expect(file.name).toBe('test.txt')
      // The error must be passed as the second argument, not undefined
      expect(error).toBeDefined()
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Signing failed')
    })
  })

  describe('regression: #4897 — bytesUploaded must not exceed bytesTotal', () => {
    // https://github.com/transloadit/uppy/issues/4897
    // Old plugin used FormData for POST uploads, causing XHR progress.loaded
    // to reflect the full FormData size (file + form metadata), not just the file.
    // The rewrite uses PUT with raw body, so progress.loaded = actual file bytes.

    let xhrMock: ReturnType<typeof createXHRMock>

    afterEach(() => {
      xhrMock?.restore()
    })

    it('never reports bytesUploaded > bytesTotal for small files', async () => {
      const fileSize = 3574 // Small file, same as in the issue report
      xhrMock = createXHRMock()

      const signRequest = vi.fn().mockResolvedValue({
        url: 'https://test-bucket.s3.us-east-1.amazonaws.com/test.txt?X-Amz-Signature=abc',
      })

      const core = new Core().use(AwsS3, {
        bucket: 'test-bucket',
        region: 'us-east-1',
        signRequest,
        shouldUseMultipart: false,
      })

      core.addFile({
        source: 'test',
        name: 'test.txt',
        type: 'text/plain',
        data: new File([new Uint8Array(fileSize)], 'test.txt'),
      })

      const progressEvents: { bytesUploaded: number; bytesTotal: number }[] = []
      core.on('upload-progress', (_file, progress) => {
        progressEvents.push({
          bytesUploaded: progress.bytesUploaded,
          bytesTotal: progress.bytesTotal ?? 0,
        })
      })

      await core.upload()

      expect(progressEvents.length).toBeGreaterThan(0)
      for (const event of progressEvents) {
        expect(event.bytesUploaded).toBeLessThanOrEqual(event.bytesTotal)
        expect(event.bytesTotal).toBe(fileSize)
      }
    })
  })

  describe('regression: #5667 — multipart parts must only contain partNumber and etag', () => {
    // https://github.com/transloadit/uppy/issues/5667
    // Old plugin spread ALL XHR response headers into the AwsS3Part object,
    // causing completeMultipartUpload to fail with extra fields.
    // Rewrite's S3mini.uploadPart() returns only { partNumber, etag }.

    it('s3-multipart:part-uploaded event only contains PartNumber and ETag', async () => {
      // Mock XHR that returns many headers (like MinIO does)
      const xhrMock = createXHRMock({
        responseHeaders: {
          etag: '"abc123"',
          'content-length': '5242880',
          'x-amz-request-id': 'ABCD1234',
          server: 'MinIO',
          'accept-ranges': 'bytes',
          vary: 'Origin',
          'strict-transport-security': 'max-age=31536000',
        },
      })

      const fetchMock = createMultipartFetchMock({ uploadId: 'upload-id-123' })

      try {
        const signRequest = vi.fn().mockResolvedValue({
          url: 'https://test-bucket.s3.us-east-1.amazonaws.com/test.dat?X-Amz-Signature=abc',
        })

        const core = new Core().use(AwsS3, {
          bucket: 'test-bucket',
          region: 'us-east-1',
          signRequest,
          shouldUseMultipart: true,
        })

        // Create a 10MB file (2 chunks of 5MB)
        core.addFile({
          source: 'test',
          name: 'test.dat',
          type: 'application/octet-stream',
          data: new File([new Uint8Array(10 * MB)], 'test.dat'),
        })

        const partEvents: { PartNumber: number; ETag: string }[] = []
        core.on('s3-multipart:part-uploaded', (_file, part) => {
          partEvents.push(part)
        })

        await core.upload()

        expect(partEvents.length).toBeGreaterThan(0)
        for (const part of partEvents) {
          const keys = Object.keys(part)
          expect(keys).toContain('PartNumber')
          expect(keys).toContain('ETag')
          // Must NOT contain leaked response headers
          expect(keys).not.toContain('content-length')
          expect(keys).not.toContain('x-amz-request-id')
          expect(keys).not.toContain('server')
          expect(keys).not.toContain('accept-ranges')
          expect(keys).not.toContain('vary')
          expect(keys.length).toBe(2) // Exactly PartNumber + ETag
        }
      } finally {
        xhrMock.restore()
        fetchMock.restore()
      }
    })
  })

  describe('regression: #5328 — completeMultipartUpload XML must be well-formed', () => {
    // https://github.com/transloadit/uppy/issues/5328
    // Old plugin could send malformed XML with grouped arrays instead of
    // individual Part objects. The rewrite builds XML explicitly.

    it('sends properly structured XML with one Part element per part', async () => {
      const xhrMock = createXHRMock({
        responseHeaders: { etag: '"part-etag-1"' },
      })

      let completionRequestBody = ''
      const fetchMock = createMultipartFetchMock({
        uploadId: 'test-upload-id',
        onComplete: (body) => {
          completionRequestBody = body
        },
      })

      try {
        const signRequest = vi.fn().mockResolvedValue({
          url: 'https://test-bucket.s3.us-east-1.amazonaws.com/test.dat?X-Amz-Signature=abc',
        })

        const core = new Core().use(AwsS3, {
          bucket: 'test-bucket',
          region: 'us-east-1',
          signRequest,
          shouldUseMultipart: true,
        })

        // 10MB = 2 parts
        core.addFile({
          source: 'test',
          name: 'test.dat',
          type: 'application/octet-stream',
          data: new File([new Uint8Array(10 * MB)], 'test.dat'),
        })

        await core.upload()

        // The completion request should have been captured
        expect(completionRequestBody).toBeTruthy()

        // Verify XML structure
        expect(completionRequestBody).toContain('<CompleteMultipartUpload>')
        expect(completionRequestBody).toContain('</CompleteMultipartUpload>')

        // Count Part elements — should match number of parts
        const partMatches = completionRequestBody.match(/<Part>/g)
        expect(partMatches).toBeTruthy()
        expect(partMatches!.length).toBe(2)

        // Each Part must have exactly one PartNumber and one ETag
        const partNumberMatches = completionRequestBody.match(
          /<PartNumber>\d+<\/PartNumber>/g,
        )
        expect(partNumberMatches).toBeTruthy()
        expect(partNumberMatches!.length).toBe(2)

        const etagMatches = completionRequestBody.match(/<ETag>[^<]+<\/ETag>/g)
        expect(etagMatches).toBeTruthy()
        expect(etagMatches!.length).toBe(2)

        // PartNumbers should be sequential starting from 1
        expect(completionRequestBody).toContain('<PartNumber>1</PartNumber>')
        expect(completionRequestBody).toContain('<PartNumber>2</PartNumber>')
      } finally {
        xhrMock.restore()
        fetchMock.restore()
      }
    })
  })

  describe('regression: #5594 — simple upload succeeds even without ETag in response', () => {
    // https://github.com/transloadit/uppy/issues/5594
    // Old plugin's uploadPartBytes short-circuited when etag was null,
    // never calling onComplete. GCS/Backblaze B2 don't always return ETag.
    // The rewrite's putObject for simple uploads doesn't depend on ETag.

    let xhrMock: ReturnType<typeof createXHRMock>

    afterEach(() => {
      xhrMock?.restore()
    })

    it('completes simple upload successfully when response has no ETag header', async () => {
      xhrMock = createXHRMock({
        // No etag header — simulating GCS JSON API behavior
        responseHeaders: {},
      })

      const signRequest = vi.fn().mockResolvedValue({
        url: 'https://test-bucket.s3.us-east-1.amazonaws.com/test.txt?X-Amz-Signature=abc',
      })

      const core = new Core().use(AwsS3, {
        bucket: 'test-bucket',
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

      const successHandler = vi.fn()
      core.on('upload-success', successHandler)

      const result = await core.upload()

      // Upload should succeed even without ETag
      expect(successHandler).toHaveBeenCalledTimes(1)
      expect(result?.successful).toHaveLength(1)

      // The success response should still contain location and key
      const [, response] = successHandler.mock.calls[0] as [unknown, any]
      expect(response.uploadURL).toBeTruthy()
      expect(response.body.key).toBeTruthy()
    })
  })

  describe('regression: #4648 — rapid pause/resume must not crash', () => {
    // https://github.com/transloadit/uppy/issues/4648
    // Old plugin: rapid Pause/Resume caused null chunk access:
    // TypeError: Cannot read properties of null (reading 'shouldUseMultipart')
    // Rewrite stores chunks separately from state, no null chunk access possible.

    it('does not crash when pause/resume is toggled rapidly during multipart upload', async () => {
      // Use a signRequest that responds slowly to give time for pause/resume
      const signRequest = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            // Slow signing to keep upload in-flight while we toggle pause
            setTimeout(
              () =>
                resolve({
                  url: 'https://test-bucket.s3.us-east-1.amazonaws.com/test.dat?X-Amz-Signature=abc',
                }),
              20,
            )
          }),
      )

      const core = new Core().use(AwsS3, {
        bucket: 'test-bucket',
        region: 'us-east-1',
        signRequest,
        shouldUseMultipart: true,
      })

      // 10MB file → 2 parts
      core.addFile({
        source: 'test',
        name: 'test.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(10 * MB)], 'test.dat'),
      })

      const fileId = Object.keys(core.getState().files)[0]
      const errors: Error[] = []

      // Rapidly toggle pause/resume before upload starts and during signing
      // This must NOT throw TypeError about null chunk access
      for (let i = 0; i < 20; i++) {
        try {
          core.pauseResume(fileId)
        } catch (err) {
          errors.push(err as Error)
        }
      }

      // No TypeErrors should have been thrown
      for (const err of errors) {
        expect(err.name).not.toBe('TypeError')
        expect(err.message).not.toContain('Cannot read properties of null')
      }
    })
  })

  describe('regression: #4313 — each upload attempt gets its own uploadId', () => {
    // https://github.com/transloadit/uppy/issues/4313
    // Old plugin cached uploadId on file.data WeakMap and never cleared it.
    // The rewrite creates a new S3Uploader per upload attempt — each upload
    // calls createMultipartUpload to get a fresh uploadId, with no caching.

    it('separate files each get their own uploadId (no cross-file caching)', async () => {
      const uploadIds: string[] = []
      let uploadIdCounter = 0

      const xhrMock = createXHRMock({
        responseHeaders: { etag: '"test-etag"' },
      })

      const origFetch = globalThis.fetch
      globalThis.fetch = (async (
        _input: string | URL | Request,
        init?: RequestInit,
      ) => {
        const method = init?.method ?? 'GET'
        const body = init?.body

        if (method === 'POST' && (!body || body === '')) {
          uploadIdCounter++
          const id = `upload-id-${uploadIdCounter}`
          uploadIds.push(id)
          return new Response(
            `<InitiateMultipartUploadResult>
              <UploadId>${id}</UploadId>
            </InitiateMultipartUploadResult>`,
            { status: 200, headers: { 'Content-Type': 'application/xml' } },
          )
        }
        if (
          method === 'POST' &&
          typeof body === 'string' &&
          body.includes('CompleteMultipartUpload')
        ) {
          return new Response(
            `<CompleteMultipartUploadResult>
              <Location>https://test-bucket.s3.amazonaws.com/test.dat</Location>
              <Bucket>test-bucket</Bucket>
              <Key>test.dat</Key>
              <ETag>"final"</ETag>
            </CompleteMultipartUploadResult>`,
            { status: 200, headers: { 'Content-Type': 'application/xml' } },
          )
        }
        return new Response('', { status: 200 })
      }) as typeof fetch

      try {
        const signRequest = vi.fn().mockResolvedValue({
          url: 'https://test-bucket.s3.us-east-1.amazonaws.com/test.dat?X-Amz-Signature=abc',
        })

        const core = new Core().use(AwsS3, {
          bucket: 'test-bucket',
          region: 'us-east-1',
          signRequest,
          shouldUseMultipart: true,
        })

        // Upload two files simultaneously — each must get its own uploadId
        core.addFile({
          source: 'test',
          name: 'file1.dat',
          type: 'application/octet-stream',
          data: new File([new Uint8Array(10 * MB)], 'file1.dat'),
        })
        core.addFile({
          source: 'test',
          name: 'file2.dat',
          type: 'application/octet-stream',
          data: new File([new Uint8Array(10 * MB)], 'file2.dat'),
        })

        await core.upload()

        // Each file should have initiated its own multipart upload
        expect(uploadIds).toHaveLength(2)
        expect(uploadIds[0]).toBe('upload-id-1')
        expect(uploadIds[1]).toBe('upload-id-2')
        // Upload IDs must be unique — no caching/sharing
        expect(uploadIds[0]).not.toBe(uploadIds[1])
      } finally {
        xhrMock.restore()
        globalThis.fetch = origFetch
      }
    })
  })

  describe('regression: #5429 — pause/resume works with prefixed keys', () => {
    // https://github.com/transloadit/uppy/issues/5429
    // Old plugin parsed key from URL using pathname.split("/").pop(),
    // which broke with nested prefixed keys containing "/".
    // The rewrite stores the key directly — no URL parsing needed.

    it('supports keys with nested path prefixes without breaking', async () => {
      const xhrMock = createXHRMock({
        responseHeaders: { etag: '"prefix-etag"' },
        delay: 30,
      })

      const fetchMock = createMultipartFetchMock({
        uploadId: 'prefix-upload-id',
        key: 'uploads/user-123/test.dat',
      })

      try {
        const signedKeys: string[] = []
        const signRequest = vi.fn().mockImplementation((request: any) => {
          signedKeys.push(request.key)
          return Promise.resolve({
            url: `https://test-bucket.s3.us-east-1.amazonaws.com/${request.key}?X-Amz-Signature=abc`,
          })
        })

        const core = new Core().use(AwsS3, {
          bucket: 'test-bucket',
          region: 'us-east-1',
          signRequest,
          shouldUseMultipart: true,
          generateObjectKey: () => 'uploads/user-123/test.dat',
        })

        core.addFile({
          source: 'test',
          name: 'test.dat',
          type: 'application/octet-stream',
          data: new File([new Uint8Array(10 * MB)], 'test.dat'),
        })

        const successHandler = vi.fn()
        core.on('upload-success', successHandler)

        const result = await core.upload()

        // Upload should complete without crashing
        expect(successHandler).toHaveBeenCalledTimes(1)
        expect(result?.successful).toHaveLength(1)

        // All sign requests should use the full prefixed key
        for (const key of signedKeys) {
          expect(key).toBe('uploads/user-123/test.dat')
        }
      } finally {
        xhrMock.restore()
        fetchMock.restore()
      }
    })
  })
})
