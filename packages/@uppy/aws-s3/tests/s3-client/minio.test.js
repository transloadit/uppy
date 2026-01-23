import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts'
import { describe, expect, inject, it, vi } from 'vitest'
import { S3mini } from '../../src/s3-client/S3.js'
import { createSigV4Signer } from '../../src/s3-client/signer.js'
import { randomBytes } from '../test-utils/browser-crypto.js'
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

  const presigner = createSigV4Signer({
    accessKeyId: bucket.accessKeyId,
    secretAccessKey: bucket.secretAccessKey,
    region: bucket.region,
    endpoint: bucket.endpoint,
  })

  const s3client = new S3mini({
    endpoint: bucket.endpoint,
    region: bucket.region,
    signRequest: presigner,
  })

  cleanupTestBeforeAll(s3client)

  // ===== signRequest tests =====

  it('simple putObject upload', async () => {
    const fileContents = new TextEncoder().encode(
      'Hello from pre-signed URL test.',
    )

    const result = await s3client.putObject(
      'presigned-test-file.txt',
      fileContents,
      'text/plain',
    )

    expect(result.ok).toBe(true)
  })

  it('multipart upload with signRequest', async () => {
    const key = `presigned-multipart-${Date.now()}.bin`
    const partSize = 5 * 1024 * 1024 // 5MB
    const part = randomBytes(partSize)

    const uploadId = await s3client.getMultipartUploadId(
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

    await s3client.deleteObject(key)
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

      try {
        const result = await s3.putObject(testKey, 'Hello STS!', 'text/plain')
        expect(result.ok).toBe(true)
      } finally {
        await s3.deleteObject(testKey)
      }
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
      const part = randomBytes(partSize)

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
  })
}

beforeRun(raw, name, minioSpecific)
