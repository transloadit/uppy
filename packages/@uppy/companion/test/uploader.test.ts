import fs from 'node:fs'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { PassThrough, Readable } from 'node:stream'
import type { Request } from 'express'
import express from 'express'
import nock from 'nock'
import request from 'supertest'
import * as tusClient from 'tus-js-client'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest'
import { defaultOptions } from '../dist/config/companion.js'
import Emitter from '../dist/server/emitter/index.js'
import { isRecord } from '../dist/server/helpers/type-guards.js'
import { startDownUpload } from '../dist/server/helpers/upload.js'
import Uploader, {
  toClientError,
  ValidationError,
} from '../dist/server/Uploader.js'
import standalone from '../dist/standalone/index.js'
import * as socketClient from './mocksocket.js'

vi.mock('tus-js-client')
vi.mock('express-prom-bundle')

function getTusMockLastUploadFile(): unknown {
  const getter = Reflect.get(tusClient, '__getLastUploadFile')
  if (typeof getter !== 'function') {
    throw new Error('Expected tus mock to expose __getLastUploadFile()')
  }
  return getter()
}

function resetTusMockState(): void {
  const reset = Reflect.get(tusClient, '__resetTusMockState')
  if (typeof reset !== 'function') {
    throw new Error('Expected tus mock to expose __resetTusMockState()')
  }
  reset()
}

afterEach(() => {
  nock.cleanAll()
  resetTusMockState()
})
afterAll(() => {
  nock.restore()
})

process.env['COMPANION_DATADIR'] = './test/output'
process.env['COMPANION_DOMAIN'] = 'localhost:3020'
process.env['COMPANION_CLIENT_ORIGINS'] = 'true'
const { companionOptions } = standalone()
const runtimeOptions = {
  ...defaultOptions,
  secret: '',
  filePath: '',
  server: { ...defaultOptions.server, host: '' },
}
const pathPrefix =
  companionOptions.filePath != null
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
  mockReq.companion = { options: runtimeOptions, s3ProviderClients: new Map() }
})

describe('uploader', () => {
  test('uploader respects uploadUrls', () => {
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

  test('uploader respects uploadUrls, valid', () => {
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

  test('uploader respects uploadUrls, localhost', () => {
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

  // Regression test for https://github.com/transloadit/uppy/issues/6480:
  // string entries used to be compiled into unanchored regexes, so any
  // destination merely *containing* an allowed URL was accepted.
  test.each([
    'http://internal-admin:9090/admin?next=https://uploads.myendpoint.com/files/',
    'http://internal-admin:9090/admin#https://uploads.myendpoint.com/files/',
    'http://169.254.169.254/latest/meta-data/?u=https://uploads.myendpoint.com/files/',
    'https://uploads.myendpoint.com.evil.com/files/',
    'https://evil.com/https://uploads.myendpoint.com/files/',
    'https://uploads.myendpoint.com/filesomething',
    'http://uploads.myendpoint.com/files/',
  ])('uploader rejects string uploadUrls that only contain an allowed URL: %s', (endpoint) => {
    const opts = {
      companionOptions: {
        ...companionOptions,
        uploadUrls: ['https://uploads.myendpoint.com/files/'],
      },
      endpoint,
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

  test.each([
    'https://uploads.myendpoint.com/files/',
    'https://uploads.myendpoint.com/files/nested/file.txt',
    'https://UPLOADS.myendpoint.com/files/',
    'https://uploads.myendpoint.com:443/files/',
  ])('uploader accepts string uploadUrls literally: %s', (endpoint) => {
    const opts = {
      companionOptions: {
        ...companionOptions,
        uploadUrls: ['https://uploads.myendpoint.com/files/'],
      },
      endpoint,
      protocol: 'multipart',
      size: 1,
      pathPrefix,
      metadata: { name: 'file.txt', type: 'text/plain' },
    } satisfies ConstructorParameters<typeof Uploader>[0]

    new Uploader(opts) // no validation error
  })

  test('uploader accepts an origin-only string uploadUrl for that origin', () => {
    const opts = {
      companionOptions: {
        ...companionOptions,
        uploadUrls: ['https://uploads.myendpoint.com'],
      },
      endpoint: 'https://uploads.myendpoint.com/anything',
      protocol: 'multipart',
      size: 1,
      pathPrefix,
      metadata: { name: 'file.txt', type: 'text/plain' },
    } satisfies ConstructorParameters<typeof Uploader>[0]

    new Uploader(opts) // no validation error
  })

  test('uploader matches and stores the normalized destination', () => {
    // WHATWG URL and legacy url.parse disagree on this spelling; Companion
    // must match and connect with one and the same string.
    const uploader = new Uploader({
      companionOptions: {
        ...companionOptions,
        uploadUrls: ['http://tusd.internal:1080/files/'],
      },
      endpoint: 'http://\\x@tusd.internal:1080/files/',
      protocol: 'tus',
      size: 1,
      pathPrefix,
      metadata: {},
    })
    expect(uploader.options.endpoint).toBe('http://x@tusd.internal:1080/files/')
  })

  test.each([
    'https://uploads.myendpoint.com/files/../admin',
    'https://uploads.myendpoint.com/files/%2e%2e/admin',
  ])('uploader resolves dot segments before matching uploadUrls: %s', (endpoint) => {
    expect(
      () =>
        new Uploader({
          companionOptions: {
            ...companionOptions,
            uploadUrls: [/^https:\/\/uploads\.myendpoint\.com\/files\//],
          },
          endpoint,
          protocol: 'tus',
          size: 1,
          pathPrefix,
          metadata: {},
        }),
    ).toThrow(
      new ValidationError(
        'upload destination does not match any allowed destinations',
      ),
    )
  })

  test('uploader validates uploadUrl in addition to endpoint', () => {
    const opts = {
      companionOptions: {
        ...companionOptions,
        uploadUrls: ['https://uploads.myendpoint.com/files/'],
      },
      endpoint: 'https://uploads.myendpoint.com/files/',
      uploadUrl:
        'http://internal-admin:9090/admin?next=https://uploads.myendpoint.com/files/',
      protocol: 'tus',
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
    const completed = new Promise<void>((resolve) => {
      socketClient.onUploadSuccess(uploadToken, (message) => {
        onUploadSuccess(message)
        resolve()
      })
    })
    // emulate socket connection
    await socketClient.connect(uploadToken)
    await promise
    await uploader.tryUploadStream(stream, requireMockReq())
    await completed
    expect(getTusMockLastUploadFile()).toBeInstanceOf(Readable)

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

  test('upload functions with tus protocol without size', () => {
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
    uploader.tryDeleteTmpPath = async () => {
      // validate that the tmp file has been downloaded and saved into the file path
      // must do it before it gets deleted
      const tmpPath = uploader.tmpPath
      if (tmpPath == null) {
        throw new Error('Expected uploader.tmpPath to be a string')
      }
      const fileInfo = fs.statSync(tmpPath)
      expect(fileInfo.isFile()).toBe(true)
      expect(fileInfo.size).toBe(fileContent.length)

      await originalTryDeleteTmpPath()
    }
    const uploadToken = uploader.token
    expect(uploadToken).toBeTruthy()

    return new Promise<void>((resolve, reject) => {
      // validate that the test is resolved on socket connection
      uploader.awaitReady(60000).then(() => {
        uploader.tryUploadStream(stream, requireMockReq()).then(() => {
          try {
            const tmpPath = uploader.tmpPath
            if (tmpPath == null) {
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

      // emulate socket connection
      socketClient.connect(uploadToken).catch(reject)
    })
  })

  function runMultipartTest({
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
      companionOptions: {
        ...companionOptions,
        streamingUpload: true,
        ...extraCompanionOpts,
      },
      endpoint: `http://${address}`,
      protocol: 'multipart',
      ...(includeSize && { size: fileContent.length }),
      metadata: metadata ?? {},
      pathPrefix,
      ...(useFormData != null && { useFormData }),
    }

    stream.pause()

    const uploader = new Uploader(opts)
    return uploader.uploadStream(stream, requireMockReq())
  }

  test('a download stream that errors before the socket connects fails the upload cleanly', async () => {
    // startDownUpload holds the stream until the client's progress socket
    // connects. An 'error' on it in that window had no listener and exited
    // the process.
    const req = requireMockReq()
    const stream = new PassThrough()
    const json = vi.fn()
    const res = { status: () => ({ json }) } as never
    req.body = { endpoint: 'http://url.myendpoint.com/files', protocol: 'tus' }
    try {
      await startDownUpload({
        req,
        res,
        getSize: undefined,
        download: async () => ({ stream, size: 5 }),
      })
    } finally {
      req.body = undefined
    }
    const token = (json.mock.calls[0]?.[0] as { token: string }).token

    stream.destroy(new Error('boom'))
    // Let the 'error' event fire before anything else happens, as it would
    // while a real client is still opening its socket.
    await new Promise((resolve) => setImmediate(resolve))

    const errorMessage = new Promise((resolve) =>
      socketClient.onUploadError(token, resolve),
    )
    socketClient.connect(token)
    await expect(errorMessage).resolves.toMatchObject({
      payload: { error: { message: 'boom' } },
    })
  })

  test('a refused import destroys the download stream', async () => {
    // download() runs before the Uploader validates options. A refused import
    // must not leave the opened stream and its socket behind.
    const req = requireMockReq()
    const prevBody = req.body
    const prevCompanion = req.companion
    req.body = { endpoint: 'http://not-allowed.local/files', protocol: 'tus' }
    req.companion = {
      ...prevCompanion,
      options: { ...runtimeOptions, uploadUrls: ['http://allowed.local/'] },
    }
    const stream = new PassThrough()
    try {
      await expect(
        startDownUpload({
          req,
          res: { status: () => ({ json: vi.fn() }) } as never,
          getSize: undefined,
          download: async () => ({ stream, size: 1 }),
        }),
      ).rejects.toThrow(ValidationError)
      expect(stream.destroyed).toBe(true)
    } finally {
      req.body = prevBody
      req.companion = prevCompanion
    }
  })

  test('an import whose socket never connects destroys the download stream', async () => {
    const req = requireMockReq()
    const prevBody = req.body
    const prevCompanion = req.companion
    req.body = { endpoint: 'http://url.myendpoint.com/files', protocol: 'tus' }
    req.companion = {
      ...prevCompanion,
      options: { ...runtimeOptions, clientSocketConnectTimeout: 1 },
    }
    const stream = new PassThrough()
    const json = vi.fn()
    try {
      await startDownUpload({
        req,
        res: { status: () => ({ json }) } as never,
        getSize: undefined,
        download: async () => ({ stream, size: 1 }),
      })
      // The forked upload waits for the socket, times out after 1 ms and must
      // destroy the never-claimed stream.
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(stream.destroyed).toBe(true)
    } finally {
      req.body = prevBody
      req.companion = prevCompanion
    }
  })

  test('an import whose socket never connects removes its emitter listeners', async () => {
    const req = requireMockReq()
    const prevBody = req.body
    const prevCompanion = req.companion
    req.body = { endpoint: 'http://url.myendpoint.com/files', protocol: 'tus' }
    req.companion = {
      ...prevCompanion,
      options: { ...runtimeOptions, clientSocketConnectTimeout: 1 },
    }
    const stream = new PassThrough()
    const json = vi.fn()
    // Works for both emitters: the Redis one has no listenerCount.
    const removeAll = vi.spyOn(Emitter(), 'removeAllListeners')
    try {
      await startDownUpload({
        req,
        res: { status: () => ({ json }) } as never,
        getSize: undefined,
        download: async () => ({ stream, size: 1 }),
      })
      const { token } = json.mock.calls[0]?.[0] as { token: string }
      await new Promise((resolve) => setTimeout(resolve, 100))
      for (const event of ['cancel', 'pause', 'resume']) {
        expect(removeAll).toHaveBeenCalledWith(`${event}:${token}`)
      }
    } finally {
      removeAll.mockRestore()
      req.body = prevBody
      req.companion = prevCompanion
    }
  })

  test('does not retry a failed PUT upload', async () => {
    // got retries PUT (not POST) on network errors by default. The body here is
    // a one-shot stream, so the retry threw out of band after the promise had
    // settled and took the process down.
    nock.enableNetConnect('127.0.0.1')
    let requests = 0
    const endpoint = http.createServer((req) => {
      requests++
      req.socket.destroy()
    })
    await new Promise<void>((resolve) =>
      endpoint.listen(0, '127.0.0.1', resolve),
    )
    const { port } = endpoint.address() as AddressInfo

    try {
      const fileContent = Buffer.from('Some file content')
      const stream = Readable.from([fileContent])
      stream.pause()
      const uploader = new Uploader({
        companionOptions: {
          ...companionOptions,
          streamingUpload: true,
          uploadUrls: [`http://127.0.0.1:${port}/`],
        },
        endpoint: `http://127.0.0.1:${port}/`,
        protocol: 'multipart',
        httpMethod: 'PUT',
        useFormData: true,
        size: fileContent.length,
        metadata: {},
        pathPrefix,
      })

      await expect(
        uploader.uploadStream(stream, requireMockReq()),
      ).rejects.toThrow()
      // got's first retry would fire after ~1 s.
      await new Promise((resolve) => setTimeout(resolve, 1500))
      expect(requests).toBe(1)
    } finally {
      endpoint.close()
      nock.enableNetConnect()
    }
  }, 10_000)

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
      ret?.extraData &&
      isRecord(ret.extraData['response']) &&
      isRecord(ret.extraData['response']['headers'])
        ? ret.extraData['response']['headers']
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

  test('uploader respects maxFileSize', () => {
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

  test('uploader respects maxFileSize correctly', () => {
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

  test('uploader respects maxFileSize with unknown size', () => {
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
    return new Promise<void>((resolve, reject) => {
      socketClient.onUploadError(uploadToken, (message) => {
        try {
          expect(message).toEqual({
            action: 'error',
            payload: {
              error: {
                name: 'Error',
                message: 'maxFileSize exceeded',
              },
            },
          })
          resolve()
        } catch (err) {
          reject(err)
        }
      })
      socketClient.connect(uploadToken).catch(reject)
    })
  })
})

test('toClientError keeps only name and message', () => {
  const err = Object.assign(new Error('upload failed'), {
    cause: { options: { headers: { authorization: 'Bearer victim' } } },
    options: { headers: { authorization: 'Bearer victim' } },
  })
  expect(toClientError(err)).toEqual({
    name: 'Error',
    message: 'upload failed',
  })
})

test("toClientError passes on the destination's answer to a failed upload", () => {
  const err = Object.assign(new Error('Bad Request'), {
    extraData: {
      status: 400,
      statusText: 'Bad Request',
      responseText: '{"error":"too big"}',
      headers: { 'content-type': 'application/json' },
      request: { headers: { authorization: 'Bearer victim' } },
    },
    cause: { options: { headers: { authorization: 'Bearer victim' } } },
  })
  expect(toClientError(err)).toEqual({
    name: 'Error',
    message: 'Bad Request',
    extraData: {
      status: 400,
      statusText: 'Bad Request',
      responseText: '{"error":"too big"}',
      headers: { 'content-type': 'application/json' },
    },
  })
})

test('toClientError on non-Error throwables', () => {
  expect(toClientError({ message: { nested: true } })).toEqual({
    name: 'Error',
    message: 'Unknown error',
  })
  expect(toClientError('plain string')).toEqual({
    name: 'Error',
    message: 'plain string',
  })
})
