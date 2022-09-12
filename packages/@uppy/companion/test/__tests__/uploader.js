'use strict'

jest.mock('tus-js-client')

const intoStream = require('into-stream')
const fs = require('node:fs')
const nock = require('nock')

const Uploader = require('../../src/server/Uploader')
const socketClient = require('../mocksocket')
const standalone = require('../../src/standalone')
const Emitter = require('../../src/server/emitter')

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

process.env.COMPANION_DATADIR = './test/output'
process.env.COMPANION_DOMAIN = 'localhost:3020'
const { companionOptions } = standalone()

describe('uploader with tus protocol', () => {
  test('uploader respects uploadUrls', async () => {
    const opts = {
      endpoint: 'http://localhost/files',
      companionOptions: { ...companionOptions, uploadUrls: [/^http:\/\/url.myendpoint.com\//] },
    }

    expect(() => new Uploader(opts)).toThrow(new Uploader.ValidationError('upload destination does not match any allowed destinations'))
  })

  test('uploader respects uploadUrls, valid', async () => {
    const opts = {
      endpoint: 'http://url.myendpoint.com/files',
      companionOptions: { ...companionOptions, uploadUrls: [/^http:\/\/url.myendpoint.com\//] },
    }

    // eslint-disable-next-line no-new
    new Uploader(opts) // no validation error
  })

  test('uploader respects uploadUrls, localhost', async () => {
    const opts = {
      endpoint: 'http://localhost:1337/',
      companionOptions: { ...companionOptions, uploadUrls: [/^http:\/\/localhost:1337\//] },
    }

    // eslint-disable-next-line no-new
    new Uploader(opts) // no validation error
  })

  test('upload functions with tus protocol', async () => {
    const fileContent = Buffer.from('Some file content')
    const stream = intoStream(fileContent)
    const opts = {
      companionOptions,
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      size: fileContent.length,
      pathPrefix: companionOptions.filePath,
    }

    const uploader = new Uploader(opts)
    const uploadToken = uploader.token
    expect(uploadToken).toBeTruthy()

    let firstReceivedProgress

    const onProgress = jest.fn()
    const onUploadSuccess = jest.fn()
    const onBeginUploadEvent = jest.fn()
    const onUploadEvent = jest.fn()

    const emitter = Emitter()
    emitter.on('upload-start', onBeginUploadEvent)
    emitter.on(uploadToken, onUploadEvent)

    const promise = uploader.awaitReady(60000)
    // emulate socket connection
    socketClient.connect(uploadToken)
    socketClient.onProgress(uploadToken, (message) => {
      if (firstReceivedProgress == null) firstReceivedProgress = message.payload.bytesUploaded
      onProgress(message)
    })
    socketClient.onUploadSuccess(uploadToken, onUploadSuccess)
    await promise
    await uploader.tryUploadStream(stream)

    expect(firstReceivedProgress).toBe(8)

    expect(onProgress).toHaveBeenLastCalledWith(expect.objectContaining({
      payload: expect.objectContaining({
        bytesTotal: fileContent.length,
      }),
    }))
    const expectedPayload = expect.objectContaining({
      // see __mocks__/tus-js-client.js
      url: 'https://tus.endpoint/files/foo-bar',
    })
    expect(onUploadSuccess).toHaveBeenCalledWith(expect.objectContaining({
      payload: expectedPayload,
    }))

    expect(onBeginUploadEvent).toHaveBeenCalledWith({ token: uploadToken })
    expect(onUploadEvent).toHaveBeenLastCalledWith({ action: 'success', payload: expectedPayload })
  })

  test('upload functions with tus protocol without size', async () => {
    const fileContent = Buffer.alloc(1e6)
    const stream = intoStream(fileContent)
    const opts = {
      companionOptions,
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      size: null,
      pathPrefix: companionOptions.filePath,
    }

    const uploader = new Uploader(opts)
    uploader.tryDeleteTmpPath = async () => {
      // validate that the tmp file has been downloaded and saved into the file path
      // must do it before it gets deleted
      const fileInfo = fs.statSync(uploader.tmpPath)
      expect(fileInfo.isFile()).toBe(true)
      expect(fileInfo.size).toBe(fileContent.length)

      return uploader.tryDeleteTmpPath()
    }
    const uploadToken = uploader.token
    expect(uploadToken).toBeTruthy()

    return new Promise((resolve, reject) => {
      // validate that the test is resolved on socket connection
      uploader.awaitReady(60000).then(() => {
        uploader.tryUploadStream(stream).then(() => {
          try {
            expect(fs.existsSync(uploader.path)).toBe(false)
            resolve()
          } catch (err) {
            reject(err)
          }
        })
      })

      let firstReceivedProgress

      // emulate socket connection
      socketClient.connect(uploadToken)
      socketClient.onProgress(uploadToken, (message) => {
        if (firstReceivedProgress == null) firstReceivedProgress = message.payload.bytesUploaded
      })
      socketClient.onUploadSuccess(uploadToken, (message) => {
        try {
          expect(message.payload.bytesTotal).toBe(fileContent.length)

          expect(firstReceivedProgress).toBe(8192)
          // see __mocks__/tus-js-client.js
          expect(message.payload.url).toBe('https://tus.endpoint/files/foo-bar')
        } catch (err) {
          reject(err)
        }
      })
    })
  })

  async function runMultipartTest ({ metadata, useFormData, includeSize = true  } = {}) {
    const fileContent = Buffer.from('Some file content')
    const stream = intoStream(fileContent)

    const opts = {
      companionOptions,
      endpoint: 'http://localhost',
      protocol: 'multipart',
      size: includeSize ? fileContent.length : undefined,
      metadata,
      pathPrefix: companionOptions.filePath,
      useFormData,
    }

    const uploader = new Uploader(opts)
    return uploader.uploadStream(stream)
  }

  test('upload functions with xhr protocol', async () => {
    nock('http://localhost').post('/').reply(200)

    const ret = await runMultipartTest()
    expect(ret).toMatchObject({ url: null, extraData: { response: expect.anything(), bytesUploaded: 17 } })
  })

  // eslint-disable-next-line max-len
  const formDataNoMetaMatch = /^----------------------------\d+\r\nContent-Disposition: form-data; name="files\[\]"; filename="uppy-file-[^"]+"\r\nContent-Type: application\/octet-stream\r\n\r\nSome file content\r\n----------------------------\d+--\r\n$/

  test('upload functions with xhr formdata', async () => {
    nock('http://localhost').post('/', formDataNoMetaMatch)
      .reply(200)

    const ret = await runMultipartTest({ useFormData: true })
    expect(ret).toMatchObject({ url: null, extraData: { response: expect.anything(), bytesUploaded: 17 } })
  })

  test('upload functions with unknown file size', async () => {
    // eslint-disable-next-line max-len
    nock('http://localhost').post('/', formDataNoMetaMatch)
      .reply(200)

    const ret = await runMultipartTest({ useFormData: true, includeSize: false })
    expect(ret).toMatchObject({ url: null, extraData: { response: expect.anything(), bytesUploaded: 17 } })
  })

  // https://github.com/transloadit/uppy/issues/3477
  test('upload functions with xhr formdata and metadata', async () => {
    // eslint-disable-next-line max-len
    nock('http://localhost').post('/', /^----------------------------\d+\r\nContent-Disposition: form-data; name="key1"\r\n\r\nnull\r\n----------------------------\d+\r\nContent-Disposition: form-data; name="key2"\r\n\r\ntrue\r\n----------------------------\d+\r\nContent-Disposition: form-data; name="key3"\r\n\r\n\d+\r\n----------------------------\d+\r\nContent-Disposition: form-data; name="key4"\r\n\r\n\[object Object\]\r\n----------------------------\d+\r\nContent-Disposition: form-data; name="key5"\r\n\r\n\(\) => {}\r\n----------------------------\d+\r\nContent-Disposition: form-data; name="key6"\r\n\r\nSymbol\(\)\r\n----------------------------\d+\r\nContent-Disposition: form-data; name="files\[\]"; filename="uppy-file-[^"]+"\r\nContent-Type: application\/octet-stream\r\n\r\nSome file content\r\n----------------------------\d+--\r\n$/)
      .reply(200)

    const metadata = {
      key1: null, key2: true, key3: 1234, key4: {}, key5: () => {}, key6: Symbol(''),
    }
    const ret = await runMultipartTest({ useFormData: true, metadata })
    expect(ret).toMatchObject({ url: null, extraData: { response: expect.anything(), bytesUploaded: 17 } })
  })

  test('uploader checks metadata', () => {
    const opts = {
      companionOptions,
      endpoint: 'http://localhost',
    }

    // eslint-disable-next-line no-new
    new Uploader({ ...opts, metadata: { key: 'string value' } })

    expect(() => new Uploader({ ...opts, metadata: '' })).toThrow(new Uploader.ValidationError('metadata must be an object'))
  })

  test('uploader respects maxFileSize', async () => {
    const opts = {
      endpoint: 'http://url.myendpoint.com/files',
      companionOptions: { ...companionOptions, maxFileSize: 100 },
      size: 101,
    }

    expect(() => new Uploader(opts)).toThrow(new Uploader.ValidationError('maxFileSize exceeded'))
  })

  test('uploader respects maxFileSize correctly', async () => {
    const opts = {
      endpoint: 'http://url.myendpoint.com/files',
      companionOptions: { ...companionOptions, maxFileSize: 100 },
      size: 99,
    }

    // eslint-disable-next-line no-new
    new Uploader(opts) // no validation error
  })

  test('uploader respects maxFileSize with unknown size', async () => {
    const fileContent = Buffer.alloc(10000)
    const stream = intoStream(fileContent)
    const opts = {
      companionOptions: { ...companionOptions, maxFileSize: 1000 },
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      size: null,
      pathPrefix: companionOptions.filePath,
    }

    const uploader = new Uploader(opts)
    const uploadToken = uploader.token

    // validate that the test is resolved on socket connection
    uploader.awaitReady(60000).then(() => uploader.tryUploadStream(stream))
    socketClient.connect(uploadToken)

    return new Promise((resolve, reject) => {
      socketClient.onUploadError(uploadToken, (message) => {
        try {
          expect(message).toMatchObject({ payload: { error: { message: 'maxFileSize exceeded' } } })
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  })
})
