'use strict'

jest.mock('tus-js-client')

const intoStream = require('into-stream')
const fs = require('fs')
const nock = require('nock')

const Uploader = require('../../src/server/Uploader')
const socketClient = require('../mocksocket')
const standalone = require('../../src/standalone')

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

    return new Promise((resolve, reject) => {
      // validate that the test is resolved on socket connection
      uploader.awaitReady().then(() => {
        uploader.tryUploadStream(stream).then(() => resolve())
      })

      let progressReceived = 0
      // emulate socket connection
      socketClient.connect(uploadToken)
      socketClient.onProgress(uploadToken, (message) => {
        progressReceived = message.payload.bytesUploaded
        try {
          expect(message.payload.bytesTotal).toBe(fileContent.length)
        } catch (err) {
          reject(err)
        }
      })
      socketClient.onUploadSuccess(uploadToken, (message) => {
        try {
          expect(progressReceived).toBe(fileContent.length)
          // see __mocks__/tus-js-client.js
          expect(message.payload.url).toBe('https://tus.endpoint/files/foo-bar')
        } catch (err) {
          reject(err)
        }
      })
    })
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
    const uploadToken = uploader.token
    expect(uploadToken).toBeTruthy()

    return new Promise((resolve, reject) => {
      // validate that the test is resolved on socket connection
      uploader.awaitReady().then(() => {
        uploader.tryUploadStream(stream).then(() => {
          try {
            expect(fs.existsSync(uploader.path)).toBe(false)
            resolve()
          } catch (err) {
            reject(err)
          }
        })
      })

      let progressReceived = 0
      // emulate socket connection
      socketClient.connect(uploadToken)
      socketClient.onProgress(uploadToken, (message) => {
        // validate that the file has been downloaded and saved into the file path
        try {
          progressReceived = message.payload.bytesUploaded

          if (progressReceived === fileContent.length) {
            const fileInfo = fs.statSync(uploader.tmpPath)
            expect(fileInfo.isFile()).toBe(true)
            expect(fileInfo.size).toBe(fileContent.length)
            expect(message.payload.bytesTotal).toBe(fileContent.length)
          }
        } catch (err) {
          reject(err)
        }
      })
      socketClient.onUploadSuccess(uploadToken, (message) => {
        try {
          expect(progressReceived).toBe(fileContent.length)
          // see __mocks__/tus-js-client.js
          expect(message.payload.url).toBe('https://tus.endpoint/files/foo-bar')
        } catch (err) {
          reject(err)
        }
      })
    })
  })

  test('upload functions with xhr protocol', async () => {
    const fileContent = Buffer.from('Some file content')
    const stream = intoStream(fileContent)
    const opts = {
      companionOptions,
      endpoint: 'http://localhost',
      protocol: 'multipart',
      size: fileContent.length,
      pathPrefix: companionOptions.filePath,
    }

    nock('http://localhost').post('/').reply(200)

    const uploader = new Uploader(opts)
    const ret = await uploader.uploadStream(stream)
    expect(ret).toMatchObject({ url: null, extraData: { response: expect.anything(), bytesUploaded: 17 } })
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
    uploader.awaitReady().then(uploader.tryUploadStream(stream))
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
