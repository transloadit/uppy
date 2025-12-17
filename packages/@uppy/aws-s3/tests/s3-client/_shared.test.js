import { beforeAll, describe, expect, it, vi } from 'vitest'
import { S3mini } from '../../src/s3-client/index.js'
import { randomBytes } from '../test-utils/browser-crypto.js'
import { createSigV4Signer } from '../../src/s3-client/signer.js'

let _providerName

export const beforeRun = (raw, name, providerSpecific) => {
  if (!raw) {
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
      _providerName = credentials.provider
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
const key_bin = 'test-multipart.bin'

const large_buffer = randomBytes(EIGHT_MB * 3.2)
const content = 'some content'
const key = 'first-test-object.txt'
const key_list_parts = 'test-list-parts.bin'
const key_abort_multipart = 'test-abort-multipart.bin'

const FILE_KEYS = [key, key_bin, key_list_parts, key_abort_multipart]

export const cleanupTestBeforeAll = (s3client) => {
  beforeAll(async () => {
    for (const key of FILE_KEYS) {
      try {
        await s3client.deleteObject(key)
      } catch {
        // intentionally ignore the errors as the objects don't exists. still feels hacky tbh
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

  it('putObject handles binary data', async () => {
    const binaryData = new Uint8Array(6).fill(0xff)

    const response = await s3client.putObject(
      key,
      binaryData,
      'application/octet-stream',
    )

    expect(response).toBeDefined()
    expect(response.status).toBe(200)
    expect(response.headers.get('etag')).toBeDefined()

    // cleanup

    await s3client.deleteObject(key)
  })

  // test getMultipartUploadId

  it('getMultipartUploadId returns a valid uploadId', async () => {
    const uploadId = await s3client.getMultipartUploadId(
      key_bin,
      'application/octet-stream',
    )
    expect(uploadId).toBeDefined()
    expect(typeof uploadId).toBe('string')
    expect(uploadId.length).toBeGreaterThan(0)

    // cleanup
    await s3client.abortMultipartUpload(key, uploadId)
  })

  // test uploadPart

  it('uploadPart returns partNumber and Etag', async () => {
    const partData = randomBytes(EIGHT_MB)

    const uploadId = await s3client.getMultipartUploadId(
      key_bin,
      'application/octet-stream',
    )

    // upload part
    const partResult = await s3client.uploadPart(key_bin, uploadId, partData, 1)

    expect(partResult).toBeDefined()
    expect(partResult.partNumber).toBe(1)
    expect(partResult.etag).toBeDefined()
    expect(typeof partResult.etag).toBe('string')
    expect(partResult.etag.length).toBe(32)

    // cleanup
    await s3client.abortMultipartUpload(key, uploadId)
  })

  // end to end multipart flow

  it('completeMultipartUpload assembles parts correctly', async () => {
    // key - key_bin
    const partSize = EIGHT_MB
    const totalParts = Math.ceil(large_buffer.length / partSize)

    const uploadId = await s3client.getMultipartUploadId(
      key_bin,
      'application/octet-stream',
    )
    expect(uploadId).toBeDefined()

    // upload all parts
    const uploadPromises = []
    for (let i = 0; i < totalParts; i++) {
      const partBuffer = large_buffer.subarray(i * partSize, (i + 1) * partSize)
      uploadPromises.push(
        s3client.uploadPart(key_bin, uploadId, partBuffer, i + 1),
      )
    }
    const uploadResponses = await Promise.all(uploadPromises)

    // verify all parts uploaded succesfully

    expect(uploadResponses.length).toBe(totalParts)

    uploadResponses.forEach((response, index) => {
      expect(response.partNumber).toBe(index + 1)
      expect(response.etag).toBeDefined()
    })

    // create multipart upload

    const parts = uploadResponses.map((response) => ({
      partNumber: response.partNumber,
      etag: response.etag,
    }))

    const completeResponse = await s3client.completeMultipartUpload(
      key_bin,
      uploadId,
      parts,
    )

    expect(completeResponse).toBeDefined()
    expect(typeof completeResponse).toBe('object')
    expect(completeResponse.etag).toBeDefined()
    expect(typeof completeResponse.etag).toBe('string')
    expect(completeResponse.etag.length).toBe(32 + 2)

    // cleanup

    await s3client.deleteObject(key_bin)
  })

  it('abortMultipartUpload cancels upload successfully', async () => {
    // start upload
    const uploadId = await s3client.getMultipartUploadId(
      key_abort_multipart,
      'application/octet-stream',
    )

    expect(uploadId).toBeDefined()

    const partData = randomBytes(EIGHT_MB)
    await s3client.uploadPart(key_abort_multipart, uploadId, partData, 1)

    // abort
    const abortResult = await s3client.abortMultipartUpload(
      key_abort_multipart,
      uploadId,
    )

    expect(abortResult).toBeDefined()
    expect(abortResult.status).toBe('Aborted')
    expect(abortResult.key).toBe(key_abort_multipart)
    expect(abortResult.uploadId).toBe(uploadId)
  })

  it('listParts returns uploaded parts correctly', async () => {
    const partSize = EIGHT_MB

    const uploadId = await s3client.getMultipartUploadId(
      key_list_parts,
      'application/octet-stream',
    )
    expect(uploadId).toBeDefined()

    const part1Data = randomBytes(partSize)
    const part2Data = randomBytes(partSize)

    const part1Result = await s3client.uploadPart(
      key_list_parts,
      uploadId,
      part1Data,
      1,
    )
    const part2Result = await s3client.uploadPart(
      key_list_parts,
      uploadId,
      part2Data,
      2,
    )

    const parts = await s3client.listParts(uploadId, key_list_parts)

    expect(parts).toBeInstanceOf(Array)
    expect(parts.length).toBe(2)

    // verify part 1
    expect(parts[0].partNumber).toBe(1)
    expect(parts[0].etag).toBe(part1Result.etag)

    // verify part 2
    expect(parts[1].partNumber).toBe(2)
    expect(parts[1].etag).toBe(part2Result.etag)

    // cleanup abort upload
    await s3client.abortMultipartUpload(key, uploadId)
  })
}
