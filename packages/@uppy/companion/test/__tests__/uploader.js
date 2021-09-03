/* global jest:false, test:false, expect:false, describe:false */

jest.mock('tus-js-client')

const intoStream = require('into-stream')
const fs = require('fs')

const Uploader = require('../../src/server/Uploader')
const socketClient = require('../mocksocket')
const standalone = require('../../src/standalone')

const { companionOptions } = standalone()

describe('uploader with tus protocol', () => {
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
    expect(uploader.hasError()).toBe(false)
    expect(uploadToken).toBeTruthy()

    return new Promise((resolve, reject) => {
      // validate that the test is resolved on socket connection
      uploader.awaitReady().then(() => {
        uploader.uploadStream(stream).then(() => resolve())
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
    expect(uploader.hasError()).toBe(false)
    expect(uploadToken).toBeTruthy()

    return new Promise((resolve, reject) => {
      // validate that the test is resolved on socket connection
      uploader.awaitReady().then(() => {
        uploader.uploadStream(stream).then(() => {
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
          const fileInfo = fs.statSync(uploader.tmpPath)
          expect(fileInfo.isFile()).toBe(true)
          expect(fileInfo.size).toBe(fileContent.length)

          progressReceived = message.payload.bytesUploaded
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
})
