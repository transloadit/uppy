import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts'
import { describe, expect, inject, it, vi } from 'vitest'
import { S3mini } from '../../src/s3-client/S3.ts'

vi.setConfig({ testTimeout: 120_000 })

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
      RoleArn: 'arn:xxx:xxx:xxx:xxxx', // MinIO doesn't validate ARN
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

/**
 * STS Tests - Tests S3mini's getCredentials callback functionality
 */
describe('STS Temporary Credentials', () => {
  const bucketConfigs = inject('bucketConfigs') || []
  const minioBucket = bucketConfigs.find((cfg) => cfg.provider === 'minio')

  if (!minioBucket) {
    it.skip('Minio not configured - set BUCKET_ENV_MINIO', () => {})
    return
  }

  const { endpoint, region, accessKeyId, secretAccessKey } = minioBucket
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
            accessKeyId: creds.AccessKeyId,
            secretAccessKey: creds.SecretAccessKey,
            sessionToken: creds.SessionToken,
            expiration: creds.Expiration,
          },
          bucket: new URL(endpoint).pathname.slice(1),
          region,
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
            accessKeyId: creds.AccessKeyId,
            secretAccessKey: creds.SecretAccessKey,
            sessionToken: creds.SessionToken,
            expiration: creds.Expiration,
          },
          bucket: new URL(endpoint).pathname.slice(1),
          region,
        }
      },
    })

    // Two uploads should only fetch credentials once
    await s3.putObject(`sts-cache-1-${Date.now()}.txt`, 'File 1', 'text/plain')
    await s3.putObject(`sts-cache-2-${Date.now()}.txt`, 'File 2', 'text/plain')

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
            accessKeyId: creds.AccessKeyId,
            secretAccessKey: creds.SecretAccessKey,
            sessionToken: creds.SessionToken,
            expiration: creds.Expiration,
          },
          bucket: new URL(endpoint).pathname.slice(1),
          region,
        }
      },
    })

    const key = `sts-multipart-${Date.now()}.bin`
    const partSize = 5 * 1024 * 1024 // 5MB

    // Generate random data
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
})
