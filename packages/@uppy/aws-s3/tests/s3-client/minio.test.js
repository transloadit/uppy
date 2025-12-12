import { sha1Base64 } from '../test-utils/browser-crypto.js'
import { expect, inject, it, vi } from 'vitest'
import { S3mini } from '../../src/s3-client/S3.js'
import { createSigV4Signer } from '../test-utils/sigv4-signer.js'
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
}

beforeRun(raw, name, minioSpecific)
