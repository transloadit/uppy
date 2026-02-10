import fs from 'node:fs'
import { Readable } from 'node:stream'
import type { Request } from 'express'
import express from 'express'
import nock from 'nock'
import request from 'supertest'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest'
import { defaultOptions } from '../src/config/companion.ts'
import Emitter from '../src/server/emitter/index.ts'
import { isRecord } from '../src/server/helpers/type-guards.ts'
import Uploader, { ValidationError } from '../src/server/Uploader.ts'
import standalone from '../src/standalone/index.ts'
import type { CompanionRuntimeOptions } from '../src/types/companion-options.ts'
import * as socketClient from './mocksocket.ts'

vi.mock('tus-js-client')
vi.mock('express-prom-bundle')

afterEach(() => {
  nock.cleanAll()
})
afterAll(() => {
  nock.restore()
})

process.env['COMPANION_DATADIR'] = './test/output'
process.env['COMPANION_DOMAIN'] = 'localhost:3020'
process.env['COMPANION_CLIENT_ORIGINS'] = 'true'
const { companionOptions } = standalone()
const runtimeOptions = { ...defaultOptions } satisfies CompanionRuntimeOptions
const pathPrefix =
  typeof companionOptions.filePath === 'string'
    ? companionOptions.filePath
    : './test/output'

let mockReq: Request | undefined

function requireMockReq(): Request {
  if (!mockReq) throw new Error('mockReq was not initialized')
  return mockReq
}

beforeAll(async () => {
  const app = express()
  app.get('/', (req, res) => {
    res.status(200).end()
    mockReq = req
  })
  await request(app).get('/')
  if (!mockReq) throw new Error('Expected an Express request instance')
  mockReq.companion = { options: runtimeOptions }
})

describe('uploader', () => {
  test('uploader respects uploadUrls', async () => {
    const opts = {
      companionOptions: {
        ...companionOptions,
        uploadUrls: [/^http:\/\/url.myendpoint.com\//],
      },
      endpoint: 'http://localhost/files',
      protocol: 'multipart',
      size: 1,
      pathPrefix,
      metadata: { name: 'file.txt', type: 'text/plain' },
    } satisfies ConstructorParameters<typeof Uploader>[0]

    expect(() => new Uploader(opts)).toThrow(
      new ValidationError(
        'upload destination does not match any allowed destinations',
      ),
    )
  })

  test('uploader respects uploadUrls, valid', async () => {
    const opts = {
      companionOptions: {
        ...companionOptions,
        uploadUrls: [/^http:\/\/url.myendpoint.com\//],
      },
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'multipart',
      size: 1,
      pathPrefix,
      metadata: { name: 'file.txt', type: 'text/plain' },
    } satisfies ConstructorParameters<typeof Uploader>[0]

    new Uploader(opts) // no validation error
  })

  test('uploader respects uploadUrls, localhost', async () => {
    const opts = {
      companionOptions: {
        ...companionOptions,
        uploadUrls: [/^http:\/\/localhost:1337\//],
      },
      endpoint: 'http://localhost:1337/',
      protocol: 'multipart',
      size: 1,
      pathPrefix,
      metadata: { name: 'file.txt', type: 'text/plain' },
    } satisfies ConstructorParameters<typeof Uploader>[0]

    new Uploader(opts) // no validation error
  })

  test('upload functions with tus protocol', async () => {
    const fileContent = Buffer.from('Some file content')
    const stream = Readable.from([fileContent])
    const opts: ConstructorParameters<typeof Uploader>[0] = {
      companionOptions: { ...companionOptions, streamingUpload: false },
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      size: fileContent.length,
      pathPrefix,
      metadata: { name: 'file.txt', type: 'text/plain' },
    }

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
      const payload = isRecord(message['payload']) ? message['payload'] : {}
      const bytesUploaded =
        typeof payload['bytesUploaded'] === 'number'
          ? payload['bytesUploaded']
          : null
      if (
        firstReceivedProgress == null &&
        bytesUploaded != null &&
        bytesUploaded > 0
      ) {
        firstReceivedProgress = bytesUploaded
      }
      onProgress(message)
    })
    socketClient.onUploadError(uploadToken, onUploadError)
    socketClient.onUploadSuccess(uploadToken, onUploadSuccess)
    await promise
    await uploader.tryUploadStream(stream, requireMockReq())

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
    const opts: ConstructorParameters<typeof Uploader>[0] = {
      companionOptions: { ...companionOptions, streamingUpload: false },
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      pathPrefix,
      metadata: { name: 'file.bin' },
    }

    const uploader = new Uploader(opts)
    const originalTryDeleteTmpPath = uploader.tryDeleteTmpPath.bind(uploader)
    uploader.tryDeleteTmpPath = () => {
      // validate that the tmp file has been downloaded and saved into the file path
      // must do it before it gets deleted
      const tmpPath = uploader.tmpPath
      if (typeof tmpPath !== 'string') {
        throw new Error('Expected uploader.tmpPath to be a string')
      }
      const fileInfo = fs.statSync(tmpPath)
      expect(fileInfo.isFile()).toBe(true)
      expect(fileInfo.size).toBe(fileContent.length)

      originalTryDeleteTmpPath()
    }
    const uploadToken = uploader.token
    expect(uploadToken).toBeTruthy()

    return new Promise<void>((resolve, reject) => {
      // validate that the test is resolved on socket connection
      uploader.awaitReady(60000).then(() => {
        uploader.tryUploadStream(stream, requireMockReq()).then(() => {
          try {
            const tmpPath = uploader.tmpPath
            if (typeof tmpPath !== 'string') {
              throw new Error('Expected uploader.tmpPath to be a string')
            }
            expect(fs.existsSync(tmpPath)).toBe(false)
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
        const payload = isRecord(message['payload']) ? message['payload'] : {}
        const bytesUploaded =
          typeof payload['bytesUploaded'] === 'number'
            ? payload['bytesUploaded']
            : null
        if (
          firstReceivedProgress == null &&
          bytesUploaded != null &&
          bytesUploaded > 0
        ) {
          firstReceivedProgress = bytesUploaded
        }
      })
      socketClient.onUploadSuccess(uploadToken, (message) => {
        try {
          expect(firstReceivedProgress).toBe(500_000)

          // see __mocks__/tus-js-client.ts
          const payload = isRecord(message['payload']) ? message['payload'] : {}
          expect(payload['url']).toBe('https://tus.endpoint/files/foo-bar')
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
      ...(includeSize ? { size: fileContent.length } : {}),
      metadata: metadata ?? {},
      pathPrefix,
      ...(useFormData === undefined ? {} : { useFormData }),
    }

    const uploader = new Uploader(opts)
    return uploader.uploadStream(stream, requireMockReq())
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
      isRecord(ret['extraData']) &&
      isRecord(ret['extraData']['response']) &&
      isRecord(ret['extraData']['response']['headers'])
        ? ret['extraData']['response']['headers']
        : null
    expect(responseHeaders?.['header-a']).toBeUndefined() // headers sent to destination, not received back
  })

  const formDataNoMetaMatch =
    /^--form-data-boundary-[a-z0-9]+\r\nContent-Disposition: form-data; name="files\[\]"; filename="uppy-file-[^"]+"\r\nContent-Type: application\/octet-stream\r\n\r\nSome file content\r\n--form-data-boundary-[a-z0-9]+--\r\n\r\n$/

  test('upload functions with xhr formdata', async () => {
    nock('http://localhost').post('/', formDataNoMetaMatch).reply(200)

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
    const baseOpts = {
      companionOptions,
      endpoint: 'http://localhost',
      protocol: 'multipart',
      size: 1,
      pathPrefix,
      metadata: {},
    } satisfies ConstructorParameters<typeof Uploader>[0]

    new Uploader({ ...baseOpts, metadata: { key: 'string value' } })

    // @ts-expect-error - testing runtime validation for invalid metadata type
    expect(() => new Uploader({ ...baseOpts, metadata: '' })).toThrow(
      new ValidationError('metadata must be an object'),
    )
  })

  test('uploader respects maxFileSize', async () => {
    const opts = {
      endpoint: 'http://url.myendpoint.com/files',
      companionOptions: { ...companionOptions, maxFileSize: 100 },
      size: 101,
      protocol: 'tus',
      pathPrefix,
      metadata: {},
    } satisfies ConstructorParameters<typeof Uploader>[0]

    expect(() => new Uploader(opts)).toThrow(
      new ValidationError('maxFileSize exceeded'),
    )
  })

  test('uploader respects maxFileSize correctly', async () => {
    const opts = {
      endpoint: 'http://url.myendpoint.com/files',
      companionOptions: { ...companionOptions, maxFileSize: 100 },
      size: 99,
      protocol: 'tus',
      pathPrefix,
      metadata: {},
    } satisfies ConstructorParameters<typeof Uploader>[0]

    new Uploader(opts) // no validation error
  })

  test('uploader respects maxFileSize with unknown size', async () => {
    const fileContent = Buffer.alloc(10000)
    const stream = Readable.from([fileContent])

    const opts = {
      companionOptions: {
        ...companionOptions,
        maxFileSize: 1000,
        // Make sure the uploader downloads the full stream so the maxFileSize
        // check can run even when size is unknown.
        streamingUpload: false,
      },
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      pathPrefix,
      metadata: {},
    } satisfies ConstructorParameters<typeof Uploader>[0]

    const uploader = new Uploader(opts)
    const uploadToken = uploader.token

    // validate that the test is resolved on socket connection
    uploader
      .awaitReady(60000)
      .then(() => uploader.tryUploadStream(stream, requireMockReq()))
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
