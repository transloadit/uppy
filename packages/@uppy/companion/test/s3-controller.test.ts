import { describe, expect, test } from 'vitest'
import s3 from '../src/server/controllers/s3.ts'

describe('s3 controller config', () => {
  test('rejects invalid presigned post conditions', () => {
    expect(() =>
      s3({
        getKey: () => 'key',
        expires: 800,
        conditions: [
          ['eq', '$acl', 'private'],
          ['eq', '$content-type'],
        ],
      }),
    ).toThrow('s3: The `conditions` option contains an invalid condition')
  })

  test('accepts valid presigned post conditions', () => {
    expect(() =>
      s3({
        getKey: () => 'key',
        expires: 800,
        conditions: [
          ['eq', '$acl', 'private'],
          ['starts-with', '$key', 'uploads/'],
          ['content-length-range', 0, 1_000_000],
          { bucket: 'example-bucket' },
        ],
      }),
    ).not.toThrow()
  })
})
