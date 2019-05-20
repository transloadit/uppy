/* eslint-disable compat/compat */
/* global window, capabilities */
const path = require('path')
const { spawn } = require('child_process')

// This function must be valid ES5, because it is run in the browser
// and IE10/IE11 do not support new syntax features
function selectFakeFile (uppyID, name, type, b64) {
  if (!b64) b64 = 'PHN2ZyB2aWV3Qm94PSIwIDAgMTIwIDEyMCI+CiAgPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iNTAiLz4KPC9zdmc+Cg=='
  if (!type) type = 'image/svg+xml'

  // https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
  function base64toBlob (base64Data, contentType) {
    contentType = contentType || ''
    var sliceSize = 1024
    var byteCharacters = atob(base64Data)
    var bytesLength = byteCharacters.length
    var slicesCount = Math.ceil(bytesLength / sliceSize)
    var byteArrays = new Array(slicesCount)

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
      var begin = sliceIndex * sliceSize
      var end = Math.min(begin + sliceSize, bytesLength)

      var bytes = new Array(end - begin)
      for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
        bytes[i] = byteCharacters[offset].charCodeAt(0)
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes)
    }
    return new Blob(byteArrays, { type: contentType })
  }

  var blob = base64toBlob(b64, type)

  window[uppyID].addFile({
    source: 'test',
    name: name || 'test-file',
    type: blob.type,
    data: blob
  })
}

function supportsChooseFile () {
  // Webdriver for Safari and Edge doesn’t support .chooseFile
  return capabilities.browserName !== 'Safari' &&
         capabilities.browserName !== 'MicrosoftEdge' &&
         capabilities.platformName !== 'Android'
}

function prematureExit () {
  throw new Error('Companion exited early')
}

class CompanionService {
  onPrepare () {
    this.companion = spawn('node', [
      path.join(__dirname, '../../packages/@uppy/companion/lib/standalone/start-server')
    ], {
      stdio: 'pipe',
      env: Object.assign({}, process.env, {
        COMPANION_DATADIR: path.join(__dirname, '../../output'),
        COMPANION_DOMAIN: 'localhost:3030',
        COMPANION_PROTOCOL: 'http',
        COMPANION_PORT: 3030,
        COMPANION_SECRET: process.env.TEST_COMPANION_SECRET,
        COMPANION_DROPBOX_KEY: process.env.TEST_COMPANION_DROPBOX_KEY,
        COMPANION_DROPBOX_SECRET: process.env.TEST_COMPANION_DROPBOX_SECRET,
        COMPANION_GOOGLE_KEY: process.env.TEST_COMPANION_GOOGLE_KEY,
        COMPANION_GOOGLE_SECRET: process.env.TEST_COMPANION_GOOGLE_SECRET
      })
    })
    return new Promise((resolve, reject) => {
      this.companion.on('error', reject)
      this.companion.stdout.on('data', (chunk) => {
        if (`${chunk}`.includes('Listening on')) {
          resolve()
        }
      })

      this.companion.on('error', console.error)
      this.companion.stderr.pipe(process.stderr)
      this.companion.on('exit', prematureExit)
    })
  }

  onComplete () {
    return new Promise((resolve) => {
      this.companion.removeListener('exit', prematureExit)
      this.companion.on('exit', () => resolve())
      this.companion.kill('SIGINT')
    })
  }
}

module.exports = {
  selectFakeFile,
  supportsChooseFile,
  CompanionService
}
