import { afterEach, describe, expect, test } from 'vitest'
import { defaultOptions } from '../src/config/companion.ts'
import s3Client from '../src/server/s3-client.ts'
import type { CompanionRuntimeOptions } from '../src/types/companion-options.ts'

const originalAwsRegion = process.env['AWS_REGION']

afterEach(() => {
  if (originalAwsRegion === undefined) {
    delete process.env['AWS_REGION']
  } else {
    process.env['AWS_REGION'] = originalAwsRegion
  }
})

describe('s3-client', () => {
  test('creates an S3 client when region comes from AWS SDK environment resolution', () => {
    process.env['AWS_REGION'] = 'us-east-1'

    const options = {
      ...defaultOptions,
      s3: {
        ...defaultOptions.s3,
        endpoint: 'https://s3.amazonaws.com',
        bucket: 'test-bucket',
        key: 'test-key',
        secret: 'test-secret',
      },
    } satisfies CompanionRuntimeOptions

    expect(s3Client(options)).not.toBeNull()
  })

  test('creates an S3 client when region is provided as awsClientOptions provider', () => {
    const options = {
      ...defaultOptions,
      s3: {
        ...defaultOptions.s3,
        endpoint: 'https://s3.amazonaws.com',
        bucket: 'test-bucket',
        key: 'test-key',
        secret: 'test-secret',
        awsClientOptions: {
          region: async () => 'us-east-1',
        },
      },
    } satisfies CompanionRuntimeOptions

    expect(s3Client(options)).not.toBeNull()
  })
})
