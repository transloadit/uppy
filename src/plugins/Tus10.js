const Plugin = require('./Plugin')
const tus = require('tus-js-client')
const UppySocket = require('../core/UppySocket')
const Utils = require('../core/Utils')
require('whatwg-fetch')

// Extracted from https://github.com/tus/tus-js-client/blob/master/lib/upload.js#L13
// excepted we removed 'fingerprint' key to avoid adding more dependencies
const tusDefaultOptions = {
  endpoint: '',
  resume: true,
  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,
  headers: {},
  chunkSize: Infinity,
  withCredentials: false,
  uploadUrl: null,
  uploadSize: null,
  overridePatchMethod: false,
  retryDelays: null
}

/**
 * Tus resumable file uploader
 *
 */
module.exports = class Tus10 extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'
    this.id = 'Tus'
    this.title = 'Tus'

    // set default options
    const defaultOptions = {
      resume: true,
      allowPause: true,
      autoRetry: true
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.handlePauseAll = this.handlePauseAll.bind(this)
    this.handleResumeAll = this.handleResumeAll.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
  }

  pauseResume (action, fileID) {
    const updatedFiles = Object.assign({}, this.core.getState().files)
    const inProgressUpdatedFiles = Object.keys(updatedFiles).filter((file) => {
      return !updatedFiles[file].progress.uploadComplete &&
             updatedFiles[file].progress.uploadStarted
    })

    switch (action) {
      case 'toggle':
        if (updatedFiles[fileID].uploadComplete) return

        const wasPaused = updatedFiles[fileID].isPaused || false
        const isPaused = !wasPaused
        let updatedFile
        if (wasPaused) {
          updatedFile = Object.assign({}, updatedFiles[fileID], {
            isPaused: false
          })
        } else {
          updatedFile = Object.assign({}, updatedFiles[fileID], {
            isPaused: true
          })
        }
        updatedFiles[fileID] = updatedFile
        this.core.setState({files: updatedFiles})
        return isPaused
      case 'pauseAll':
        inProgressUpdatedFiles.forEach((file) => {
          const updatedFile = Object.assign({}, updatedFiles[file], {
            isPaused: true
          })
          updatedFiles[file] = updatedFile
        })
        this.core.setState({files: updatedFiles})
        return
      case 'resumeAll':
        inProgressUpdatedFiles.forEach((file) => {
          const updatedFile = Object.assign({}, updatedFiles[file], {
            isPaused: false
          })
          updatedFiles[file] = updatedFile
        })
        this.core.setState({files: updatedFiles})
        return
    }
  }

  handlePauseAll () {
    this.pauseResume('pauseAll')
  }

  handleResumeAll () {
    this.pauseResume('resumeAll')
  }

  /**
   * Create a new Tus upload
   *
   * @param {object} file for use with upload
   * @param {integer} current file in a queue
   * @param {integer} total number of files in a queue
   * @returns {Promise}
   */
  upload (file, current, total) {
    this.core.log(`uploading ${current} of ${total}`)

    // Create a new tus upload
    return new Promise((resolve, reject) => {
      const optsTus = Object.assign(
        {},
        tusDefaultOptions,
        this.opts,
        // Install file-specific upload overrides.
        file.tus || {}
      )

      optsTus.onError = (err) => {
        this.core.log(err)
        this.core.emitter.emit('core:upload-error', file.id, err)
        reject('Failed because: ' + err)
      }

      optsTus.onProgress = (bytesUploaded, bytesTotal) => {
        this.onReceiveUploadUrl(file, upload.url)
        this.core.emitter.emit('core:upload-progress', {
          uploader: this,
          id: file.id,
          bytesUploaded: bytesUploaded,
          bytesTotal: bytesTotal
        })
      }

      optsTus.onSuccess = () => {
        this.core.emitter.emit('core:upload-success', file.id, upload, upload.url)

        if (upload.url) {
          this.core.log('Download ' + upload.file.name + ' from ' + upload.url)
        }

        resolve(upload)
      }
      optsTus.metadata = file.meta

      const upload = new tus.Upload(file.data, optsTus)

      this.onFileRemove(file.id, () => {
        this.core.log('removing file:', file.id)
        upload.abort()
        resolve(`upload ${file.id} was removed`)
      })

      this.onPause(file.id, (isPaused) => {
        isPaused ? upload.abort() : upload.start()
      })

      this.onPauseAll(file.id, () => {
        upload.abort()
      })

      this.onResumeAll(file.id, () => {
        upload.start()
      })

      this.core.on('core:retry-started', () => {
        const files = this.core.getState().files
        if (files[file.id].progress.uploadComplete ||
          !files[file.id].progress.uploadStarted ||
          files[file.id].isPaused
            ) {
          return
        }
        upload.start()
      })

      upload.start()
      this.core.emitter.emit('core:upload-started', file.id, upload)
    })
  }

  uploadRemote (file, current, total) {
    return new Promise((resolve, reject) => {
      this.core.log(file.remote.url)
      let endpoint = this.opts.endpoint
      if (file.tus && file.tus.endpoint) {
        endpoint = file.tus.endpoint
      }

      this.core.emitter.emit('core:upload-started', file.id)

      fetch(file.remote.url, {
        method: 'post',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.assign({}, file.remote.body, {
          endpoint,
          protocol: 'tus',
          size: file.data.size,
          metadata: file.meta
        }))
      })
      .then((res) => {
        if (res.status < 200 && res.status > 300) {
          return reject(res.statusText)
        }

        res.json().then((data) => {
          const token = data.token
          const host = Utils.getSocketHost(file.remote.host)
          const socket = new UppySocket({ target: `${host}/api/${token}` })

          this.onFileRemove(file.id, () => {
            socket.send('pause', {})
            resolve(`upload ${file.id} was removed`)
          })

          this.onPause(file.id, (isPaused) => {
            isPaused ? socket.send('pause', {}) : socket.send('resume', {})
          })

          this.onPauseAll(file.id, () => {
            socket.send('pause', {})
          })

          this.onResumeAll(file.id, () => {
            socket.send('resume', {})
          })

          socket.on('progress', (progressData) => Utils.emitSocketProgress(this, progressData, file))

          socket.on('success', (data) => {
            this.core.emitter.emit('core:upload-success', file.id, data, data.url)
            socket.close()
            return resolve()
          })
        })
      })
    })
  }

  getFile (fileID) {
    return this.core.state.files[fileID]
  }

  onReceiveUploadUrl (file, uploadURL) {
    const currentFile = this.getFile(file.id)
    // Only do the update if we didn't have an upload URL yet.
    if (!currentFile.tus || currentFile.tus.uploadUrl !== uploadURL) {
      const newFile = Object.assign({}, currentFile, {
        tus: Object.assign({}, currentFile.tus, {
          uploadUrl: uploadURL
        })
      })
      const files = Object.assign({}, this.core.state.files, {
        [currentFile.id]: newFile
      })
      this.core.setState({ files })
    }
  }

  onFileRemove (fileID, cb) {
    this.core.emitter.on('core:file-remove', (targetFileID) => {
      if (fileID === targetFileID) cb()
    })
  }

  onPause (fileID, cb) {
    this.core.emitter.on('core:upload-pause', (targetFileID) => {
      if (fileID === targetFileID) {
        const isPaused = this.pauseResume('toggle', fileID)
        cb(isPaused)
      }
    })
  }

  onPauseAll (fileID, cb) {
    this.core.emitter.on('core:pause-all', () => {
      if (!this.core.getFile(fileID)) return
      cb()
    })
  }

  onResumeAll (fileID, cb) {
    this.core.emitter.on('core:resume-all', () => {
      if (!this.core.getFile(fileID)) return
      cb()
    })
  }

  uploadFiles (files) {
    files.forEach((file, index) => {
      const current = parseInt(index, 10) + 1
      const total = files.length

      if (!file.isRemote) {
        this.upload(file, current, total)
      } else {
        this.uploadRemote(file, current, total)
      }
    })
  }

  handleUpload (fileIDs) {
    if (fileIDs.length === 0) {
      this.core.log('Tus: no files to upload!')
      return Promise.resolve()
    }

    this.core.log('Tus is uploading...')
    const filesToUpload = fileIDs.map((fileID) => this.core.getFile(fileID))

    this.uploadFiles(filesToUpload)

    return new Promise((resolve) => {
      this.core.bus.once('core:upload-complete', resolve)
    })
  }

  actions () {
    this.core.emitter.on('core:pause-all', this.handlePauseAll)
    this.core.emitter.on('core:resume-all', this.handleResumeAll)

    if (this.opts.autoRetry) {
      this.core.emitter.on('back-online', () => {
        this.core.emitter.emit('core:retry-started')
      })
    }
  }

  addResumableUploadsCapabilityFlag () {
    const newCapabilities = Object.assign({}, this.core.getState().capabilities)
    newCapabilities.resumableUploads = true
    this.core.setState({
      capabilities: newCapabilities
    })
  }

  install () {
    this.addResumableUploadsCapabilityFlag()
    this.core.addUploader(this.handleUpload)
    this.actions()
  }

  uninstall () {
    this.core.removeUploader(this.handleUpload)
    this.core.emitter.off('core:pause-all', this.handlePauseAll)
    this.core.emitter.off('core:resume-all', this.handleResumeAll)
  }
}
