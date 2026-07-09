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
import Core from '@uppy/core'
import AwsS3 from '../src/index.js'

const MB = 1024 * 1024
const s3Url = 'https://test-bucket.s3.us-east-1.amazonaws.com/:key'
const server = setupServer()

const createMultipartXml = (uploadId: string, key: string) =>
  `<?xml version="1.0" encoding="UTF-8"?><InitiateMultipartUploadResult><UploadId>${uploadId}</UploadId><Key>${key}</Key></InitiateMultipartUploadResult>`

describe('pause during createMultipartUpload', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('must NOT abort the S3 upload when merely PAUSED (only cancel should)', async () => {
    const operations: string[] = []
    let markCreateStarted!: () => void
    const createStarted = new Promise<void>((r) => {
      markCreateStarted = r
    })
    let releaseCreate!: () => void
    const createGate = new Promise<void>((r) => {
      releaseCreate = r
    })

    const signRequest = vi.fn(async (req: any) => {
      const params = new URLSearchParams()
      if (req.uploadId) params.set('uploadId', req.uploadId)
      if (req.partNumber) params.set('partNumber', String(req.partNumber))
      params.set('method', req.method)
      return {
        url: `https://test-bucket.s3.us-east-1.amazonaws.com/${req.key}?${params}`,
      }
    })

    server.use(
      http.post(s3Url, async ({ request }) => {
        const hasUploadId = new URL(request.url).searchParams.has('uploadId')
        if (!hasUploadId) {
          operations.push('createMultipart')
          markCreateStarted()
          await createGate // hang create until the test releases it
          return new HttpResponse(createMultipartXml('upload-1', 'test-key'), {
            status: 200,
            headers: { 'Content-Type': 'application/xml' },
          })
        }
        operations.push('completeMultipart')
        return new HttpResponse('', { status: 200 })
      }),
      http.put(s3Url, () => {
        operations.push('uploadPart')
        return new HttpResponse('', { status: 200, headers: { ETag: '"e"' } })
      }),
      http.get(s3Url, () => {
        operations.push('listParts')
        return new HttpResponse(
          '<?xml version="1.0"?><ListPartsResult></ListPartsResult>',
          { status: 200, headers: { 'Content-Type': 'application/xml' } },
        )
      }),
      http.delete(s3Url, () => {
        operations.push('abortMultipart')
        return new HttpResponse('', { status: 204 })
      }),
    )

    const core = new Core().use(AwsS3, {
      s3Endpoint: 'https://test-bucket.s3.us-east-1.amazonaws.com',
      region: 'us-east-1',
      signRequest,
      shouldUseMultipart: true,
    })
    core.addFile({
      source: 'test',
      name: 'big.bin',
      type: 'application/octet-stream',
      data: new File([new Uint8Array(6 * MB)], 'big.bin'),
    })
    const fileId = Object.keys(core.getState().files)[0]

    const uploadPromise = core.upload()
    uploadPromise?.catch(() => {}) // may hang/reject on the bug — don't fail on it

    await createStarted // createMultipartUpload is now in flight
    core.pauseResume(fileId) // PAUSE (not remove) during the create window
    releaseCreate() // let create finish so S3 returns the uploadId

    await new Promise((r) => setTimeout(r, 50)) // let the post-create check run

    // A pause must keep the upload alive & resumable — it must NOT be deleted in S3.
    expect(operations).not.toContain('abortMultipart')
    // ...and resume state must be persisted so it can actually resume.
    expect(core.getFile(fileId)?.s3Multipart).toBeDefined()

    core.cancelAll()
  })

  it('cancel overrides a prior pause: pause then remove during create still aborts in S3', async () => {
    const operations: string[] = []
    let markCreateStarted!: () => void
    const createStarted = new Promise<void>((r) => {
      markCreateStarted = r
    })
    let releaseCreate!: () => void
    const createGate = new Promise<void>((r) => {
      releaseCreate = r
    })

    const signRequest = vi.fn(async (req: any) => {
      const params = new URLSearchParams()
      if (req.uploadId) params.set('uploadId', req.uploadId)
      params.set('method', req.method)
      return {
        url: `https://test-bucket.s3.us-east-1.amazonaws.com/${req.key}?${params}`,
      }
    })

    server.use(
      http.post(s3Url, async ({ request }) => {
        const hasUploadId = new URL(request.url).searchParams.has('uploadId')
        if (!hasUploadId) {
          operations.push('createMultipart')
          markCreateStarted()
          await createGate
          return new HttpResponse(createMultipartXml('upload-2', 'test-key'), {
            status: 200,
            headers: { 'Content-Type': 'application/xml' },
          })
        }
        return new HttpResponse('', { status: 200 })
      }),
      http.delete(s3Url, () => {
        operations.push('abortMultipart')
        return new HttpResponse('', { status: 204 })
      }),
    )

    const core = new Core().use(AwsS3, {
      s3Endpoint: 'https://test-bucket.s3.us-east-1.amazonaws.com',
      region: 'us-east-1',
      signRequest,
      shouldUseMultipart: true,
    })
    core.addFile({
      source: 'test',
      name: 'big.bin',
      type: 'application/octet-stream',
      data: new File([new Uint8Array(6 * MB)], 'big.bin'),
    })
    const fileId = Object.keys(core.getState().files)[0]

    const uploadPromise = core.upload()
    uploadPromise?.catch(() => {})

    await createStarted
    core.pauseResume(fileId) // pause first...
    core.removeFile(fileId) // ...then cancel, both inside the create window
    releaseCreate()
    await uploadPromise

    // The cancel must win: the now-orphaned S3 upload gets aborted.
    await vi.waitFor(() => expect(operations).toContain('abortMultipart'))
  })
})
