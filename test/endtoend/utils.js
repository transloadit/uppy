/* eslint-disable compat/compat */
/* global window, capabilities */
const path = require('path')
const { spawn } = require('child_process')
const { promisify } = require('util')

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
  // no remote file uploads right now...
  if (process.env.CI) return false

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
      env: {
        ...process.env,
        COMPANION_DATADIR: path.join(__dirname, '../../output'),
        COMPANION_DOMAIN: 'localhost:3030',
        COMPANION_PROTOCOL: 'http',
        COMPANION_PORT: 3030,
        COMPANION_SECRET: process.env.TEST_COMPANION_SECRET,
        COMPANION_DROPBOX_KEY: process.env.TEST_COMPANION_DROPBOX_KEY,
        COMPANION_DROPBOX_SECRET: process.env.TEST_COMPANION_DROPBOX_SECRET,
        COMPANION_GOOGLE_KEY: process.env.TEST_COMPANION_GOOGLE_KEY,
        COMPANION_GOOGLE_SECRET: process.env.TEST_COMPANION_GOOGLE_SECRET
      }
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

const express = require('express')
class StaticServerService {
  constructor ({ folders, staticServerPort = 4567 }) {
    this.folders = folders
    this.port = staticServerPort
  }

  async onPrepare () {
    if (!this.folders) return

    this.app = express()

    for (const desc of this.folders) {
      this.app.use(desc.mount, express.static(desc.path))
    }

    const listen = promisify(this.app.listen.bind(this.app))

    this.server = await listen(this.port)
  }

  async onComplete () {
    if (this.server) {
      const close = promisify(this.server.close.bind(this.server))
      await close()
    }
    this.app = null
  }
}

const tus = require('tus-node-server')
const os = require('os')
const rimraf = promisify(require('rimraf'))
const { randomBytes } = require('crypto')
class TusService {
  constructor ({ tusServerPort = 1080 }) {
    this.port = tusServerPort
    this.path = path.join(os.tmpdir(), `uppy-e2e-tus-node-server-${randomBytes(6).toString('hex')}`)
  }

  async onPrepare () {
    console.log('Starting TusService', this)
    this.tusServer = new tus.Server()
    this.tusServer.datastore = new tus.FileStore({
      path: '/files',
      directory: this.path
    })

    const listen = promisify(this.tusServer.listen.bind(this.tusServer))
    this.server = await listen({ host: '0.0.0.0', port: this.port })
  }

  async onComplete () {
    console.log('Stopping TusService', this)
    if (this.server) {
      const close = promisify(this.server.close.bind(this.server))
      await close()
    }
    await rimraf(this.path)
    this.tusServer = null
  }
}

module.exports = {
  selectFakeFile,
  supportsChooseFile,
  CompanionService,
  StaticServerService,
  TusService
}
