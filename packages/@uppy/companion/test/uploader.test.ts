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
  beforeEach,
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
  PAUSED_TIMEOUT_MS,
  STALL_TIMEOUT_MS,
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

function getTusMockLastUploadedBytes(): number {
  const getter = Reflect.get(tusClient, '__getLastUploadedBytes')
  if (typeof getter !== 'function') {
    throw new Error('Expected tus mock to expose __getLastUploadedBytes()')
  }
  return getter()
}

function setTusHang(value: boolean): void {
  const setter = Reflect.get(tusClient, '__setHang')
  if (typeof setter !== 'function') {
    throw new Error('Expected tus mock to expose __setHang()')
  }
  setter(value)
}

function getTusSentRequests(): string[] {
  const getter = Reflect.get(tusClient, '__getSentRequests')
  if (typeof getter !== 'function') {
    throw new Error('Expected tus mock to expose __getSentRequests()')
  }
  return getter()
}

function setTusStartGate(gate: Promise<void> | undefined): void {
  const setter = Reflect.get(tusClient, '__setStartGate')
  if (typeof setter !== 'function') {
    throw new Error('Expected tus mock to expose __setStartGate()')
  }
  setter(gate)
}

function resetTusMockState(): void {
  const reset = Reflect.get(tusClient, '__resetTusMockState')
  if (typeof reset !== 'function') {
    throw new Error('Expected tus mock to expose __resetTusMockState()')
  }
  reset()
}

function setNextTusRequestUrl(url: string | undefined): void {
  const setter = Reflect.get(tusClient, '__setNextRequestUrl')
  if (typeof setter !== 'function') {
    throw new Error('Expected tus mock to expose __setNextRequestUrl()')
  }
  setter(url)
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

  test('a tus upload paused while downloading the file first waits for resume', async () => {
    const uploader = new Uploader({
      companionOptions: { ...companionOptions, streamingUpload: false },
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      size: 17,
      pathPrefix,
      metadata: { name: 'file.txt', type: 'text/plain' },
    })
    const stream = new PassThrough()
    const upload = uploader.uploadStream(stream, requireMockReq())
    const settled = vi.fn()
    upload.then(settled, settled)

    // The Redis emitter delivers asynchronously; our listeners run after the
    // uploader's.
    const paused = Promise.withResolvers<void>()
    await Emitter().on(`pause:${uploader.token}`, () => paused.resolve())
    Emitter().emit(`pause:${uploader.token}`)
    await paused.promise
    // The download ends while paused. This used to drop the upload and open
    // the temp file after deleting it: an unhandled ENOENT.
    stream.end(Buffer.from('Some file content'))
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(settled).not.toHaveBeenCalled()
    expect(getTusMockLastUploadFile()).toBeInstanceOf(fs.ReadStream)

    const resumed = Promise.withResolvers<void>()
    await Emitter().on(`resume:${uploader.token}`, () => resumed.resolve())
    Emitter().emit(`resume:${uploader.token}`)
    await resumed.promise
    await expect(upload).resolves.toMatchObject({
      url: 'https://tus.endpoint/files/foo-bar',
    })
    uploader.removeEmitterListeners()
  })

  describe('tus requests after pause or cancel', () => {
    // The Redis emitter delivers asynchronously; a listener added after the
    // uploader's runs after it.
    const deliver = async (event: string, token: string) => {
      const delivered = Promise.withResolvers<void>()
      await Emitter().on(`${event}:${token}`, () => delivered.resolve())
      Emitter().emit(`${event}:${token}`)
      await delivered.promise
    }
    const startTusUpload = async (streamingUpload: boolean) => {
      setTusHang(true)
      const uploader = new Uploader({
        companionOptions: { ...companionOptions, streamingUpload },
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tus',
        size: 17,
        pathPrefix,
        metadata: { name: 'file.txt', type: 'text/plain' },
      })
      const stream = new PassThrough()
      const upload = uploader.uploadStream(stream, requireMockReq())
      upload.catch(() => {})
      stream.end(Buffer.from('Some file content'))
      await vi.waitFor(() => expect(getTusSentRequests()).toEqual(['POST']))
      return { uploader, upload }
    }

    test.each([
      true,
      false,
    ])('a resume pending at cancel sends nothing after the DELETE (streamingUpload: %s)', async (streamingUpload) => {
      const { uploader, upload } = await startTusUpload(streamingUpload)
      await deliver('pause', uploader.token)
      // The start() that resume issues is still on its way to a request
      // (the real client stats the file first) when the cancel lands.
      const pending = Promise.withResolvers<void>()
      setTusStartGate(pending.promise)
      await deliver('resume', uploader.token)
      await deliver('cancel', uploader.token)
      await expect(upload).rejects.toThrow('Canceled')
      pending.resolve()
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(getTusSentRequests()).toEqual(['POST', 'DELETE'])
      uploader.removeEmitterListeners()
    })

    test('a paused upload can still be canceled and terminated', async () => {
      const { uploader, upload } = await startTusUpload(true)
      await deliver('pause', uploader.token)
      await deliver('cancel', uploader.token)
      await expect(upload).rejects.toThrow('Canceled')
      expect(getTusSentRequests()).toEqual(['POST', 'DELETE'])
      uploader.removeEmitterListeners()
    })

    test('a paused upload resumes', async () => {
      const { uploader, upload } = await startTusUpload(true)
      await deliver('pause', uploader.token)
      setTusHang(false)
      await deliver('resume', uploader.token)
      await expect(upload).resolves.toMatchObject({
        url: 'https://tus.endpoint/files/foo-bar',
      })
      expect(getTusSentRequests()).toEqual(['POST', 'POST'])
      uploader.removeEmitterListeners()
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
    headers,
  }: {
    metadata?: Record<string, unknown>
    useFormData?: boolean
    includeSize?: boolean
    address?: string
    extraCompanionOpts?: Record<string, unknown>
    headers?: Record<string, unknown>
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
      ...(headers != null && { headers }),
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

  describe('tus transfers that stop moving', () => {
    const startHangingUpload = (extraCompanionOpts = {}) => {
      setTusHang(true)
      const uploader = new Uploader({
        companionOptions: {
          ...companionOptions,
          streamingUpload: true,
          ...extraCompanionOpts,
        },
        endpoint: 'http://url.myendpoint.com/files',
        protocol: 'tus',
        size: 1000,
        pathPrefix,
        metadata: { name: 'file.txt', type: 'text/plain' },
      })
      const stream = new PassThrough()
      const upload = uploader.uploadStream(stream, requireMockReq())
      upload.catch(() => {})
      return { uploader, stream, upload }
    }

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    test('a transfer whose source stops sending is abandoned', async () => {
      const { uploader, upload } = startHangingUpload()
      await vi.advanceTimersByTimeAsync(2 * STALL_TIMEOUT_MS)
      await expect(upload).rejects.toThrow('Upload stalled')
      uploader.removeEmitterListeners()
    })

    test.each([
      {},
      // maxFileSize puts a byte counter between the source and tus.
      { maxFileSize: 1e6 },
    ])('a transfer whose source keeps sending is left alone: %o', async (extraCompanionOpts) => {
      const { uploader, stream, upload } =
        startHangingUpload(extraCompanionOpts)
      const settled = vi.fn()
      upload.then(settled, settled)
      for (let i = 0; i < 4; i++) {
        stream.write(Buffer.alloc(10))
        await vi.advanceTimersByTimeAsync(STALL_TIMEOUT_MS)
      }
      expect(settled).not.toHaveBeenCalled()
      Emitter().emit(`cancel:${uploader.token}`)
      await expect(upload).rejects.toThrow('Canceled')
      uploader.removeEmitterListeners()
    })

    test('a transfer paused and never resumed is abandoned', async () => {
      const { uploader, upload } = startHangingUpload()
      // The Redis emitter delivers asynchronously: let the pause land before
      // the clock moves. Our listener runs after the uploader's.
      const paused = Promise.withResolvers<void>()
      await Emitter().on(`pause:${uploader.token}`, () => paused.resolve())
      Emitter().emit(`pause:${uploader.token}`)
      await paused.promise
      await vi.advanceTimersByTimeAsync(PAUSED_TIMEOUT_MS - STALL_TIMEOUT_MS)
      const settled = vi.fn()
      upload.then(settled, settled)
      await vi.advanceTimersByTimeAsync(0)
      expect(settled).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(2 * STALL_TIMEOUT_MS)
      await expect(upload).rejects.toThrow('Upload was paused for too long')
      uploader.removeEmitterListeners()
    })

    test('cancel settles the upload even when the source already closed', async () => {
      const { uploader, stream, upload } = startHangingUpload()
      await vi.advanceTimersByTimeAsync(0)
      stream.destroy()
      // The Redis emitter subscribes asynchronously; once a later subscription
      // on the same connection is in place, the uploader's is too.
      await Emitter().on(`cancel:${uploader.token}`, () => {})
      Emitter().emit(`cancel:${uploader.token}`)
      await expect(upload).rejects.toThrow('Canceled')
      uploader.removeEmitterListeners()
    })
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

  describe('raw multipart body framing', () => {
    async function withServer(
      fn: (url: string, seen: string[]) => Promise<void>,
    ) {
      const seen: string[] = []
      const server = http.createServer((req, res) => {
        seen.push(req.url ?? '')
        req.resume()
        req.on('end', () => res.end('ok'))
      })
      await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
      try {
        await fn(
          `http://127.0.0.1:${(server.address() as AddressInfo).port}/`,
          seen,
        )
      } finally {
        server.close()
      }
    }
    const upload = (url: string, chunks: Buffer[], size: number) => {
      const stream = Readable.from(chunks)
      stream.pause() // as download.ts hands it over
      return new Uploader({
        companionOptions: { ...companionOptions, streamingUpload: true },
        endpoint: url,
        protocol: 'multipart',
        useFormData: false,
        size,
        metadata: {},
        pathPrefix,
      }).uploadStream(stream, requireMockReq())
    }

    test('bytes beyond the announced size never reach the destination', () =>
      withServer(async (url, seen) => {
        // With a keep-alive connection, surplus bytes after Content-Length
        // are parsed by the destination as the next request.
        const body = Buffer.from('Some file content') // 17 bytes
        const extra = Buffer.from('GET /smuggled HTTP/1.1\r\nHost: x\r\n\r\n')
        await expect(upload(url, [body, extra], body.length)).rejects.toThrow(
          /more than the announced 17 bytes/,
        )
        await new Promise((r) => setTimeout(r, 200))
        // The upload may or may not reach the server as a request at all,
        // depending on when the abort lands; what must never happen is the
        // surplus bytes being parsed there as a second (smuggled) request.
        expect(seen).not.toContain('/smuggled')
      }))

    test('a body shorter than announced fails instead of leaving the destination waiting', () =>
      withServer(async (url) => {
        await expect(upload(url, [Buffer.from('short')], 17)).rejects.toThrow(
          /sent 5 of the announced 17 bytes/,
        )
      }))
  })

  describe('maxFileSize on streamed bytes', () => {
    // validateOptions sees only the size the source announces; a chunked
    // response announces none, a lying one understates it.
    test.each([
      { useFormData: false, size: undefined },
      { useFormData: true, size: undefined },
      { useFormData: true, size: 100 },
    ])('a source sending more than maxFileSize fails the upload: %o', async ({
      useFormData,
      size,
    }) => {
      let received = 0
      const server = http.createServer((req, res) => {
        req.on('data', (chunk: Buffer) => {
          received += chunk.length
        })
        req.on('end', () => res.end('ok'))
      })
      await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
      try {
        const total = 10 * 1000
        const stream = Readable.from(
          Array.from({ length: 10 }, () => Buffer.alloc(1000)),
        )
        stream.pause()
        const uploader = new Uploader({
          companionOptions: {
            ...companionOptions,
            streamingUpload: true,
            maxFileSize: 2500,
          },
          endpoint: `http://127.0.0.1:${(server.address() as AddressInfo).port}/`,
          protocol: 'multipart',
          useFormData,
          ...(size != null && { size }),
          metadata: {},
          pathPrefix,
        })
        await expect(
          uploader.uploadStream(stream, requireMockReq()),
        ).rejects.toThrow('maxFileSize exceeded')
        await new Promise((r) => setTimeout(r, 200))
        expect(received).toBeLessThan(total)
        expect(stream.destroyed).toBe(true)
      } finally {
        server.close()
      }
    })
  })

  describe('server-supplied upload URLs', () => {
    const tusOpts = (uploadUrls: Array<string | RegExp> | undefined) =>
      ({
        companionOptions: {
          ...companionOptions,
          streamingUpload: true,
          ...(uploadUrls && { uploadUrls }),
        },
        endpoint: 'https://tus.endpoint/files/',
        protocol: 'tus',
        size: 17,
        metadata: {},
        pathPrefix,
      }) satisfies ConstructorParameters<typeof Uploader>[0]

    const runTus = (uploadUrls: Array<string | RegExp> | undefined) => {
      const stream = Readable.from([Buffer.alloc(17)])
      stream.pause()
      return new Uploader(tusOpts(uploadUrls)).uploadStream(
        stream,
        requireMockReq(),
      )
    }

    test('a tus Location outside uploadUrls is refused', async () => {
      setNextTusRequestUrl('http://127.0.0.1:9000/internal')
      await expect(runTus(['https://tus.endpoint/files/'])).rejects.toThrow(
        /allowed destinations/,
      )
    })

    test('a tus Location inside uploadUrls still uploads', async () => {
      setNextTusRequestUrl('https://tus.endpoint/files/abc')
      await expect(
        runTus(['https://tus.endpoint/files/']),
      ).resolves.toMatchObject({ url: expect.any(String) })
    })

    test('any tus Location uploads when uploadUrls is unset', async () => {
      setNextTusRequestUrl('http://anywhere.local/x')
      await expect(runTus(undefined)).resolves.toMatchObject({
        url: expect.any(String),
      })
    })

    test('a multipart redirect outside uploadUrls is not followed', async () => {
      nock('http://localhost')
        .post('/')
        .reply(302, '', { location: 'http://internal.local/admin' })
      const internal = nock('http://internal.local')
        .get('/admin')
        .reply(200, 'secret')
      await expect(
        runMultipartTest({
          useFormData: false,
          extraCompanionOpts: { uploadUrls: ['http://localhost/'] },
        }),
      ).rejects.toThrow()
      expect(internal.isDone()).toBe(false)
      nock.cleanAll()
    })
  })

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

  test('a client header cannot override uploadHeaders by changing its case', async () => {
    nock('http://localhost')
      .post('/')
      .matchHeader('x-tenant', 'operator')
      .matchHeader('x-client', 'kept')
      .reply(200, () => '')

    await expect(
      runMultipartTest({
        extraCompanionOpts: { uploadHeaders: { 'X-Tenant': 'operator' } },
        headers: {
          'X-Tenant': 'client',
          'x-tenant': 'client',
          'X-TENANT': 'client',
          'x-client': 'kept',
        },
      }),
    ).resolves.toMatchObject({ extraData: { bytesUploaded: 17 } })
  })

  test('a client cannot set forwarding headers, the operator can', async () => {
    nock('http://localhost', { badheaders: ['forwarded', 'x-forwarded-host'] })
      .post('/')
      .matchHeader('x-forwarded-proto', 'https')
      .matchHeader('x-client', 'kept')
      .reply(200, () => '')

    await expect(
      runMultipartTest({
        extraCompanionOpts: { uploadHeaders: { 'X-Forwarded-Proto': 'https' } },
        headers: {
          Forwarded: 'host=evil.example',
          'X-Forwarded-Host': 'evil.example',
          'x-client': 'kept',
        },
      }),
    ).resolves.toMatchObject({ extraData: { bytesUploaded: 17 } })
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

  describe('maxFileSize in streaming mode', () => {
    const maxFileSize = 10_000

    // Emits `totalBytes` in small chunks, keeping track of how much was read
    function createSourceStream(totalBytes: number) {
      const source = { bytesRead: 0 }
      const stream = Readable.from(
        (function* generate() {
          while (source.bytesRead < totalBytes) {
            const chunk = Buffer.alloc(
              Math.min(1000, totalBytes - source.bytesRead),
            )
            source.bytesRead += chunk.length
            yield chunk
          }
        })(),
      )
      return { stream, source }
    }

    async function runStreamingUpload({
      protocol,
      totalBytes,
      size,
      useFormData = false,
      tusDeferredUploadLength = true,
    }: {
      protocol: 'tus' | 'multipart'
      totalBytes: number
      size?: number
      useFormData?: boolean
      tusDeferredUploadLength?: boolean
    }) {
      let requestBody: unknown
      if (protocol === 'multipart')
        nock('http://localhost')
          .post('/')
          .reply(200, (_uri, body) => {
            requestBody = body
            return ''
          })

      const { stream, source } = createSourceStream(totalBytes)
      const uploader = new Uploader({
        companionOptions: {
          ...companionOptions,
          maxFileSize,
          streamingUpload: true,
          tusDeferredUploadLength,
        },
        endpoint: 'http://localhost',
        protocol,
        useFormData,
        ...(size != null && { size }),
        pathPrefix,
        metadata: {},
      })
      const uploadToken = uploader.token

      const result = new Promise<socketClient.UploadMessage>((resolve) => {
        socketClient.onUploadError(uploadToken, resolve)
        socketClient.onUploadSuccess(uploadToken, resolve)
      })
      const ready = uploader.awaitReady(60000)
      await socketClient.connect(uploadToken)
      await ready
      await uploader.tryUploadStream(stream, requireMockReq())
      return {
        message: await result,
        source,
        getRequestBody: () => requestBody,
      }
    }

    test.each([
      undefined,
      100,
    ])('tus upload of an oversized stream with declared size %s is aborted', async (size) => {
      const totalBytes = 1e6
      const { message, source } = await runStreamingUpload({
        protocol: 'tus',
        totalBytes,
        ...(size != null && { size }),
      })
      expect(message).toMatchObject({
        action: 'error',
        payload: { error: { message: 'maxFileSize exceeded' } },
      })
      // the source must not have been read until the end
      expect(source.bytesRead).toBeLessThan(totalBytes)
    })

    test('tus upload of a stream without declared size requires tusDeferredUploadLength', async () => {
      const { message } = await runStreamingUpload({
        protocol: 'tus',
        totalBytes: 1e6,
        tusDeferredUploadLength: false,
      })
      expect(message).toMatchObject({
        action: 'error',
        payload: {
          error: {
            message:
              'tusDeferredUploadLength needs to be enabled if no file size is provided by the provider',
          },
        },
      })
    })

    test('tus upload of an oversized stream with understated declared size stops early', async () => {
      const totalBytes = 1e6
      const size = 100
      const { message, source } = await runStreamingUpload({
        protocol: 'tus',
        totalBytes,
        size,
        tusDeferredUploadLength: false,
      })
      // tus stops reading after the declared size, but the limiter reads ahead of it and may
      // cross maxFileSize first, so the outcome races. Either way, the source is not read to the end.
      expect(['success', 'error']).toContain(message.action)
      if (message.action === 'error') {
        expect(message).toMatchObject({
          payload: { error: { message: 'maxFileSize exceeded' } },
        })
      }
      expect(source.bytesRead).toBeLessThan(totalBytes)
    })

    test.each([
      ['tus', true, undefined],
      ['tus', false, maxFileSize],
      ['multipart', true, undefined],
    ] as const)('%s upload (tusDeferredUploadLength %s) of a stream within maxFileSize with declared size %s succeeds', async (protocol, tusDeferredUploadLength, size) => {
      const { message, source } = await runStreamingUpload({
        protocol,
        totalBytes: maxFileSize,
        tusDeferredUploadLength,
        ...(size != null && { size }),
      })
      expect(message).toMatchObject({ action: 'success' })
      expect(source.bytesRead).toBe(maxFileSize)
      if (protocol === 'tus')
        expect(getTusMockLastUploadedBytes()).toBe(maxFileSize)
    })

    // FormData reads the file stream lazily, after the progress listener is attached
    test.each([
      undefined,
      maxFileSize,
    ])('multipart form-data upload of a stream within maxFileSize with declared size %s sends the whole file', async (size) => {
      const { message, getRequestBody } = await runStreamingUpload({
        protocol: 'multipart',
        totalBytes: maxFileSize,
        useFormData: true,
        ...(size != null && { size }),
      })
      expect(message).toMatchObject({ action: 'success' })
      const body = getRequestBody()
      expect(typeof body).toBe('string')
      // the file consists of zero bytes only, the rest of the form-data body is text
      expect(String(body).match(/\0/g)).toHaveLength(maxFileSize)
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
