import { Socket, Provider, RequestClient } from '@uppy/companion-client'
import EventManager from '@uppy/utils/lib/EventManager'
import emitSocketProgress from '@uppy/utils/lib/emitSocketProgress'
import getSocketHost from '@uppy/utils/lib/getSocketHost'
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue'
import { filterNonFailedFiles, filterFilesToEmitUploadStarted } from '@uppy/utils/lib/fileFilters'
import { createAbortError } from '@uppy/utils/lib/AbortController'
import AwsS3Multipart from './index.js'
import packageJson from '../package.json'
import MultipartUploader from './MultipartUploader.js'

export default class _AwsS3Multipart extends AwsS3Multipart {
  static VERSION = packageJson.version

  #queueRequestSocketToken

  #companionCommunicationQueue

  #client

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'uploader'
    this.id = this.opts.id || 'AwsS3Multipart'
    this.title = 'AWS S3 Multipart'
    this.#client = new RequestClient(uppy, opts)

    const defaultOptions = {
      // TODO: null here means “include all”, [] means include none.
      // This is inconsistent with @uppy/aws-s3 and @uppy/transloadit
      allowedMetaFields: null,
      limit: 6,
      // eslint-disable-next-line no-bitwise
      shouldUseMultipart: (file) => file.size >> 10 >> 10 > 100,
      retryDelays: [0, 1000, 3000, 5000],
      createMultipartUpload: this.createMultipartUpload.bind(this),
      listParts: this.listParts.bind(this),
      abortMultipartUpload: this.abortMultipartUpload.bind(this),
      completeMultipartUpload: this.completeMultipartUpload.bind(this),
      signPart: this.signPart.bind(this),
      uploadPartBytes: AwsS3Multipart.uploadPartBytes,
      getUploadParameters: this.getUploadParameters.bind(this),
      companionHeaders: {},
    }

    this.opts = { ...defaultOptions, ...opts }
    if (opts?.prepareUploadParts != null && opts.signPart == null) {
      this.opts.signPart = async (file, { uploadId, key, partNumber, body, signal }) => {
        const { presignedUrls, headers } = await opts
          .prepareUploadParts(file, { uploadId, key, parts: [{ number: partNumber, chunk: body }], signal })
        return { url: presignedUrls?.[partNumber], headers: headers?.[partNumber] }
      }
    }

    /**
     * Simultaneous upload limiting is shared across all uploads with this plugin.
     *
     * @type {RateLimitedQueue}
     */
    this.requests = this.opts.rateLimitedQueue ?? new RateLimitedQueue(this.opts.limit)
    this.#companionCommunicationQueue = new HTTPCommunicationQueue(this.requests, this.opts, this.#setS3MultipartState)

    this.uploaders = Object.create(null)
    this.uploaderEvents = Object.create(null)
    this.uploaderSockets = Object.create(null)

    this.#queueRequestSocketToken = this.requests.wrapPromiseFunction(this.#requestSocketToken, { priority: -1 })
  }

  [Symbol.for('uppy test: getClient')] () { return this.#client }

  setOptions (newOptions) {
    this.#companionCommunicationQueue.setOptions(newOptions)
    return super.setOptions(newOptions)
  }

  /**
   * Clean up all references for a file's upload: the MultipartUploader instance,
   * any events related to the file, and the Companion WebSocket connection.
   *
   * Set `opts.abort` to tell S3 that the multipart upload is cancelled and must be removed.
   * This should be done when the user cancels the upload, not when the upload is completed or errored.
   */
  resetUploaderReferences (fileID, opts = {}) {
    if (this.uploaders[fileID]) {
      this.uploaders[fileID].abort({ really: opts.abort || false })
      this.uploaders[fileID] = null
    }
    if (this.uploaderEvents[fileID]) {
      this.uploaderEvents[fileID].remove()
      this.uploaderEvents[fileID] = null
    }
    if (this.uploaderSockets[fileID]) {
      this.uploaderSockets[fileID].close()
      this.uploaderSockets[fileID] = null
    }
  }

  // TODO: make this a private method in the next major
  assertHost (method) {
    if (!this.opts.companionUrl) {
      throw new Error(`Expected a \`companionUrl\` option containing a Companion address, or if you are not using Companion, a custom \`${method}\` implementation.`)
    }
  }

  #credentials
  async getAWSCredentials (signal) {
    this.assertHost('getAWSCredentials')
    throwIfAborted(signal)

    if (this.#credentials?.expires)
  }

  createMultipartUpload (file, signal) {
    this.assertHost('createMultipartUpload')
    throwIfAborted(signal)

    const metadata = getAllowedMetadata({ meta: file.meta, allowedMetaFields: this.opts.allowedMetaFields })

    return this.#client.post('s3/multipart', {
      filename: file.name,
      type: file.type,
      metadata,
    }, { signal }).then(assertServerError)
  }

  listParts (file, { key, uploadId }, signal) {
    this.assertHost('listParts')
    throwIfAborted(signal)

    const filename = encodeURIComponent(key)
    return this.#client.get(`s3/multipart/${uploadId}?key=${filename}`, { signal })
      .then(assertServerError)
  }

  completeMultipartUpload (file, { key, uploadId, parts }, signal) {
    this.assertHost('completeMultipartUpload')
    throwIfAborted(signal)

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId)
    return this.#client.post(`s3/multipart/${uploadIdEnc}/complete?key=${filename}`, { parts }, { signal })
      .then(assertServerError)
  }

  signPart (file, { uploadId, key, partNumber, signal }) {
    this.assertHost('signPart')
    throwIfAborted(signal)

    if (uploadId == null || key == null || partNumber == null) {
      throw new Error('Cannot sign without a key, an uploadId, and a partNumber')
    }

    const filename = encodeURIComponent(key)
    return this.#client.get(`s3/multipart/${uploadId}/${partNumber}?key=${filename}`, { signal })
      .then(assertServerError)
  }

  abortMultipartUpload (file, { key, uploadId }, signal) {
    this.assertHost('abortMultipartUpload')

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId)
    return this.#client.delete(`s3/multipart/${uploadIdEnc}?key=${filename}`, undefined, { signal })
      .then(assertServerError)
  }

  getUploadParameters (file, options) {
    const { meta } = file
    const { type, name: filename } = meta
    const metadata = getAllowedMetadata({ meta, allowedMetaFields: this.opts.allowedMetaFields, querify: true })

    const query = new URLSearchParams({ filename, type, ...metadata })

    return this.#client.get(`s3/params?${query}`, options)
  }

  static async uploadPartBytes ({ signature: { url, expires, headers, method = 'PUT' }, body, size = body.size, onProgress, onComplete, signal }) {
    throwIfAborted(signal)

    if (url == null) {
      throw new Error('Cannot upload to an undefined URL')
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open(method, url, true)
      if (headers) {
        Object.keys(headers).forEach((key) => {
          xhr.setRequestHeader(key, headers[key])
        })
      }
      xhr.responseType = 'text'
      if (typeof expires === 'number') {
        xhr.timeout = expires * 1000
      }

      function onabort () {
        xhr.abort()
      }
      function cleanup () {
        signal.removeEventListener('abort', onabort)
      }
      signal.addEventListener('abort', onabort)

      xhr.upload.addEventListener('progress', (ev) => {
        onProgress(ev)
      })

      xhr.addEventListener('abort', () => {
        cleanup()

        reject(createAbortError())
      })

      xhr.addEventListener('timeout', () => {
        cleanup()

        const error = new Error('Request has expired')
        error.source = { status: 403 }
        reject(error)
      })
      xhr.addEventListener('load', (ev) => {
        cleanup()

        if (ev.target.status === 403 && ev.target.responseText.includes('<Message>Request has expired</Message>')) {
          const error = new Error('Request has expired')
          error.source = ev.target
          reject(error)
          return
        } if (ev.target.status < 200 || ev.target.status >= 300) {
          const error = new Error('Non 2xx')
          error.source = ev.target
          reject(error)
          return
        }

        // todo make a proper onProgress API (breaking change)
        onProgress?.({ loaded: size, lengthComputable: true })

        // NOTE This must be allowed by CORS.
        const etag = ev.target.getResponseHeader('ETag')

        if (etag === null) {
          reject(new Error('AwsS3/Multipart: Could not read the ETag header. This likely means CORS is not configured correctly on the S3 Bucket. See https://uppy.io/docs/aws-s3-multipart#S3-Bucket-Configuration for instructions.'))
          return
        }

        onComplete?.(etag)
        resolve({
          ETag: etag,
        })
      })

      xhr.addEventListener('error', (ev) => {
        cleanup()

        const error = new Error('Unknown error')
        error.source = ev.target
        reject(error)
      })

      xhr.send(body)
    })
  }

  #setS3MultipartState = (file, { key, uploadId }) => {
    const cFile = this.uppy.getFile(file.id)
    this.uppy.setFileState(file.id, {
      s3Multipart: {
        ...cFile.s3Multipart,
        key,
        uploadId,
      },
    })
  }

  #uploadFile (file) {
    return new Promise((resolve, reject) => {
      const getFile = () => this.uppy.getFile(file.id) || file

      const onProgress = (bytesUploaded, bytesTotal) => {
        this.uppy.emit('upload-progress', file, {
          uploader: this,
          bytesUploaded,
          bytesTotal,
        })
      }

      const onError = (err) => {
        this.uppy.log(err)
        this.uppy.emit('upload-error', file, err)

        this.resetUploaderReferences(file.id)
        reject(err)
      }

      const onSuccess = (result) => {
        const uploadResp = {
          body: {
            ...result,
          },
          uploadURL: result.location,
        }

        this.resetUploaderReferences(file.id)

        this.uppy.emit('upload-success', getFile(), uploadResp)

        if (result.location) {
          this.uppy.log(`Download ${file.name} from ${result.location}`)
        }

        resolve()
      }

      const onPartComplete = (part) => {
        this.uppy.emit('s3-multipart:part-uploaded', getFile(), part)
      }

      const upload = new MultipartUploader(file.data, {
        // .bind to pass the file object to each handler.
        companionComm: this.#companionCommunicationQueue,

        log: (...args) => this.uppy.log(...args),
        getChunkSize: this.opts.getChunkSize ? this.opts.getChunkSize.bind(this) : null,

        onProgress,
        onError,
        onSuccess,
        onPartComplete,

        file,
        shouldUseMultipart: this.opts.shouldUseMultipart,

        ...file.s3Multipart,
      })

      this.uploaders[file.id] = upload
      this.uploaderEvents[file.id] = new EventManager(this.uppy)

      this.onFileRemove(file.id, (removed) => {
        upload.abort()
        this.resetUploaderReferences(file.id, { abort: true })
        resolve(`upload ${removed.id} was removed`)
      })

      this.onCancelAll(file.id, ({ reason } = {}) => {
        if (reason === 'user') {
          upload.abort()
          this.resetUploaderReferences(file.id, { abort: true })
        }
        resolve(`upload ${file.id} was canceled`)
      })

      this.onFilePause(file.id, (isPaused) => {
        if (isPaused) {
          upload.pause()
        } else {
          upload.start()
        }
      })

      this.onPauseAll(file.id, () => {
        upload.pause()
      })

      this.onResumeAll(file.id, () => {
        upload.start()
      })

      upload.start()
    })
  }

  #requestSocketToken = async (file) => {
    const Client = file.remote.providerOptions.provider ? Provider : RequestClient
    const client = new Client(this.uppy, file.remote.providerOptions)
    const opts = { ...this.opts }

    if (file.tus) {
      // Install file-specific upload overrides.
      Object.assign(opts, file.tus)
    }

    if (file.remote.url == null) {
      throw new Error('Cannot connect to an undefined URL')
    }

    const res = await client.post(file.remote.url, {
      ...file.remote.body,
      protocol: 's3-multipart',
      size: file.data.size,
      metadata: file.meta,
    })
    return res.token
  }

  // NOTE! Keep this duplicated code in sync with other plugins
  // TODO we should probably abstract this into a common function
  async #uploadRemote (file) {
    this.resetUploaderReferences(file.id)

    try {
      if (file.serverToken) {
        return await this.connectToServerSocket(file)
      }
      const serverToken = await this.#queueRequestSocketToken(file)

      if (!this.uppy.getState().files[file.id]) return undefined

      this.uppy.setFileState(file.id, { serverToken })
      return await this.connectToServerSocket(this.uppy.getFile(file.id))
    } catch (err) {
      this.uppy.setFileState(file.id, { serverToken: undefined })
      this.uppy.emit('upload-error', file, err)
      throw err
    }
  }

  async connectToServerSocket (file) {
    return new Promise((resolve, reject) => {
      let queuedRequest

      const token = file.serverToken
      const host = getSocketHost(file.remote.companionUrl)
      const socket = new Socket({ target: `${host}/api/${token}`, autoOpen: false })
      this.uploaderSockets[file.id] = socket
      this.uploaderEvents[file.id] = new EventManager(this.uppy)

      this.onFileRemove(file.id, () => {
        socket.send('cancel', {})
        queuedRequest.abort()
        this.resetUploaderReferences(file.id, { abort: true })
        resolve(`upload ${file.id} was removed`)
      })

      this.onFilePause(file.id, (isPaused) => {
        if (isPaused) {
          // Remove this file from the queue so another file can start in its place.
          socket.send('pause', {})
          queuedRequest.abort()
        } else {
          // Resuming an upload should be queued, else you could pause and then
          // resume a queued upload to make it skip the queue.
          queuedRequest.abort()
          queuedRequest = this.requests.run(() => {
            socket.open()
            socket.send('resume', {})
            return () => {}
          })
        }
      })

      this.onPauseAll(file.id, () => {
        // First send the message, then call .abort,
        // just to make sure socket is not closed, which .abort used to do
        socket.send('pause', {})
        queuedRequest.abort()
      })

      this.onCancelAll(file.id, ({ reason } = {}) => {
        if (reason === 'user') {
          socket.send('cancel', {})
          queuedRequest.abort()
          this.resetUploaderReferences(file.id)
        }
        resolve(`upload ${file.id} was canceled`)
      })

      this.onResumeAll(file.id, () => {
        queuedRequest.abort()
        if (file.error) {
          socket.send('pause', {})
        }
        queuedRequest = this.requests.run(() => {
          socket.open()
          socket.send('resume', {})

          return () => {}
        })
      })

      this.onRetry(file.id, () => {
        // Only do the retry if the upload is actually in progress;
        // else we could try to send these messages when the upload is still queued.
        // We may need a better check for this since the socket may also be closed
        // for other reasons, like network failures.
        if (socket.isOpen) {
          socket.send('pause', {})
          socket.send('resume', {})
        }
      })

      this.onRetryAll(file.id, () => {
        if (socket.isOpen) {
          socket.send('pause', {})
          socket.send('resume', {})
        }
      })

      socket.on('progress', (progressData) => emitSocketProgress(this, progressData, file))

      socket.on('error', (errData) => {
        this.uppy.emit('upload-error', file, new Error(errData.error))
        this.resetUploaderReferences(file.id)
        socket.close()
        queuedRequest.done()
        reject(new Error(errData.error))
      })

      socket.on('success', (data) => {
        const uploadResp = {
          uploadURL: data.url,
        }

        this.uppy.emit('upload-success', file, uploadResp)
        this.resetUploaderReferences(file.id)
        socket.close()
        queuedRequest.done()
        resolve()
      })

      queuedRequest = this.requests.run(() => {
        if (file.isPaused) {
          socket.send('pause', {})
        } else {
          socket.open()
        }

        return () => {}
      })
    })
  }

  #upload = async (fileIDs) => {
    if (fileIDs.length === 0) return undefined

    const files = this.uppy.getFilesByIds(fileIDs)

    const filesFiltered = filterNonFailedFiles(files)
    const filesToEmit = filterFilesToEmitUploadStarted(filesFiltered)
    this.uppy.emit('upload-start', filesToEmit)

    const promises = filesFiltered.map((file) => {
      if (file.isRemote) {
        return this.#uploadRemote(file)
      }
      return this.#uploadFile(file)
    })

    return Promise.all(promises)
  }

  #setCompanionHeaders = () => {
    this.#client.setCompanionHeaders(this.opts.companionHeaders)
  }

  onFileRemove (fileID, cb) {
    this.uploaderEvents[fileID].on('file-removed', (file) => {
      if (fileID === file.id) cb(file.id)
    })
  }

  onFilePause (fileID, cb) {
    this.uploaderEvents[fileID].on('upload-pause', (targetFileID, isPaused) => {
      if (fileID === targetFileID) {
        cb(isPaused)
      }
    })
  }

  onRetry (fileID, cb) {
    this.uploaderEvents[fileID].on('upload-retry', (targetFileID) => {
      if (fileID === targetFileID) {
        cb()
      }
    })
  }

  onRetryAll (fileID, cb) {
    this.uploaderEvents[fileID].on('retry-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  onPauseAll (fileID, cb) {
    this.uploaderEvents[fileID].on('pause-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  onCancelAll (fileID, eventHandler) {
    this.uploaderEvents[fileID].on('cancel-all', (...args) => {
      if (!this.uppy.getFile(fileID)) return
      eventHandler(...args)
    })
  }

  onResumeAll (fileID, cb) {
    this.uploaderEvents[fileID].on('resume-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  install () {
    const { capabilities } = this.uppy.getState()
    this.uppy.setState({
      capabilities: {
        ...capabilities,
        resumableUploads: true,
      },
    })
    this.uppy.addPreProcessor(this.#setCompanionHeaders)
    this.uppy.addUploader(this.#upload)
  }

  uninstall () {
    const { capabilities } = this.uppy.getState()
    this.uppy.setState({
      capabilities: {
        ...capabilities,
        resumableUploads: false,
      },
    })
    this.uppy.removePreProcessor(this.#setCompanionHeaders)
    this.uppy.removeUploader(this.#upload)
  }
}
