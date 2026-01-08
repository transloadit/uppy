import { beforeEach, describe, expect, it, vi } from 'vitest'

import 'whatwg-fetch'
import Core, { type Meta, type UppyFile } from '@uppy/core'
import AwsS3, { type AwsBody, type AwsS3Options } from '../src/index.js'

const KB = 1024
const MB = KB * KB

describe('AwsS3', () => {
  it('Registers AwsS3 upload plugin', () => {
    const core = new Core().use(AwsS3, {
      bucket: 'test-bucket',
      endpoint: 'https://companion.example.com',
    })

    // @ts-expect-error private property
    const pluginNames = core[Symbol.for('uppy test: getPlugins')]('uploader').map(
      (plugin: AwsS3<Meta, AwsBody>) => plugin.constructor.name,
    )
    expect(pluginNames).toContain('AwsS3')
  })

  describe('defaultOptions', () => {
    let opts: AwsS3Options<Meta, AwsBody>

    beforeEach(() => {
      const core = new Core<Meta, AwsBody>().use(AwsS3, {
        bucket: 'test-bucket',
        endpoint: 'https://companion.example.com',
      })
      const awsS3 = core.getPlugin('AwsS3')!
      opts = awsS3.opts as AwsS3Options<Meta, AwsBody>
    })

    it('region defaults to us-east-1', () => {
      expect(opts.region).toBe('us-east-1')
    })

    it('allowedMetaFields is true', () => {
      expect(opts.allowedMetaFields).toBe(true)
    })

    describe('shouldUseMultipart', () => {
      const MULTIPART_THRESHOLD = 100 * MB

      let shouldUseMultipart: (file: UppyFile<Meta, AwsBody>) => boolean

      beforeEach(() => {
        shouldUseMultipart = opts.shouldUseMultipart as (
          file: UppyFile<Meta, AwsBody>,
        ) => boolean
      })

      // Helper that creates a mock file without actually allocating memory
      const createFile = (size: number): UppyFile<Meta, AwsBody> =>
        ({
          name: 'test.dat',
          size,
          data: { size } as Blob, // Mock blob with just size property
          extension: 'dat',
          id: 'test-id',
          isRemote: false,
          isGhost: false,
          meta: { name: 'test.dat' },
          progress: {
            percentage: 0,
            bytesUploaded: 0,
            bytesTotal: size,
            uploadComplete: false,
            uploadStarted: 0,
          },
          type: 'application/octet-stream',
        }) as unknown as UppyFile<Meta, AwsBody>

      it('returns true for files larger than 100MB', () => {
        const file = createFile(MULTIPART_THRESHOLD + 1)
        expect(shouldUseMultipart(file)).toBe(true)
      })

      it('returns false for files exactly 100MB', () => {
        const file = createFile(MULTIPART_THRESHOLD)
        expect(shouldUseMultipart(file)).toBe(false)
      })

      it('returns false for files smaller than 100MB', () => {
        const file = createFile(MULTIPART_THRESHOLD - 1)
        expect(shouldUseMultipart(file)).toBe(false)
      })

      it('returns true for large files (~70GB)', () => {
        // Use mock file to avoid OOM
        const file = createFile(70 * 1024 * MB)
        expect(shouldUseMultipart(file)).toBe(true)
      })

      it('returns true for very large files (~400GB)', () => {
        const file = createFile(400 * 1024 * MB)
        expect(shouldUseMultipart(file)).toBe(true)
      })

      it('returns false for files with size 0', () => {
        const file = createFile(0)
        expect(shouldUseMultipart(file)).toBe(false)
      })
    })
  })

  describe('configuration validation', () => {
    it('throws if bucket is not provided', () => {
      expect(() => {
        const core = new Core()
        // @ts-expect-error - testing missing required option
        core.use(AwsS3, {})
      }).toThrow('`bucket` option is required')
    })

    it('throws if no signing method is provided', () => {
      expect(() => {
        const core = new Core()
        core.use(AwsS3, { bucket: 'test-bucket' })
      }).toThrow('`endpoint`, `signRequest`, or `getCredentials` is required')
    })

    it('accepts endpoint option', () => {
      const core = new Core()
      core.use(AwsS3, {
        bucket: 'test-bucket',
        endpoint: 'https://companion.example.com',
      })
      const plugin = core.getPlugin('AwsS3')!
      expect(plugin).toBeDefined()
    })

    it('accepts signRequest option', () => {
      const signRequest = vi.fn()
      const core = new Core()
      core.use(AwsS3, {
        bucket: 'test-bucket',
        signRequest,
      })
      const plugin = core.getPlugin('AwsS3')!
      expect(plugin).toBeDefined()
    })

    it('accepts getCredentials option', () => {
      const getCredentials = vi.fn()
      const core = new Core()
      core.use(AwsS3, {
        bucket: 'test-bucket',
        getCredentials,
      })
      const plugin = core.getPlugin('AwsS3')!
      expect(plugin).toBeDefined()
    })
  })

  describe('getKey option', () => {
    it('uses custom getKey if provided', () => {
      const getKey = vi.fn().mockReturnValue('custom/path/file.txt')
      const core = new Core()
      core.use(AwsS3, {
        bucket: 'test-bucket',
        endpoint: 'https://companion.example.com',
        getKey,
      })

      // getKey is not called until upload
      expect(getKey).not.toHaveBeenCalled()
    })

    it('default getKey generates expected format', () => {
      const core = new Core<Meta, AwsBody>().use(AwsS3, {
        bucket: 'test-bucket',
        endpoint: 'https://companion.example.com',
      })

      const awsS3 = core.getPlugin('AwsS3')! as AwsS3<Meta, AwsBody>

      // Access internal generateKey method via opts if no getKey provided
      const opts = awsS3.opts as AwsS3Options<Meta, AwsBody>

      // The default getKey is undefined, so plugin uses internal #generateKey
      expect(opts.getKey).toBeUndefined()
    })
  })

  describe('region option', () => {
    it('uses custom region if provided', () => {
      const core = new Core<Meta, AwsBody>().use(AwsS3, {
        bucket: 'test-bucket',
        region: 'eu-west-1',
        endpoint: 'https://companion.example.com',
      })

      const awsS3 = core.getPlugin('AwsS3')!
      const opts = awsS3.opts as AwsS3Options<Meta, AwsBody>

      expect(opts.region).toBe('eu-west-1')
    })
  })

  describe('shouldUseMultipart option', () => {
    it('accepts boolean true', () => {
      const core = new Core<Meta, AwsBody>().use(AwsS3, {
        bucket: 'test-bucket',
        endpoint: 'https://companion.example.com',
        shouldUseMultipart: true,
      })

      const awsS3 = core.getPlugin('AwsS3')!
      const opts = awsS3.opts as AwsS3Options<Meta, AwsBody>

      expect(opts.shouldUseMultipart).toBe(true)
    })

    it('accepts boolean false', () => {
      const core = new Core<Meta, AwsBody>().use(AwsS3, {
        bucket: 'test-bucket',
        endpoint: 'https://companion.example.com',
        shouldUseMultipart: false,
      })

      const awsS3 = core.getPlugin('AwsS3')!
      const opts = awsS3.opts as AwsS3Options<Meta, AwsBody>

      expect(opts.shouldUseMultipart).toBe(false)
    })

    it('accepts function', () => {
      const shouldUseMultipart = vi.fn().mockReturnValue(true)
      const core = new Core<Meta, AwsBody>().use(AwsS3, {
        bucket: 'test-bucket',
        endpoint: 'https://companion.example.com',
        shouldUseMultipart,
      })

      const awsS3 = core.getPlugin('AwsS3')!
      const opts = awsS3.opts as AwsS3Options<Meta, AwsBody>

      expect(typeof opts.shouldUseMultipart).toBe('function')
    })
  })

  describe('getChunkSize option', () => {
    it('accepts custom getChunkSize function', () => {
      const getChunkSize = vi.fn().mockReturnValue(10 * MB)
      const core = new Core<Meta, AwsBody>().use(AwsS3, {
        bucket: 'test-bucket',
        endpoint: 'https://companion.example.com',
        getChunkSize,
      })

      const awsS3 = core.getPlugin('AwsS3')!
      const opts = awsS3.opts as AwsS3Options<Meta, AwsBody>

      expect(opts.getChunkSize).toBe(getChunkSize)
    })
  })

  describe('upload events', () => {
    it('emits upload-start when upload begins', async () => {
      const signRequest = vi.fn().mockImplementation(() => {
        // Reject to stop upload early
        return Promise.reject(new Error('Test: stopping upload'))
      })

      const core = new Core().use(AwsS3, {
        bucket: 'test-bucket',
        signRequest,
        shouldUseMultipart: false,
      })

      const fileSize = 1 * KB

      core.addFile({
        source: 'test',
        name: 'test.txt',
        type: 'text/plain',
        data: new File([new Uint8Array(fileSize)], 'test.txt', {
          type: 'text/plain',
        }),
      })

      const uploadStartHandler = vi.fn()
      core.on('upload-start', uploadStartHandler)

      try {
        await core.upload()
      } catch {
        // Expected to fail
      }

      expect(uploadStartHandler).toHaveBeenCalledTimes(1)
    })

    it('emits upload-error on failure', async () => {
      const signRequest = vi.fn().mockRejectedValue(new Error('Sign failed'))

      const core = new Core().use(AwsS3, {
        bucket: 'test-bucket',
        signRequest,
        shouldUseMultipart: false,
      })

      const fileSize = 1 * KB

      core.addFile({
        source: 'test',
        name: 'test.txt',
        type: 'text/plain',
        data: new File([new Uint8Array(fileSize)], 'test.txt', {
          type: 'text/plain',
        }),
      })

      const uploadErrorHandler = vi.fn()
      core.on('upload-error', uploadErrorHandler)

      try {
        await core.upload()
      } catch {
        // Expected to fail
      }

      expect(uploadErrorHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('abort upload', () => {
    it('should abort upload when file is removed', async () => {
      const signRequest = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            // Delay to allow abort to happen
            setTimeout(
              () =>
                resolve({
                  authorization: 'AWS4-HMAC-SHA256 ...',
                  'x-amz-date': '20260109T100000Z',
                }),
              100,
            )
          }),
      )

      const core = new Core().use(AwsS3, {
        bucket: 'test-bucket',
        signRequest,
        shouldUseMultipart: false,
      })

      const fileSize = 1 * KB

      core.addFile({
        source: 'test',
        name: 'test.txt',
        type: 'text/plain',
        data: new File([new Uint8Array(fileSize)], 'test.txt', {
          type: 'text/plain',
        }),
      })

      const fileId = Object.keys(core.getState().files)[0]

      // Start upload, then remove file
      const uploadPromise = core.upload()
      setTimeout(() => core.removeFile(fileId), 10)

      await expect(uploadPromise).resolves.toBeDefined()
    })

    it('should abort upload when cancelAll is called', async () => {
      const signRequest = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  authorization: 'AWS4-HMAC-SHA256 ...',
                }),
              100,
            )
          }),
      )

      const core = new Core().use(AwsS3, {
        bucket: 'test-bucket',
        signRequest,
        shouldUseMultipart: false,
      })

      const fileSize = 1 * KB

      core.addFile({
        source: 'test',
        name: 'test.txt',
        type: 'text/plain',
        data: new File([new Uint8Array(fileSize)], 'test.txt', {
          type: 'text/plain',
        }),
      })

      const uploadPromise = core.upload()
      setTimeout(() => core.cancelAll(), 10)

      await expect(uploadPromise).resolves.toBeDefined()
    })
  })

})

