import { createHash } from 'node:crypto'
import * as dotenv from 'dotenv'
import { expect, it, vi } from 'vitest'
import { S3mini } from '../../src/s3-client/S3.js'
import { createSigV4Signer } from '../test-utils/sigv4-signer.js'
import { beforeRun, resetBucketBeforeAll } from './_shared.test.js'

dotenv.config()

const name = 'minio'
const bucketName = `BUCKET_ENV_${name.toUpperCase()}`

const raw = process.env[bucketName] ? process.env[bucketName].split(',') : null

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

  resetBucketBeforeAll(s3client)

  it('put object with valid x-amz-checksum-sha1 header', async () => {
    const fileContents = Buffer.from('Some file contents.', 'utf-8')
    const hasher = createHash('sha1')
    hasher.setEncoding('base64')
    hasher.write(fileContents)
    hasher.end()
    const fileHash = hasher.read()

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
    const fileContents = Buffer.from('Some file contents.', 'utf-8')
    const hasher = createHash('sha1')
    hasher.setEncoding('base64')
    hasher.write(fileContents)
    hasher.write('Make the hash faulty.')
    hasher.end()
    const fileHash = hasher.read()

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
