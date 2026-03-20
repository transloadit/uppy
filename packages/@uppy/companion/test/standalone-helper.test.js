import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * The standalone helper evaluates env vars at getConfigFromEnv() call time
 * (via getCompanionOptions), so we need vi.resetModules() + dynamic import
 * to get a fresh module for each test group.
 */

const loadHelper = async () => {
  const mod = await import('../src/standalone/helper.js')
  return mod
}

describe('standalone helper - S3 config', () => {
  const savedEnv = { ...process.env }

  afterEach(() => {
    // Restore individual keys instead of replacing the object
    for (const key of Object.keys(process.env)) {
      if (!(key in savedEnv)) delete process.env[key]
    }
    for (const [key, val] of Object.entries(savedEnv)) {
      process.env[key] = val
    }
    vi.resetModules()
  })

  describe('when COMPANION_AWS_DYNAMIC_BUCKET is unset (default)', () => {
    beforeEach(() => {
      delete process.env.COMPANION_AWS_DYNAMIC_BUCKET
      process.env.COMPANION_AWS_BUCKET = 'static-bucket'
      process.env.COMPANION_AWS_PREFIX = 'uploads/'
    })

    test('bucket is a static string', async () => {
      const { getCompanionOptions } = await loadHelper()
      const opts = getCompanionOptions()
      expect(typeof opts.s3.bucket).toBe('string')
      expect(opts.s3.bucket).toBe('static-bucket')
    })

    test('getKey ignores metadata.objectName', async () => {
      const { getCompanionOptions } = await loadHelper()
      const opts = getCompanionOptions()
      const key = opts.s3.getKey({
        metadata: { objectName: 'custom/path.jpg' },
        filename: 'photo.jpg',
      })
      // Should use default UUID-based key, not metadata.objectName
      expect(key).not.toContain('custom/path.jpg')
      expect(key).toContain('uploads/')
    })
  })

  describe('when COMPANION_AWS_DYNAMIC_BUCKET=true', () => {
    beforeEach(() => {
      process.env.COMPANION_AWS_DYNAMIC_BUCKET = 'true'
      process.env.COMPANION_AWS_BUCKET = 'fallback-bucket'
      process.env.COMPANION_AWS_PREFIX = 'uploads/'
    })

    test('bucket is a function', async () => {
      const { getCompanionOptions } = await loadHelper()
      const opts = getCompanionOptions()
      expect(typeof opts.s3.bucket).toBe('function')
    })

    test('bucket resolves metadata.bucketName when present', async () => {
      const { getCompanionOptions } = await loadHelper()
      const opts = getCompanionOptions()
      const bucket = opts.s3.bucket({
        metadata: { bucketName: 'org-bucket' },
      })
      expect(bucket).toBe('org-bucket')
    })

    test('bucket falls back to COMPANION_AWS_BUCKET when metadata absent', async () => {
      const { getCompanionOptions } = await loadHelper()
      const opts = getCompanionOptions()
      expect(opts.s3.bucket({ metadata: {} })).toBe('fallback-bucket')
      expect(opts.s3.bucket({ metadata: undefined })).toBe('fallback-bucket')
      expect(opts.s3.bucket({})).toBe('fallback-bucket')
    })

    test('getKey uses metadata.objectName when present', async () => {
      const { getCompanionOptions } = await loadHelper()
      const opts = getCompanionOptions()
      const key = opts.s3.getKey({
        metadata: { objectName: 'custom/path.jpg' },
        filename: 'photo.jpg',
      })
      expect(key).toBe('uploads/custom/path.jpg')
    })

    test('getKey falls back to default UUID key when objectName absent', async () => {
      const { getCompanionOptions } = await loadHelper()
      const opts = getCompanionOptions()
      const key = opts.s3.getKey({
        metadata: {},
        filename: 'photo.jpg',
      })
      expect(key).toContain('uploads/')
      expect(key).toContain('photo.jpg')
      expect(key).not.toBe('uploads/photo.jpg') // should have UUID prefix
    })
  })

  describe('when COMPANION_AWS_DYNAMIC_BUCKET=false', () => {
    beforeEach(() => {
      process.env.COMPANION_AWS_DYNAMIC_BUCKET = 'false'
      process.env.COMPANION_AWS_BUCKET = 'static-bucket'
    })

    test('bucket is a static string', async () => {
      const { getCompanionOptions } = await loadHelper()
      const opts = getCompanionOptions()
      expect(typeof opts.s3.bucket).toBe('string')
      expect(opts.s3.bucket).toBe('static-bucket')
    })
  })
})
