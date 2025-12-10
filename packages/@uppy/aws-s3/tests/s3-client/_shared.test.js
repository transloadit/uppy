import { randomBytes } from 'node:crypto'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { S3mini, sanitizeETag } from '../../src/s3-client/index.js'
import { createSigV4Signer } from '../test-utils/sigv4-signer.js'

export const beforeRun = (raw, name, providerSpecific) => {
  if (!raw || raw === null) {
    console.error(
      'No credentials found. Please set the BUCKET_ENV_ environment variables.',
    )
    describe.skip(name, () => {
      it('skipped', () => {
        expect(true).toBe(true)
      })
    })
  } else {
    console.log('Running tests for bucket:', name)
    const credentials = {
      provider: raw[0],
      accessKeyId: raw[1],
      secretAccessKey: raw[2],
      endpoint: raw[3],
      region: raw[4],
    }
    describe(`:::: ${credentials.provider} ::::`, () => {
      expect(credentials.provider).toBe(name)
      providerName = credentials.provider
      expect(credentials.accessKeyId).toBeDefined()
      expect(credentials.secretAccessKey).toBeDefined()
      expect(credentials.endpoint).toBeDefined()
      expect(credentials.region).toBeDefined()
      testRunner(credentials)
      if (providerSpecific) {
        providerSpecific(credentials)
      }
    })
  }
}

const EIGHT_MB = 8 * 1024 * 1024

const large_buffer = randomBytes(EIGHT_MB * 3.2)
const content = "some content"
// const byteSize = (str) => new Blob([str]).size

// const OP_CAP = 40
let providerName
const key = 'first-test-object.txt'
const contentString = 'Hello, world!'

const specialCharContentString = 'Hello, world! \uD83D\uDE00'
const specialCharContentBufferExtra = Buffer.from(
  `${specialCharContentString}extra`,
  'utf-8',
)
const specialCharKey = 'special-char key with spaces.txt'

const FILE_KEYS = [
  key,
  specialCharKey,
  'multipart-object.txt',
  'multipart-object-ssec.txt',
]

export const cleanupTestBeforeAll = (s3client) => {
  beforeAll(async () => {
    for (const key of FILE_KEYS) {
      try {
        await s3client.deleteObject(key)
      } catch {
        // intentionally ignore the errors
      }
    }
  })
}

// --- 2 ■ A separate describe makes test output nicer -----------------------
export const testRunner = (bucket) => {
  vi.setConfig({ testTimeout: 120_000 })

  const signer = createSigV4Signer({
    accessKeyId: bucket.accessKeyId,
    secretAccessKey: bucket.secretAccessKey,
    region: bucket.region,
  })

  const s3client = new S3mini({
    endpoint: bucket.endpoint,
    region: bucket.region,
    signRequest: signer,
  })

  cleanupTestBeforeAll(s3client)

  it('instantiates s3client', () => {
    expect(s3client).toBeInstanceOf(S3mini) // ← updated expectation
  })

  // we don't need an explicit eTag method as we already get eTag in the putOject response
  it('putObject uploads successfully and returns ETag', async () => {
    const response = await s3client.putObject(key, content, 'text/plain')
    expect(response.status).toBe(200)
    expect(response.headers.get('etag')).toBeDefined()
    await s3client.deleteObject(key)
  })

  it('put and get object with special characters and different types', async () => {
    await s3client.putObject(specialCharKey, specialCharContentString)
    const data = await s3client.getObject(specialCharKey)
    expect(data).toEqual(specialCharContentString)

    // update the object with a buffer with extra content
    // This is to test if the object can be updated with a buffer that has extra content
    await s3client.putObject(specialCharKey, specialCharContentBufferExtra)
    const updatedData = await s3client.getObjectArrayBuffer(specialCharKey)
    const bufferData = Buffer.from(updatedData)
    expect(bufferData.toString('utf-8')).toBe(
      specialCharContentBufferExtra.toString('utf-8'),
    )
    expect(bufferData.length).toBe(specialCharContentBufferExtra.length)

    const getObjectLength = await s3client.getContentLength(specialCharKey)
    expect(getObjectLength).toBe(specialCharContentBufferExtra.length)

    // Put object image/png
    await s3client.putObject(
      `${specialCharKey}.png`,
      specialCharContentBufferExtra,
      'image/png',
    )
    // get object with image/png content type
    const imageData = await s3client.getObjectResponse(`${specialCharKey}.png`)
    expect(imageData).toBeDefined()
    expect(imageData.headers.get('content-type')).toBe('image/png')

    // Clean up
    const delResp = await s3client.deleteObject(specialCharKey)
    expect(delResp).toBe(true)

    // Check if the object is deleted
    const deletedData = await s3client.getObject(specialCharKey)
    expect(deletedData).toBe(null)
  })



  // list multipart uploads and abort them
  it('list multipart uploads and abort them all', async () => {
    let multipartUpload
    do {
      multipartUpload = await s3client.listMultipartUploads()
      expect(multipartUpload).toBeDefined()
      expect(typeof multipartUpload).toBe('object')
      if (!multipartUpload.uploadId || !multipartUpload.Key) {
        break
      }
      const abortUploadResponse = await s3client.abortMultipartUpload(
        multipartUpload.Key,
        multipartUpload.uploadId,
      )
      expect(abortUploadResponse).toBeDefined()
      expect(abortUploadResponse.status).toBe('Aborted')
      expect(abortUploadResponse.Key).toEqual(multipartUpload.Key)
      expect(abortUploadResponse.uploadId).toEqual(multipartUpload.uploadId)
    } while (multipartUpload.uploadId && multipartUpload.Key)

    const multipartUpload2 = await s3client.listMultipartUploads()
    expect(multipartUpload2).toBeDefined()
    expect(typeof multipartUpload2).toBe('object')
    expect(multipartUpload2).not.toHaveProperty('key')
    expect(multipartUpload2).not.toHaveProperty('uploadId')
  })

  // // multipart upload and download
  // it('multipart upload and download', async () => {
  //   const multipartKey = 'multipart-object.txt'
  //   const partSize = EIGHT_MB // 8 MB
  //   const totalParts = Math.ceil(large_buffer.length / partSize)
  //   const uploadId = await s3client.getMultipartUploadId(multipartKey)

  //   const uploadPromises = []
  //   for (let i = 0; i < totalParts; i++) {
  //     const partBuffer = large_buffer.subarray(i * partSize, (i + 1) * partSize)
  //     uploadPromises.push(
  //       s3client.uploadPart(multipartKey, uploadId, partBuffer, i + 1),
  //     )
  //   }
  //   const uploadResponses = await Promise.all(uploadPromises)

  //   const parts = uploadResponses.map((response, index) => ({
  //     partNumber: index + 1,
  //     etag: response.etag,
  //   }))

  //   const completeResponse = await s3client.completeMultipartUpload(
  //     multipartKey,
  //     uploadId,
  //     parts,
  //   )
  //   expect(completeResponse).toBeDefined()
  //   expect(typeof completeResponse).toBe('object')
  //   const etag = completeResponse.etag
  //   expect(etag).toBeDefined()
  //   expect(typeof etag).toBe('string')
  //   if (etag.length !== 34) {
  //     console.warn(
  //       `Warning: ETag length is unexpected: ${etag.length} (ETag: ${etag})`,
  //     )
  //   }
  //   expect(etag.length).toBe(32 + 2) // 32 chars + 2 number of parts flag

  //   const dataArrayBuffer = await s3client.getObjectArrayBuffer(multipartKey)
  //   const dataBuffer = Buffer.from(dataArrayBuffer)
  //   expect(dataBuffer).toBeInstanceOf(Buffer)
  //   expect(dataBuffer.toString('utf-8')).toBe(large_buffer.toString('utf-8'))

  //   const multipartUpload = await s3client.listMultipartUploads()
  //   expect(multipartUpload).toBeDefined()
  //   expect(typeof multipartUpload).toBe('object')
  //   expect(multipartUpload).not.toHaveProperty('key')
  //   expect(multipartUpload).not.toHaveProperty('uploadId')

  //   if (providerName === 'cloudflare') {
  //     // Cloudflare SSE-C multipart upload
  //     const ssecHeaders = {
  //       'x-amz-server-side-encryption-customer-algorithm': 'AES256',
  //       'x-amz-server-side-encryption-customer-key':
  //         'n1TKiTaVHlYLMX9n0zHXyooMr026vOiTEFfT+719Hho=',
  //       'x-amz-server-side-encryption-customer-key-md5':
  //         'gepZmzgR7Be/1+K1Aw+6ow==',
  //     }
  //     const multipartKeySsec = 'multipart-object-ssec.txt'
  //     const uploadIdSsec = await s3client.getMultipartUploadId(
  //       multipartKeySsec,
  //       'text/plain',
  //       ssecHeaders,
  //     )
  //     const uploadPromises = []
  //     for (let i = 0; i < totalParts; i++) {
  //       const partBuffer = large_buffer.subarray(
  //         i * partSize,
  //         (i + 1) * partSize,
  //       )
  //       uploadPromises.push(
  //         s3client.uploadPart(
  //           multipartKeySsec,
  //           uploadIdSsec,
  //           partBuffer,
  //           i + 1,
  //           undefined,
  //           ssecHeaders,
  //         ),
  //       )
  //     }
  //     const uploadResponses = await Promise.all(uploadPromises)

  //     const parts = uploadResponses.map((response, index) => ({
  //       partNumber: index + 1,
  //       etag: response.etag,
  //     }))

  //     const completeResponse = await s3client.completeMultipartUpload(
  //       multipartKeySsec,
  //       uploadIdSsec,
  //       parts,
  //     )
  //     expect(completeResponse).toBeDefined()
  //     expect(typeof completeResponse).toBe('object')
  //     const etagSsec = completeResponse.etag
  //     expect(etagSsec).toBeDefined()
  //     expect(typeof etagSsec).toBe('string')
  //   }

  //   // lets test getObjectRaw with range
  //   const rangeStart = 2048 * 1024 // 2 MB
  //   const rangeEnd = 8 * 1024 * 1024 * 2 // 16 MB
  //   const rangeResponse = await s3client.getObjectRaw(
  //     multipartKey,
  //     false,
  //     rangeStart,
  //     rangeEnd,
  //   )
  //   const rangeData = await rangeResponse.arrayBuffer()
  //   expect(rangeResponse).toBeDefined()

  //   expect(rangeData).toBeInstanceOf(ArrayBuffer)
  //   const rangeBuffer = Buffer.from(rangeData)
  //   expect(rangeBuffer.toString('utf-8')).toBe(
  //     large_buffer.subarray(rangeStart, rangeEnd).toString('utf-8'),
  //   )

  //   const objectExists = await s3client.objectExists(multipartKey)
  //   expect(objectExists).toBe(true)
  //   const objectSize = await s3client.getContentLength(multipartKey)
  //   expect(objectSize).toBe(large_buffer.length)
  //   const objectEtag = await s3client.getEtag(multipartKey)
  //   expect(objectEtag).toBe(etag)
  //   expect(objectEtag.length).toBe(32 + 2) // 32 chars + 2 number of parts flag

  //   // test getEtag with opts mis/match
  //   const etagMatch = await s3client.getEtag(multipartKey, { 'if-match': etag })
  //   expect(etagMatch).toBe(etag)

  //   const etagMismatch = await s3client.getEtag(multipartKey, {
  //     'if-match': 'wrong-etag',
  //   })
  //   expect(etagMismatch).toBe(null)

  //   const delResp = await s3client.deleteObject(multipartKey)
  //   expect(delResp).toBe(true)

  //   const objectExists2 = await s3client.objectExists(multipartKey)
  //   expect(objectExists2).toBe(false)

  //   const deletedData = await s3client.getObject(multipartKey)
  //   expect(deletedData).toBe(null)
  // })
}
