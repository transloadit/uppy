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

    it('should retry with fresh credentials on ExpiredToken error', async () => {
      let fetchCount = 0
      let firstRequest = true

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
              expiration: new Date(Date.now() + 600000).toISOString(),
            },
            bucket: new URL(bucket.endpoint).pathname.slice(1),
            region: bucket.region,
          }
        },
      })

      // Monkey-patch _sendRequest to throw ExpiredToken on first call
      const originalSendRequest = s3._sendRequest.bind(s3)
      s3._sendRequest = async (...args) => {
        if (firstRequest) {
          firstRequest = false
          const { S3ServiceError } = await import(
            '../../src/s3-client/utils.js'
          )
          throw new S3ServiceError('Token expired', 403, 'ExpiredToken', '')
        }
        return originalSendRequest(...args)
      }

      const result = await s3.putObject(
        `retry-${Date.now()}.txt`,
        'test',
        'text/plain',
      )
      expect(result.ok).toBe(true)
      expect(fetchCount).toBe(2) // Initial + retry after ExpiredToken
    })

    // Tests that retry logic works when first credentials are invalid
    it('should retry with fresh credentials when first credentials are invalid', async () => {
      let fetchCount = 0
      let returnInvalidCreds = true

      const stsClient = createSTSClient({
        endpoint: stsEndpoint,
        accessKeyId: bucket.accessKeyId,
        secretAccessKey: bucket.secretAccessKey,
        region: bucket.region,
      })

      const s3 = new S3mini({
        endpoint: bucket.endpoint,
        region: bucket.region,
        getCredentials: async () => {
          fetchCount++
          if (returnInvalidCreds) {
            returnInvalidCreds = false
            console.log(
              `[getCredentials #${fetchCount}] Returning INVALID credentials`,
            )
            return {
              credentials: {
                accessKeyId: 'wrong_access_key',
                secretAccessKey: 'wrong_secret_key',
                sessionToken: 'wrong_token',
                expiration: new Date(Date.now() + 600000).toISOString(),
              },
              bucket: new URL(bucket.endpoint).pathname.slice(1),
              region: bucket.region,
            }
          } else {
            // Fetch valid credentials for retry
            const freshCreds = await assumeRole(stsClient, {
              durationSeconds: 900,
            })
            console.log(
              `[getCredentials #${fetchCount}] Returning VALID credentials`,
            )
            return {
              credentials: {
                accessKeyId: freshCreds.AccessKeyId,
                secretAccessKey: freshCreds.SecretAccessKey,
                sessionToken: freshCreds.SessionToken,
                expiration: freshCreds.Expiration,
              },
              bucket: new URL(bucket.endpoint).pathname.slice(1),
              region: bucket.region,
            }
          }
        },
      })

      // Intercept to log the error
      const originalSendRequest = s3._sendRequest.bind(s3)
      s3._sendRequest = async (...args) => {
        try {
          return await originalSendRequest(...args)
        } catch (err) {
          console.log('🔴 Got error from MinIO:', err.code, err.message)
          throw err
        }
      }

      // First attempt fails with InvalidAccessKeyId, retry succeeds
      const result = await s3.putObject(
        `invalid-creds-test-${Date.now()}.txt`,
        'Testing invalid credentials retry',
        'text/plain',
      )

      console.log('✓ Upload succeeded after retry!')
      expect(result.ok).toBe(true)
      expect(fetchCount).toBe(2) // Invalid + valid after error
    })

    // Skip by default - this test takes 15+ minutes!
    // Run manually with: it.only('should retry...') instead of it.skip
    it.skip(
      'should retry with fresh credentials on expired credentials from MinIO',
      { timeout: 1200000 },
      async () => {
        let fetchCount = 0
        let expiredCredsUsed = false

        const stsClient = createSTSClient({
          endpoint: stsEndpoint,
          accessKeyId: bucket.accessKeyId,
          secretAccessKey: bucket.secretAccessKey,
          region: bucket.region,
        })

        // Get initial credentials with minimum duration (900 seconds = 15 min)
        const initialCreds = await assumeRole(stsClient, {
          durationSeconds: 900,
        })
        console.log(
          '✓ Got initial credentials, expires at:',
          initialCreds.Expiration,
        )

        const s3 = new S3mini({
          endpoint: bucket.endpoint,
          region: bucket.region,
          getCredentials: async () => {
            fetchCount++
            if (!expiredCredsUsed) {
              expiredCredsUsed = true
              console.log(
                `[getCredentials #${fetchCount}] Returning EXPIRED credentials`,
              )
              return {
                credentials: {
                  accessKeyId: initialCreds.AccessKeyId,
                  secretAccessKey: initialCreds.SecretAccessKey,
                  sessionToken: initialCreds.SessionToken,
                  expiration: initialCreds.Expiration,
                },
                bucket: new URL(bucket.endpoint).pathname.slice(1),
                region: bucket.region,
              }
            } else {
              // Fetch fresh credentials for retry
              const freshCreds = await assumeRole(stsClient, {
                durationSeconds: 900,
              })
              console.log(
                `[getCredentials #${fetchCount}] Returning FRESH credentials`,
              )
              return {
                credentials: {
                  accessKeyId: freshCreds.AccessKeyId,
                  secretAccessKey: freshCreds.SecretAccessKey,
                  sessionToken: freshCreds.SessionToken,
                  expiration: freshCreds.Expiration,
                },
                bucket: new URL(bucket.endpoint).pathname.slice(1),
                region: bucket.region,
              }
            }
          },
        })

        // Wait for credentials to expire (15 min + 30 sec buffer)
        const waitMs = 15 * 60 * 1000 + 30 * 1000
        console.log(
          `⏳ Waiting ${waitMs / 1000 / 60} minutes for credentials to expire...`,
        )
        await new Promise((resolve) => setTimeout(resolve, waitMs))
        console.log('✓ Wait complete, credentials should now be expired')

        // Intercept to log the error
        const originalSendRequest = s3._sendRequest.bind(s3)
        s3._sendRequest = async (...args) => {
          try {
            return await originalSendRequest(...args)
          } catch (err) {
            console.log('🔴 Got error from MinIO:', err.code, err.message)
            throw err
          }
        }

        // This should fail with InvalidAccessKeyId (expired STS), then retry with fresh creds
        const result = await s3.putObject(
          `real-expiry-test-${Date.now()}.txt`,
          'Testing real credential expiry',
          'text/plain',
        )

        console.log('✓ Upload succeeded after retry!')
        expect(result.ok).toBe(true)
        expect(fetchCount).toBe(2) // Initial expired + fresh after error

        // Cleanup
        s3.destroy()
      },
    )
  })
}

beforeRun(raw, name, minioSpecific)
