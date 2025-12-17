import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts'
import { describe, expect, inject, it, vi } from 'vitest'
import { S3mini } from '../../src/s3-client/S3.ts'
import { createSigV4Signer } from '../../src/s3-client/signer.ts'

vi.setConfig({ testTimeout: 120_000 })

/**
 * Helper function to create an STS client using @aws-sdk/client-sts
 * This replaces the custom sts-client.js implementation
 */
function createAWSStsClient({
  endpoint,
  accessKeyId,
  secretAccessKey,
  region,
}) {
  return new STSClient({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

/**
 * Helper function to assume role and get temporary credentials
 */
async function assumeRole(stsClient, { durationSeconds = 3600 } = {}) {
  const command = new AssumeRoleCommand({
    RoleArn: 'arn:xxx:xxx:xxx:xxxx', // MinIO doesn't validate ARN format
    RoleSessionName: 'uppy-test',
    DurationSeconds: durationSeconds,
  })

  const response = await stsClient.send(command)
  const creds = response.Credentials

  return {
    AccessKeyId: creds.AccessKeyId,
    SecretAccessKey: creds.SecretAccessKey,
    SessionToken: creds.SessionToken,
    Expiration: creds.Expiration?.toISOString() || creds.Expiration,
  }
}

/**
 * STS Temporary Credentials Tests
 *
 * These tests verify:
 * 1. Getting temporary credentials from MinIO STS using @aws-sdk/client-sts
 * 2. Using temporary credentials to sign S3 requests
 * 3. Uploading files with temporary credentials
 */
describe('STS Temporary Credentials', () => {
  const bucketConfigs = inject('bucketConfigs') || []
  const minioBucket = bucketConfigs.find((cfg) => cfg.provider === 'minio')

  if (!minioBucket) {
    it.skip('Minio bucket not configured - set BUCKET_ENV_MINIO', () => {})
    return
  }

  const {
    endpoint,
    region,
    accessKeyId: stsAccessKeyId,
    secretAccessKey: stsSecretAccessKey,
  } = minioBucket
  const bucketEndpoint = endpoint // includes bucket name
  const stsEndpoint = new URL(endpoint).origin // just host:port for STS

  describe('assumeRole', () => {
    it('should get temporary credentials from MinIO STS using @aws-sdk/client-sts', async () => {
      const stsClient = createAWSStsClient({
        endpoint: stsEndpoint,
        accessKeyId: stsAccessKeyId,
        secretAccessKey: stsSecretAccessKey,
        region,
      })

      const credentials = await assumeRole(stsClient, { durationSeconds: 900 })

      expect(credentials.AccessKeyId).toBeDefined()
      expect(credentials.SecretAccessKey).toBeDefined()
      expect(credentials.SessionToken).toBeDefined()
      expect(credentials.Expiration).toBeDefined()

      // Temp credentials should be different from original credentials
      expect(credentials.AccessKeyId).not.toBe(stsAccessKeyId)
    })
  })

  describe('upload with temporary credentials', () => {
    const testKey = `sts-test-${Date.now()}.txt`
    const testContent = 'Hello from temporary credentials!'

    it('should upload file using temporary credentials', async () => {
      // Step 1: Get temporary credentials using @aws-sdk/client-sts
      const stsClient = createAWSStsClient({
        endpoint: stsEndpoint,
        accessKeyId: stsAccessKeyId,
        secretAccessKey: stsSecretAccessKey,
        region,
      })

      const tempCreds = await assumeRole(stsClient, { durationSeconds: 900 })

      // Step 2: Create signer with temporary credentials (using test signer)
      const signer = createSigV4Signer({
        accessKeyId: tempCreds.AccessKeyId,
        secretAccessKey: tempCreds.SecretAccessKey,
        sessionToken: tempCreds.SessionToken,
        region,
      })

      // Step 3: Create S3 client and upload
      const s3 = new S3mini({
        endpoint: bucketEndpoint,
        signRequest: signer,
        region,
      })

      const result = await s3.putObject(testKey, testContent, 'text/plain')

      expect(result.ok).toBe(true)
      expect(result.status).toBe(200)

      // Cleanup
      await s3.deleteObject(testKey)
    })

    it('should perform multipart upload with temporary credentials', async () => {
      // Step 1: Get temporary credentials using @aws-sdk/client-sts
      const stsClient = createAWSStsClient({
        endpoint: stsEndpoint,
        accessKeyId: stsAccessKeyId,
        secretAccessKey: stsSecretAccessKey,
        region,
      })

      const tempCreds = await assumeRole(stsClient, { durationSeconds: 900 })

      // Step 2: Create signer with temporary credentials (using test signer)
      const signer = createSigV4Signer({
        accessKeyId: tempCreds.AccessKeyId,
        secretAccessKey: tempCreds.SecretAccessKey,
        sessionToken: tempCreds.SessionToken,
        region,
      })

      // Step 3: Create S3 client
      const s3 = new S3mini({
        endpoint: bucketEndpoint,
        signRequest: signer,
        region,
      })

      const multipartKey = `sts-multipart-${Date.now()}.bin`
      const partSize = 5 * 1024 * 1024 // 5MB minimum part size

      // Generate random data for two parts (chunked to avoid browser's 65536 byte limit)
      const fillRandom = (arr) => {
        const chunkSize = 65536
        for (let i = 0; i < arr.length; i += chunkSize) {
          const chunk = new Uint8Array(
            arr.buffer,
            i,
            Math.min(chunkSize, arr.length - i),
          )
          crypto.getRandomValues(chunk)
        }
      }

      const part1 = new Uint8Array(partSize)
      const part2 = new Uint8Array(partSize)
      fillRandom(part1)
      fillRandom(part2)

      // Step 4: Initiate multipart upload
      const uploadId = await s3.getMultipartUploadId(
        multipartKey,
        'application/octet-stream',
      )
      expect(uploadId).toBeDefined()

      // Step 5: Upload parts
      const uploadedPart1 = await s3.uploadPart(
        multipartKey,
        uploadId,
        part1,
        1,
      )
      const uploadedPart2 = await s3.uploadPart(
        multipartKey,
        uploadId,
        part2,
        2,
      )

      expect(uploadedPart1.etag).toBeDefined()
      expect(uploadedPart2.etag).toBeDefined()

      // Step 6: Complete multipart upload
      const completeResult = await s3.completeMultipartUpload(
        multipartKey,
        uploadId,
        [uploadedPart1, uploadedPart2],
      )

      expect(completeResult.etag).toBeDefined()

      // Cleanup
      await s3.deleteObject(multipartKey)
    })
  })

  describe('S3mini with getCredentials callback', () => {
    it('should upload file using getCredentials callback (client-side signing)', async () => {
      // This test demonstrates the new getCredentials callback approach
      // where S3mini fetches credentials and handles signing internally

      const testKey = `sts-getcreds-${Date.now()}.txt`
      const testContent = 'Hello from getCredentials callback!'

      // Create S3 client with getCredentials callback using @aws-sdk/client-sts
      // In real usage, this would call your backend endpoint
      const s3 = new S3mini({
        endpoint: bucketEndpoint,
        region,
        getCredentials: async () => {
          const stsClient = createAWSStsClient({
            endpoint: stsEndpoint,
            accessKeyId: stsAccessKeyId,
            secretAccessKey: stsSecretAccessKey,
            region,
          })

          const tempCreds = await assumeRole(stsClient, {
            durationSeconds: 900,
          })

          return {
            credentials: {
              accessKeyId: tempCreds.AccessKeyId,
              secretAccessKey: tempCreds.SecretAccessKey,
              sessionToken: tempCreds.SessionToken,
              expiration: tempCreds.Expiration,
            },
            bucket: new URL(bucketEndpoint).pathname.slice(1),
            region,
          }
        },
      })

      // Upload - S3mini handles signing internally
      const result = await s3.putObject(testKey, testContent, 'text/plain')

      expect(result.ok).toBe(true)
      expect(result.status).toBe(200)

      // Cleanup
      await s3.deleteObject(testKey)
    })

    it('should cache credentials and reuse them', async () => {
      const testKey1 = `sts-cache-1-${Date.now()}.txt`
      const testKey2 = `sts-cache-2-${Date.now()}.txt`

      let credentialsFetchCount = 0

      const s3 = new S3mini({
        endpoint: bucketEndpoint,
        region,
        getCredentials: async () => {
          credentialsFetchCount++

          const stsClient = createAWSStsClient({
            endpoint: stsEndpoint,
            accessKeyId: stsAccessKeyId,
            secretAccessKey: stsSecretAccessKey,
            region,
          })

          const tempCreds = await assumeRole(stsClient, {
            durationSeconds: 900,
          })

          return {
            credentials: {
              accessKeyId: tempCreds.AccessKeyId,
              secretAccessKey: tempCreds.SecretAccessKey,
              sessionToken: tempCreds.SessionToken,
              expiration: tempCreds.Expiration,
            },
            bucket: new URL(bucketEndpoint).pathname.slice(1),
            region,
          }
        },
      })

      // First upload - should fetch credentials
      const result1 = await s3.putObject(testKey1, 'First file', 'text/plain')
      expect(result1.ok).toBe(true)

      // Second upload - should reuse cached credentials
      const result2 = await s3.putObject(testKey2, 'Second file', 'text/plain')
      expect(result2.ok).toBe(true)

      // Should only have fetched credentials once (cached)
      expect(credentialsFetchCount).toBe(1)

      // Cleanup
      await s3.deleteObject(testKey1)
      await s3.deleteObject(testKey2)
    })
  })

  describe('Client-side signing with internal signer', () => {
    /**
     * This test demonstrates the flow similar to the aws-nodejs example:
     *
     * 1. getTemporarySecurityCredentials() -> fetch('/s3/sts') -> { credentials, bucket, region }
     * 2. createSignedURL() uses credentials with internal signer to sign in browser
     *
     * Here we simulate the server endpoint with @aws-sdk/client-sts and use
     * the internal signer (src/s3-client/signer.ts) for client-side signing.
     */
    it('should upload using internal signer (simulates createSignedURL flow)', async () => {
      const testKey = `client-signing-${Date.now()}.txt`
      const testContent = 'Hello from client-side signing!'

      // Simulate: getTemporarySecurityCredentials() fetches from server
      const stsClient = createAWSStsClient({
        endpoint: stsEndpoint,
        accessKeyId: stsAccessKeyId,
        secretAccessKey: stsSecretAccessKey,
        region,
      })

      const tempCreds = await assumeRole(stsClient, { durationSeconds: 900 })

      // Use the INTERNAL signer from src/s3-client/signer.ts
      // This is what the aws-s3 plugin would use with createSignedURL()
      const internalSigner = createSigV4Signer({
        accessKeyId: tempCreds.AccessKeyId,
        secretAccessKey: tempCreds.SecretAccessKey,
        sessionToken: tempCreds.SessionToken,
        region,
      })

      // Create S3 client with the internal signer
      const s3 = new S3mini({
        endpoint: bucketEndpoint,
        signRequest: internalSigner,
        region,
      })

      // Upload using client-side signing
      const result = await s3.putObject(testKey, testContent, 'text/plain')

      expect(result.ok).toBe(true)
      expect(result.status).toBe(200)

      // Cleanup
      await s3.deleteObject(testKey)
    })

    it('should perform multipart upload with internal signer', async () => {
      const stsClient = createAWSStsClient({
        endpoint: stsEndpoint,
        accessKeyId: stsAccessKeyId,
        secretAccessKey: stsSecretAccessKey,
        region,
      })

      const tempCreds = await assumeRole(stsClient, { durationSeconds: 900 })

      // Use internal signer for all multipart operations
      const internalSigner = createSigV4Signer({
        accessKeyId: tempCreds.AccessKeyId,
        secretAccessKey: tempCreds.SecretAccessKey,
        sessionToken: tempCreds.SessionToken,
        region,
      })

      const s3 = new S3mini({
        endpoint: bucketEndpoint,
        signRequest: internalSigner,
        region,
      })

      const multipartKey = `client-multipart-${Date.now()}.bin`
      const partSize = 5 * 1024 * 1024 // 5MB

      // Generate random data (chunked for browser compatibility)
      const fillRandom = (arr) => {
        const chunkSize = 65536
        for (let i = 0; i < arr.length; i += chunkSize) {
          const chunk = new Uint8Array(
            arr.buffer,
            i,
            Math.min(chunkSize, arr.length - i),
          )
          crypto.getRandomValues(chunk)
        }
      }

      const part1 = new Uint8Array(partSize)
      fillRandom(part1)

      // Initiate multipart upload
      const uploadId = await s3.getMultipartUploadId(
        multipartKey,
        'application/octet-stream',
      )
      expect(uploadId).toBeDefined()

      // Upload part
      const uploadedPart = await s3.uploadPart(multipartKey, uploadId, part1, 1)
      expect(uploadedPart.etag).toBeDefined()

      // Complete multipart upload
      const completeResult = await s3.completeMultipartUpload(
        multipartKey,
        uploadId,
        [uploadedPart],
      )
      expect(completeResult.etag).toBeDefined()

      // Cleanup
      await s3.deleteObject(multipartKey)
    })
  })
})
