import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts'
import { beforeAll, describe, expect, it } from 'vitest'
import { S3mini } from '../../src/s3-client/S3.js'
import { createSigV4Signer } from '../../src/s3-client/signer.js'
import type { UploadPart } from '../../src/s3-client/types.js'
import { randomBytes } from '../test-utils/browser-crypto.js'
import { accessKeyId, getConfig, secretAccessKey } from './config.js'

// @ts-expect-error todo
const config = getConfig(import.meta.env)

const suiteName = 'MinIO S3 client tests'

if (config) {
  const { endpoint, region } = config
  const presigner = createSigV4Signer({
    accessKeyId,
    secretAccessKey,
    region,
    endpoint,
  })

  const s3client = new S3mini({
    endpoint,
    region,
    signRequest: presigner,
  })

  const EIGHT_MB = 8 * 1024 * 1024
  const key_bin = 'test-multipart.bin'

  const large_buffer = randomBytes(EIGHT_MB * 3.2)
  const content = 'some content'
  const key = 'first-test-object.txt'
  const key_list_parts = 'test-list-parts.bin'
  const key_abort_multipart = 'test-abort-multipart.bin'

  const FILE_KEYS = [key, key_bin, key_list_parts, key_abort_multipart]

  beforeAll(async () => {
    for (const key of FILE_KEYS) {
      try {
        await s3client.deleteObject(key)
      } catch {
        // intentionally ignore the errors as the objects don't exists. still feels hacky tbh
      }
    }
  })

  /** Create STS client using @aws-sdk/client-sts */
  function createSTSClient({ endpoint, accessKeyId, secretAccessKey, region }) {
    return new STSClient({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    })
  }

  /** Get temporary credentials via AssumeRole */
  async function assumeRole(
    stsClient: STSClient,
    { durationSeconds = 900 } = {},
  ) {
    const response = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: 'aws:iam::000000000000:role/test-role', // MinIO doesn't validate ARN
        RoleSessionName: 'uppy-test',
        DurationSeconds: durationSeconds,
      }),
    )
    const creds = response.Credentials!
    return {
      AccessKeyId: creds.AccessKeyId,
      SecretAccessKey: creds.SecretAccessKey,
      SessionToken: creds.SessionToken,
      Expiration: creds.Expiration?.toISOString() || creds.Expiration,
    }
  }

  // ===== signRequest tests =====

  describe(suiteName, () => {
    it('simple putObject upload', async () => {
      const key = 'presigned-test-file.txt'
      const fileContents = new TextEncoder().encode(
        'Hello from pre-signed URL test.',
      )

      const result = await s3client.putObject(key, fileContents, 'text/plain')

      expect(result.ok).toBe(true)
      expect(result.location).toBeDefined()
      expect(result.location).toContain(key)
      // location should be a clean URL without query string (no signing params)
      expect(result.location).not.toContain('X-Amz-Signature')
      expect(result.location).not.toContain('?')
    })

    it('multipart upload with signRequest', async () => {
      const key = `presigned-multipart-${Date.now()}.bin`
      const partSize = 5 * 1024 * 1024 // 5MB
      const part = randomBytes(partSize)

      const uploadId = await s3client.createMultipartUpload(
        key,
        'application/octet-stream',
      )
      expect(uploadId).toBeDefined()

      const uploaded = await s3client.uploadPart(key, uploadId, part, 1)
      expect(uploaded.etag).toBeDefined()

      const result = await s3client.completeMultipartUpload(key, uploadId, [
        uploaded,
      ])
      expect(result.etag).toBeDefined()
      expect(result.location).toBeDefined()
      expect(result.location).toContain(key)
      expect(result.key).toBe(key)

      await s3client.deleteObject(key)
    })

    // ===== getCredentials tests (STS) =====

    describe('getCredentials (STS)', () => {
      const stsEndpoint = new URL(endpoint).origin

      it('should upload using getCredentials callback', async () => {
        const testKey = `sts-getcreds-${Date.now()}.txt`

        const s3 = new S3mini({
          endpoint,
          region,
          getCredentials: async () => {
            const stsClient = createSTSClient({
              endpoint: stsEndpoint,
              accessKeyId,
              secretAccessKey,
              region,
            })
            const creds = await assumeRole(stsClient)
            return {
              credentials: {
                accessKeyId: creds.AccessKeyId!,
                secretAccessKey: creds.SecretAccessKey!,
                sessionToken: creds.SessionToken!,
                expiration: creds.Expiration as string,
              },
              bucket: new URL(endpoint).pathname.slice(1),
              region,
            }
          },
        })

        try {
          const result = await s3.putObject(testKey, 'Hello STS!', 'text/plain')
          expect(result.ok).toBe(true)
          expect(result.location).toBeDefined()
          expect(result.location).toContain(testKey)
          expect(result.location).not.toContain('X-Amz-Signature')
          expect(result.location).not.toContain('?')
        } finally {
          await s3.deleteObject(testKey)
        }
      })

      it('should cache credentials across multiple requests', async () => {
        let fetchCount = 0

        const s3 = new S3mini({
          endpoint,
          region,
          getCredentials: async () => {
            fetchCount++
            const stsClient = createSTSClient({
              endpoint: stsEndpoint,
              accessKeyId,
              secretAccessKey,
              region,
            })
            const creds = await assumeRole(stsClient)
            return {
              credentials: {
                accessKeyId: creds.AccessKeyId!,
                secretAccessKey: creds.SecretAccessKey!,
                sessionToken: creds.SessionToken!,
                expiration: creds.Expiration as string,
              },
              bucket: new URL(endpoint).pathname.slice(1),
              region,
            }
          },
        })

        await s3.putObject(
          `sts-cache-1-${Date.now()}.txt`,
          'File 1',
          'text/plain',
        )
        await s3.putObject(
          `sts-cache-2-${Date.now()}.txt`,
          'File 2',
          'text/plain',
        )
        expect(fetchCount).toBe(1)
      })

      it('should perform multipart upload with getCredentials', async () => {
        const s3 = new S3mini({
          endpoint,
          region,
          getCredentials: async () => {
            const stsClient = createSTSClient({
              endpoint: stsEndpoint,
              accessKeyId,
              secretAccessKey,
              region,
            })
            const creds = await assumeRole(stsClient)
            return {
              credentials: {
                accessKeyId: creds.AccessKeyId!,
                secretAccessKey: creds.SecretAccessKey!,
                sessionToken: creds.SessionToken!,
                expiration: creds.Expiration as string,
              },
              bucket: new URL(endpoint).pathname.slice(1),
              region,
            }
          },
        })

        const key = `sts-multipart-${Date.now()}.bin`
        const partSize = 5 * 1024 * 1024 // 5MB
        const part = randomBytes(partSize)

        const uploadId = await s3.createMultipartUpload(
          key,
          'application/octet-stream',
        )
        expect(uploadId).toBeDefined()

        const uploaded = await s3.uploadPart(key, uploadId, part, 1)
        expect(uploaded.etag).toBeDefined()

        const result = await s3.completeMultipartUpload(key, uploadId, [
          uploaded,
        ])
        expect(result.etag).toBeDefined()
        expect(result.location).toBeDefined()
        expect(result.location).toContain(key)
        expect(result.key).toBe(key)

        await s3.deleteObject(key)
      })
    })

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

    // test createMultipartUpload

    it('createMultipartUpload returns a valid uploadId', async () => {
      const uploadId = await s3client.createMultipartUpload(
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

      const uploadId = await s3client.createMultipartUpload(
        key_bin,
        'application/octet-stream',
      )

      // upload part
      const partResult = await s3client.uploadPart(
        key_bin,
        uploadId,
        partData,
        1,
      )

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
      const totalParts = Math.ceil(large_buffer.byteLength / partSize)

      const uploadId = await s3client.createMultipartUpload(
        key_bin,
        'application/octet-stream',
      )
      expect(uploadId).toBeDefined()

      // upload all parts
      const uploadPromises: Promise<UploadPart>[] = []
      for (let i = 0; i < totalParts; i++) {
        const partBuffer = large_buffer.subarray(
          i * partSize,
          (i + 1) * partSize,
        )
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
      const uploadId = await s3client.createMultipartUpload(
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

      const uploadId = await s3client.createMultipartUpload(
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
  })
} else {
  console.warn(
    'Skipping MinIO S3 client tests: missing env variable VITE_MINIO_CONFIG',
  )
  describe.skip(suiteName, () => {
    it('noop', () => {})
  })
}
