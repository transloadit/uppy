/* global jest:false, test:false, expect:false, describe:false */

jest.mock('tus-js-client')

const fs = require('fs')
const Uploader = require('../../src/server/Uploader')
const socketClient = require('../mocksocket')
const { companionOptions } = require('../../src/standalone')

describe('uploader with tus protocol', () => {
  test('upload functions with tus protocol', () => {
    const fileContent = Buffer.from('Some file content')
    const opts = {
      companionOptions: companionOptions,
      endpoint: 'http://url.myendpoint.com/files',
      protocol: 'tus',
      size: fileContent.length,
      pathPrefix: companionOptions.filePath
    }

    const uploader = new Uploader(opts)
    const uploadToken = uploader.token
    expect(uploader.hasError()).toBe(false)
    expect(uploadToken).toBeTruthy()

    return new Promise((resolve) => {
      // validate that the test is resolved on socket connection
      uploader.onSocketReady(() => {
        const fileInfo = fs.statSync(uploader.path)
        expect(fileInfo.isFile()).toBe(true)
        expect(fileInfo.size).toBe(0)
        uploader.handleChunk(null, fileContent)
        uploader.handleChunk(null, null)
      })

      let progressReceived = 0
      // emulate socket connection
      socketClient.connect(uploadToken)
      socketClient.onProgress(uploadToken, (message) => {
        // validate that the file has been downloaded and saved into the file path
        const fileInfo = fs.statSync(uploader.path)
        expect(fileInfo.isFile()).toBe(true)
        expect(fileInfo.size).toBe(fileContent.length)

        progressReceived = message.payload.bytesUploaded
        expect(message.payload.bytesTotal).toBe(fileContent.length)
      })
      socketClient.onUploadSuccess(uploadToken, (message) => {
        expect(progressReceived).toBe(fileContent.length)
        // see __mocks__/tus-js-client.js
        expect(message.payload.url).toBe('https://tus.endpoint/files/foo-bar')
        setTimeout(() => {
          // check that file has been cleaned up
          expect(fs.existsSync(uploader.path)).toBe(false)
          resolve()
        }, 100)
      })
    })
  })
})
