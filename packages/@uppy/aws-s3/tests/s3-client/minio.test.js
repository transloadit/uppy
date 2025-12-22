import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts'
import { describe, expect, inject, it, vi } from 'vitest'
import { S3mini } from '../../src/s3-client/S3.js'
import { createSigV4Signer } from '../../src/s3-client/signer.js'
import { sha1Base64 } from '../test-utils/browser-crypto.js'
import { beforeRun, cleanupTestBeforeAll } from './_shared.test.js'

const name = 'minio'

// Get bucket configs from globalSetup via Vitest inject
const bucketConfigs = inject('bucketConfigs') || []
const raw = bucketConfigs.find((c) => c.provider === name)
  ? [
      bucketConfigs.find((c) => c.provider === name).provider,
      bucketConfigs.find((c) => c.provider === name).accessKeyId,
      bucketConfigs.find((c) => c.provider === name).secretAccessKey,
      bucketConfigs.find((c) => c.provider === name).endpoint,
      bucketConfigs.find((c) => c.provider === name).region,
    ]
  : null

/** Create STS client using @aws-sdk/client-sts */
function createSTSClient({ endpoint, accessKeyId, secretAccessKey, region }) {
  return new STSClient({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })
}

/** Get temporary credentials via AssumeRole */
async function assumeRole(stsClient, { durationSeconds = 900 } = {}) {
  const response = await stsClient.send(
    new AssumeRoleCommand({
      RoleArn: 'aws:iam::000000000000:role/test-role', // MinIO doesn't validate ARN
      RoleSessionName: 'uppy-test',
      DurationSeconds: durationSeconds,
    }),
  )
  const creds = response.Credentials
  return {
    AccessKeyId: creds.AccessKeyId,
    SecretAccessKey: creds.SecretAccessKey,
    SessionToken: creds.SessionToken,
    Expiration: creds.Expiration?.toISOString() || creds.Expiration,
  }
}

const minioSpecific = (bucket) => {
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

  // ===== signRequest tests =====

  it('put object with valid x-amz-checksum-sha1 header', async () => {
    const fileContents = new TextEncoder().encode('Some file contents.')
    const fileHash = await sha1Base64(fileContents)

    const result = await s3client.putObject(
      'validated-file-one.txt',
      fileContents,
      'text/plain',
      undefined,
      {
        'x-amz-checksum-sha1': fileHash,
      },
    )

    expect(result.ok).toBe(true)
    expect(result.headers.get('x-amz-checksum-sha1')).toBe(fileHash)
  })

  it('put object with invalid x-amz-checksum-sha1', async () => {
    const fileContents = new TextEncoder().encode('Some file contents.')
    // Hash different content to create mismatch
    const wrongContents = new TextEncoder().encode(
      'Some file contents.Make the hash faulty.',
    )
    const fileHash = await sha1Base64(wrongContents)

    expect.assertions(2)
    try {
      const _wrongResponse = await s3client.putObject(
        'validated-file-two.txt',
        fileContents,
        'text/plain',
        undefined,
        {
          'x-amz-checksum-sha1': fileHash,
        },
      )
    } catch (err) {
      expect(err).toBeDefined()
      expect(err.code).toBe('XAmzContentChecksumMismatch')
    }
  })

  // ===== getCredentials tests (STS) =====

  describe('getCredentials (STS)', () => {
    const stsEndpoint = new URL(bucket.endpoint).origin

    it('should upload using getCredentials callback', async () => {
      const testKey = `sts-getcreds-${Date.now()}.txt`

      const s3 = new S3mini({
        endpoint: bucket.endpoint,
        region: bucket.region,
        getCredentials: async () => {
          const stsClient = createSTSClient({
            endpoint: stsEndpoint,
            accessKeyId: bucket.accessKeyId,
            secretAccessKey: bucket.secretAccessKey,
            region: bucket.region,
          })
          const creds = await assumeRole(stsClient)
          return {
            credentials: {
              accessKeyId: creds.AccessKeyId,
              secretAccessKey: creds.SecretAccessKey,
              sessionToken: creds.SessionToken,
              expiration: creds.Expiration,
            },
            bucket: new URL(bucket.endpoint).pathname.slice(1),
            region: bucket.region,
          }
        },
      })

      const result = await s3.putObject(testKey, 'Hello STS!', 'text/plain')
      expect(result.ok).toBe(true)
      await s3.deleteObject(testKey)
    })

    it('should cache credentials across multiple requests', async () => {
      let fetchCount = 0

      const s3 = new S3mini({
        endpoint: bucket.endpoint,
        region: bucket.region,
        getCredentials: async () => {
          fetchCount++
          const stsClient = createSTSClient({
            endpoint: stsEndpoint,
            accessKeyId: bucket.accessKeyId,
            secretAccessKey: bucket.secretAccessKey,
            region: bucket.region,
          })
          const creds = await assumeRole(stsClient)
          return {
            credentials: {
              accessKeyId: creds.AccessKeyId,
              secretAccessKey: creds.SecretAccessKey,
              sessionToken: creds.SessionToken,
              expiration: creds.Expiration,
            },
            bucket: new URL(bucket.endpoint).pathname.slice(1),
            region: bucket.region,
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
        endpoint: bucket.endpoint,
        region: bucket.region,
        getCredentials: async () => {
          const stsClient = createSTSClient({
            endpoint: stsEndpoint,
            accessKeyId: bucket.accessKeyId,
            secretAccessKey: bucket.secretAccessKey,
            region: bucket.region,
          })
          const creds = await assumeRole(stsClient)
          return {
            credentials: {
              accessKeyId: creds.AccessKeyId,
              secretAccessKey: creds.SecretAccessKey,
              sessionToken: creds.SessionToken,
              expiration: creds.Expiration,
            },
            bucket: new URL(bucket.endpoint).pathname.slice(1),
            region: bucket.region,
          }
        },
      })

      const key = `sts-multipart-${Date.now()}.bin`
      const partSize = 5 * 1024 * 1024 // 5MB

      const part = new Uint8Array(partSize)
      for (let i = 0; i < part.length; i += 65536) {
        crypto.getRandomValues(
          new Uint8Array(part.buffer, i, Math.min(65536, part.length - i)),
        )
      }

      const uploadId = await s3.getMultipartUploadId(
        key,
        'application/octet-stream',
      )
      expect(uploadId).toBeDefined()

      const uploaded = await s3.uploadPart(key, uploadId, part, 1)
      expect(uploaded.etag).toBeDefined()

      const result = await s3.completeMultipartUpload(key, uploadId, [uploaded])
      expect(result.etag).toBeDefined()

      await s3.deleteObject(key)
    })

    it('should refetch credentials when they are expired', async () => {
      let fetchCount = 0
      let returnExpired = true

      const s3 = new S3mini({
        endpoint: bucket.endpoint,
        region: bucket.region,
        getCredentials: async () => {
          fetchCount++
          const stsClient = createSTSClient({
            endpoint: stsEndpoint,
            accessKeyId: bucket.accessKeyId,
            secretAccessKey: bucket.secretAccessKey,
            region: bucket.region,
          })
          const creds = await assumeRole(stsClient)
          return {
            credentials: {
              accessKeyId: creds.AccessKeyId,
              secretAccessKey: creds.SecretAccessKey,
              sessionToken: creds.SessionToken,
              // First call returns expired, second returns valid
              expiration: returnExpired
                ? new Date(Date.now() - 1000).toISOString() // Expired
                : new Date(Date.now() + 600000).toISOString(), // Valid 10 min
            },
            bucket: new URL(bucket.endpoint).pathname.slice(1),
            region: bucket.region,
          }
        },
      })

      // First request - credentials fetched (expired)
      await s3.putObject(`expiry-1-${Date.now()}.txt`, 'test1', 'text/plain')
      expect(fetchCount).toBe(1)

      // Second request - should refetch because cached are expired
      returnExpired = false // Now return valid credentials
      await s3.putObject(`expiry-2-${Date.now()}.txt`, 'test2', 'text/plain')
      expect(fetchCount).toBe(2) // Refetched!

      // Third request - should use cache (not expired anymore)
      await s3.putObject(`expiry-3-${Date.now()}.txt`, 'test3', 'text/plain')
      expect(fetchCount).toBe(2) // Cached!
    })
  })
}

beforeRun(raw, name, minioSpecific)
