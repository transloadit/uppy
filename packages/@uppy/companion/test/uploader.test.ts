import fs from 'node:fs'
import { Readable } from 'node:stream'
import nock from 'nock'
import { afterAll, afterEach, describe, expect, test, vi } from 'vitest'
import Emitter from '../src/server/emitter/index.ts'
import Uploader, { ValidationError } from '../src/server/Uploader.ts'
import { isRecord } from '../src/server/helpers/type-guards.ts'
import standalone from '../src/standalone/index.ts'
import * as socketClient from './mocksocket.ts'

vi.mock('tus-js-client')
vi.mock('express-prom-bundle')

afterEach(() => {
  nock.cleanAll()
})
afterAll(() => {
  nock.restore()
})

process.env.COMPANION_DATADIR = './test/output'
process.env.COMPANION_DOMAIN = 'localhost:3020'
process.env.COMPANION_CLIENT_ORIGINS = 'true'
const { companionOptions } = standalone()

const mockReq: unknown = {}

describe('uploader', () => {
  test('uploader respects uploadUrls', async () => {
    const opts = {
      endpoint: 'http://localhost/files',
      companionOptions: {
        ...companionOptions,
        uploadUrls: [/^http:\/\/url.myendpoint.com\//],
      },
    }

    // @ts-ignore
    expect(() => new Uploader(opts)).toThrow(
      new ValidationError(
        'upload destination does not match any allowed destinations',
      ),
    )
  })

  test('uploader respects uploadUrls, valid', async () => {
    const opts = {
      endpoint: 'http://url.myendpoint.com/files',
      companionOptions: {
        ...companionOptions,
        uploadUrls: [/^http:\/\/url.myendpoint.com\//],
      },
    }

    // @ts-ignore
    new Uploader(opts) // no validation error
  })

  test('uploader respects uploadUrls, localhost', async () => {
    const opts = {
      endpoint: 'http://localhost:1337/',
      companionOptions: {
        ...companionOptions,
        uploadUrls: [/^http:\/\/localhost:1337\//],
      },
    }

    // @ts-ignore
    new Uploader(opts) // no validation error
  })

  test('upload functions with tus protocol', async () => {
    const fileContent = Buffer.from('Some file content')
    const stream = Readable.from([fileContent])
    const opts: ConstructorParameters<typeof Uploader>[0] = {
      companionOptions,
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      size: fileContent.length,
      pathPrefix: companionOptions.filePath,
      metadata: { name: 'file.txt', type: 'text/plain' },
    }

    // @ts-ignore
    const uploader = new Uploader(opts)
    const uploadToken = uploader.token
    expect(uploadToken).toBeTruthy()

    let firstReceivedProgress: number | undefined

    const onProgress = vi.fn()
    const onUploadSuccess = vi.fn()
    const onUploadError = vi.fn()
    const onBeginUploadEvent = vi.fn()
    const onUploadEvent = vi.fn()

    const emitter = Emitter()
    emitter.on('upload-start', onBeginUploadEvent)
    emitter.on(uploadToken, onUploadEvent)

    const promise = uploader.awaitReady(60000)
    // emulate socket connection
    socketClient.connect(uploadToken)
    socketClient.onProgress(uploadToken, (message) => {
      const payload = isRecord(message.payload) ? message.payload : {}
      const bytesUploaded =
        typeof payload.bytesUploaded === 'number' ? payload.bytesUploaded : null
      if (firstReceivedProgress == null && bytesUploaded != null) {
        firstReceivedProgress = bytesUploaded
      }
      onProgress(message)
    })
    socketClient.onUploadError(uploadToken, onUploadError)
    socketClient.onUploadSuccess(uploadToken, onUploadSuccess)
    await promise
    // @ts-ignore
    await uploader.tryUploadStream(stream, mockReq)

    expect(onUploadError).not.toHaveBeenCalled()

    expect(firstReceivedProgress).toBe(8)

    expect(onProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          bytesTotal: fileContent.length,
        }),
      }),
    )
    const expectedPayload = expect.objectContaining({
      // see __mocks__/tus-js-client.ts
      url: 'https://tus.endpoint/files/foo-bar',
    })
    expect(onUploadSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expectedPayload,
      }),
    )

    expect(onBeginUploadEvent).toHaveBeenCalledWith({ token: uploadToken })
    expect(onUploadEvent).toHaveBeenLastCalledWith({
      action: 'success',
      payload: expectedPayload,
    })
  })

  test('upload functions with tus protocol without size', async () => {
    const fileContent = Buffer.alloc(1e6)
    const stream = Readable.from([fileContent])
    const size: null = null
    const opts: ConstructorParameters<typeof Uploader>[0] = {
      companionOptions,
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      size,
      pathPrefix: companionOptions.filePath,
      metadata: { name: 'file.bin' },
    }

    // @ts-ignore
    const uploader = new Uploader(opts)
    const originalTryDeleteTmpPath = uploader.tryDeleteTmpPath.bind(uploader)
    uploader.tryDeleteTmpPath = async () => {
      // validate that the tmp file has been downloaded and saved into the file path
      // must do it before it gets deleted
      const fileInfo = fs.statSync(uploader.tmpPath)
      expect(fileInfo.isFile()).toBe(true)
      expect(fileInfo.size).toBe(fileContent.length)

      return originalTryDeleteTmpPath()
    }
    const uploadToken = uploader.token
    expect(uploadToken).toBeTruthy()

    return new Promise<void>((resolve, reject) => {
      // validate that the test is resolved on socket connection
      uploader.awaitReady(60000).then(() => {
        // @ts-ignore
        uploader.tryUploadStream(stream, mockReq).then(() => {
          try {
            // @ts-ignore
            expect(fs.existsSync(uploader.path)).toBe(false)
            resolve()
          } catch (err) {
            reject(err)
          }
        })
      })

      let firstReceivedProgress: number | undefined

      // emulate socket connection
      socketClient.connect(uploadToken)
      socketClient.onProgress(uploadToken, (message) => {
        const payload = isRecord(message.payload) ? message.payload : {}
        const bytesUploaded =
          typeof payload.bytesUploaded === 'number' ? payload.bytesUploaded : null
        if (firstReceivedProgress == null && bytesUploaded != null) {
          firstReceivedProgress = bytesUploaded
        }
      })
      socketClient.onUploadSuccess(uploadToken, (message) => {
        try {
          expect(firstReceivedProgress).toBe(500_000)

          // see __mocks__/tus-js-client.ts
          const payload = isRecord(message.payload) ? message.payload : {}
          expect(payload.url).toBe('https://tus.endpoint/files/foo-bar')
        } catch (err) {
          reject(err)
        }
      })
    })
  })

  async function runMultipartTest({
    metadata,
    useFormData,
    includeSize = true,
    address = 'localhost',
    extraCompanionOpts,
  }: {
    metadata?: Record<string, unknown>
    useFormData?: boolean
    includeSize?: boolean
    address?: string
    extraCompanionOpts?: Record<string, unknown>
  } = {}) {
    const fileContent = Buffer.from('Some file content')
    const stream = Readable.from([fileContent])

    const opts: ConstructorParameters<typeof Uploader>[0] = {
      companionOptions: { ...companionOptions, ...extraCompanionOpts },
      endpoint: `http://${address}`,
      protocol: 'multipart',
      size: includeSize ? fileContent.length : undefined,
      metadata: metadata ?? {},
      pathPrefix: companionOptions.filePath,
      useFormData,
    }

    const uploader = new Uploader(opts)
    // @ts-ignore
    return uploader.uploadStream(stream)
  }

  test('upload functions with xhr protocol', async () => {
    nock('http://localhost').post('/').reply(200, 'OK')
    const ret = await runMultipartTest()
    expect(ret).toMatchObject({
      url: null,
      extraData: { response: expect.anything(), bytesUploaded: 17 },
    })
  })

  test('header companion option gets passed along to destination endpoint', async () => {
    nock('http://localhost')
      .post('/')
      .matchHeader('header-a', '1')
      .matchHeader('header-b', '2')
      .reply(200, () => '')

    const ret = await runMultipartTest({
      extraCompanionOpts: {
        uploadHeaders: { 'header-a': '1', 'header-b': '2' },
      },
    })
    expect(ret).toMatchObject({
      url: null,
      extraData: { response: expect.anything(), bytesUploaded: 17 },
    })

    const responseHeaders =
      isRecord(ret) &&
      isRecord(ret.extraData) &&
      isRecord(ret.extraData.response) &&
      isRecord(ret.extraData.response.headers)
        ? ret.extraData.response.headers
        : null
    expect(responseHeaders?.['header-a']).toBeUndefined() // headers sent to destination, not received back
  })

  const formDataNoMetaMatch =
    /^--form-data-boundary-[a-z0-9]+\r\nContent-Disposition: form-data; name="files\[\]"; filename="uppy-file-[^"]+"\r\nContent-Type: application\/octet-stream\r\n\r\nSome file content\r\n--form-data-boundary-[a-z0-9]+--\r\n\r\n$/

  test('upload functions with xhr formdata', async () => {
    nock('http://localhost').post('/', formDataNoMetaMatch).reply(200)

    // @ts-ignore
    const ret = await runMultipartTest({ useFormData: true })
    expect(ret).toMatchObject({
      url: null,
      extraData: { response: expect.anything(), bytesUploaded: 17 },
    })
  })

  test('upload functions with unknown file size', async () => {
    nock('http://localhost').post('/', formDataNoMetaMatch).reply(200)

    const ret = await runMultipartTest({
      useFormData: true,
      includeSize: false,
    })
    expect(ret).toMatchObject({
      url: null,
      extraData: { response: expect.anything(), bytesUploaded: 17 },
    })
  })

  // https://github.com/transloadit/uppy/issues/3477
  test('upload functions with xhr formdata and metadata without crashing the node.js process', async () => {
    nock('http://localhost')
      .post(
        '/',
        /^--form-data-boundary-[a-z0-9]+\r\nContent-Disposition: form-data; name="key1"\r\n\r\nnull\r\n--form-data-boundary-[a-z0-9]+\r\nContent-Disposition: form-data; name="key2"\r\n\r\ntrue\r\n--form-data-boundary-[a-z0-9]+\r\nContent-Disposition: form-data; name="key3"\r\n\r\n\d+\r\n--form-data-boundary-[a-z0-9]+\r\nContent-Disposition: form-data; name="key4"\r\n\r\n\[object Object\]\r\n--form-data-boundary-[a-z0-9]+\r\nContent-Disposition: form-data; name="key5"\r\n\r\n\(\) => \{\s*\}\r\n--form-data-boundary-[a-z0-9]+\r\nContent-Disposition: form-data; name="files\[\]"; filename="uppy-file-[^"]+"\r\nContent-Type: application\/octet-stream\r\n\r\nSome file content\r\n--form-data-boundary-[a-z0-9]+--\r\n\r\n$/,
      )
      .times(10)
      .reply(200)

    const key1: null = null
    const metadata = {
      key1,
      key2: true,
      key3: 1234,
      key4: {},
      key5: () => {},
    }
    const ret = await runMultipartTest({ useFormData: true, metadata })
    expect(ret).toMatchObject({
      url: null,
      extraData: { response: expect.anything(), bytesUploaded: 17 },
    })
  })

  test('uploader checks metadata', () => {
    const opts = {
      companionOptions,
      endpoint: 'http://localhost',
    }

    // @ts-ignore
    new Uploader({ ...opts, metadata: { key: 'string value' } })

    // @ts-ignore
    expect(() => new Uploader({ ...opts, metadata: '' })).toThrow(
      new ValidationError('metadata must be an object'),
    )
  })

  test('uploader respects maxFileSize', async () => {
    const opts = {
      endpoint: 'http://url.myendpoint.com/files',
      companionOptions: { ...companionOptions, maxFileSize: 100 },
      size: 101,
    }

    // @ts-ignore
    expect(() => new Uploader(opts)).toThrow(
      new ValidationError('maxFileSize exceeded'),
    )
  })

  test('uploader respects maxFileSize correctly', async () => {
    const opts = {
      endpoint: 'http://url.myendpoint.com/files',
      companionOptions: { ...companionOptions, maxFileSize: 100 },
      size: 99,
    }

    // @ts-ignore
    new Uploader(opts) // no validation error
  })

  test('uploader respects maxFileSize with unknown size', async () => {
    const fileContent = Buffer.alloc(10000)
	    const stream = Readable.from([fileContent])
	    const size: null = null
	    const opts = {
	      companionOptions: { ...companionOptions, maxFileSize: 1000 },
	      endpoint: 'http://url.myendpoint.com/files',
	      protocol: 'tus',
	      size,
	      pathPrefix: companionOptions.filePath,
	    }

    // @ts-ignore
    const uploader = new Uploader(opts)
    const uploadToken = uploader.token

    // validate that the test is resolved on socket connection
    uploader
      .awaitReady(60000)
      // @ts-ignore
      .then(() => uploader.tryUploadStream(stream, mockReq))
    socketClient.connect(uploadToken)

	    return new Promise<void>((resolve, reject) => {
	      socketClient.onUploadError(uploadToken, (message) => {
	        try {
	          expect(message).toMatchObject({
	            payload: { error: { message: 'maxFileSize exceeded' } },
	          })
	          resolve()
	        } catch (err) {
	          reject(err)
	        }
	      })
	    })
	  })
})
