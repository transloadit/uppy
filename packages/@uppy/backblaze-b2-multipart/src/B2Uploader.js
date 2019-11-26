const sha1 = require('js-sha1')
const MAX_PARTS_PER_UPLOAD = 10000

const defaultOptions = {
  limit: 1,
  recommendedChunkSizeDivisor: 10, // default is 100MB (100MB / 10 = 10MB)
  onStart () {},
  onProgress () {},
  onPartComplete () {},
  onSuccess () {},
  onError (err) {
    throw err
  }
}

function remove (arr, el) {
  const i = arr.indexOf(el)
  if (i !== -1) arr.splice(i, 1)
}

class B2Uploader {
  constructor (file, options) {
    this.options = {
      ...defaultOptions,
      ...options
    }
    this.file = file

    this.parts = this.options.parts || []
    this.fileId = this.options.fileId

    // Do `this.createdPromise.then(OP)` to execute an operation `OP` _only_ if the
    // upload was created already. That also ensures that the sequencing is right
    // (so the `OP` definitely happens if the upload is created).
    //
    // This mostly exists to make `_abortUpload` work well: only sending the abort request if
    // the upload was already created, and if the createMultipartUpload request is still in flight,
    // aborting it immediately after it finishes.
    this.createdPromise = Promise.reject() // eslint-disable-line prefer-promise-reject-errors
    this.isPaused = false
    this.chunks = null
    this.chunkState = null
    this.uploading = []

    this.isMultiPart = this._initChunks(options.config)

    this.createdPromise.catch(() => {}) // silence uncaught rejection warning
  }

  /**
   * Take the file and slice it up into chunks, returns true if more than 1 chunks
   * were created (indicating a multi-part upload).
   */
  _initChunks ({ absoluteMinimumPartSize, recommendedPartSize }) {
    const chunks = []
    const modifiedRecommendedPartSize = Math.ceil(recommendedPartSize / this.options.recommendedChunkSizeDivisor)
    const targetChunkSize = Math.max(absoluteMinimumPartSize, modifiedRecommendedPartSize)
    const chunkSize = Math.max(Math.ceil(this.file.size / MAX_PARTS_PER_UPLOAD), targetChunkSize)

    for (let i = 0; i < this.file.size; i += chunkSize) {
      const end = Math.min(this.file.size, i + chunkSize)
      chunks.push(this.file.slice(i, end))
    }

    this.chunks = chunks
    this.chunkState = chunks.map(() => ({
      uploaded: 0,
      busy: false,
      done: false
    }))

    return chunks.length > 1
  }

  /**
   * Prepare a new file upload and begin sending.
   */
  _createUpload () {
    this.createdPromise = Promise.resolve().then(() => {
      if (this.isMultiPart) {
        return this.options.createMultipartUpload()
      } else {
        return { isMultiPart: true } // single-part upload doesn't require cancellation
      }
    })

    return this.createdPromise.then((result) => {
      if (this.isMultiPart) {
        const valid = typeof result === 'object' && result &&
          typeof result.fileId === 'string'
        if (!valid) {
          throw new TypeError('BackblazeB2/Multipart: Got incorrect result from `createMultipartUpload()`, expected an object `{ fileId }`.')
        }
        this.fileId = result.fileId
      }
      this.options.onStart(result)
      this._uploadParts()
    }).catch(err => {
      this._onError(err)
    })
  }

  /**
   * Fetch a list of complete chunks from the server and set any matching
   * chunkStates to 'done' so Uppy knows they needn't be uploaded again.
   */
  _resumeUpload () {
    return this.options.listParts({
      fileId: this.fileId
    }).then(result => {
      const valid = typeof result === 'object' && result &&
        typeof result.parts === 'object' && typeof result.parts.length === 'number'
      if (!valid) {
        throw new TypeError('BackblazeB2/Multipart: Got incorrect result from `listParts()`, expected an array `{ parts }`.')
      }
      result.parts.forEach((part) => {
        const i = part.PartNumber - 1
        this.chunkState[i] = {
          uploaded: part.Size,
          done: true
        }

        // Only add if we did not yet know about this part.
        if (!this.parts.some((p) => p.PartNumber === part.PartNumber)) {
          this.parts.push({
            PartNumber: part.PartNumber
          })
        }
      })
      this._uploadParts()
    }).catch((err) => {
      this._onError(err)
    })
  }

  /**
   * Queue up more chunks to be sent via _uploadPart(), and signal upload
   * completion if no incomplete chunks remain.
   */
  _uploadParts () {
    const need = this.options.limit - this.uploading.length
    if (need === 0) return

    // All parts are uploaded.
    if (this.chunkState.every((state) => state.done)) {
      this._completeUpload()
      return
    }

    const candidates = []
    for (let i = 0; i < this.chunkState.length; i++) {
      const state = this.chunkState[i]
      if (state.done || state.busy) continue

      candidates.push(i)
      if (candidates.length >= need) {
        break
      }
    }

    candidates.forEach((index) => {
      this._uploadPart(index)
    })
  }

  /**
   * Acquires an endpoint as well as the SHA1 checksum of the part, then pass
   * everything to _uploadPartBytes() for transmission.
   */
  _uploadPart (index) {
    this.chunkState[index].busy = true

    // Ensure the sha1 has been calculated for this part
    if (typeof this.chunkState[index].sha1 === 'undefined') {
      this.chunkState[index].sha1 = this._getPartSha1Sum(index)
    }

    const sha1 = this.chunkState[index].sha1
    const endpoint = this._endpointAcquire()

    return Promise.all([endpoint, sha1])
      .then(
        ([endpoint, sha1]) => this._uploadPartBytes(index, endpoint, sha1),
        (err) => this._onError(err)
      )
  }

  /**
   * Create and begin the actual XHR request for transmitting file data
   * to the Backblaze endpoint.
   */
  _uploadPartBytes (index, endpoint, sha1) {
    const body = this.chunks[index]
    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint.uploadUrl, true)
    xhr.responseType = 'json'
    xhr.setRequestHeader('Authorization', endpoint.authorizationToken)
    xhr.setRequestHeader('Content-Length', body.size)
    xhr.setRequestHeader('X-Bz-Content-Sha1', sha1)
    if (this.isMultiPart) {
      xhr.setRequestHeader('X-Bz-Part-Number', index + 1)
    } else {
      xhr.setRequestHeader('X-Bz-File-Name', encodeURIComponent(this.file.name))
      xhr.setRequestHeader('Content-Type', this.file.type || 'b2/x-auto')
    }
    this.uploading.push(xhr)

    xhr.upload.addEventListener('progress', ev => {
      if (!ev.lengthComputable) return
      this._onPartProgress(index, ev.loaded, ev.total)
    })

    xhr.addEventListener('abort', (ev) => {
      remove(this.uploading, ev.target)
      this.chunkState[index].busy = false
      this._endpointRelease(endpoint)
    })

    xhr.addEventListener('load', (ev) => {
      remove(this.uploading, ev.target)
      this.chunkState[index].busy = false

      // Grab the resulting fileId if this was a single part upload
      if (typeof this.fileId === 'undefined') {
        if (!ev.target.response || !ev.target.response.fileId) {
          this._onError(new Error('Failed to obtain fileId from upload response'))
        }
        this.fileId = ev.target.response.fileId
      }

      if (ev.target.status < 200 || ev.target.status >= 300) {
        this._onError(new Error('Non 2xx'))
        return
      }

      this._onPartProgress(index, body.size, body.size)
      this._endpointRelease(endpoint)
      this._onPartComplete(index)
    })

    xhr.addEventListener('error', (ev) => {
      remove(this.uploading, ev.target)
      this.chunkState[index].busy = false

      console.log(ev.target.response)
      const error = new Error('Unknown error')
      error.source = ev.target
      this._onError(error)
    })

    xhr.send(body)
  }

  /**
   * Calculate the sha1 checksum for the part at `index`
   */
  _getPartSha1Sum (index) {
    const body = this.chunks[index]
    return body.arrayBuffer()
      .then(buffer => sha1(buffer))
      .then(sha1sum => (this.chunkState[index].sha1 = sha1sum))
  }

  /**
   * Acquire an appropriate endpoint from the pool
   * or request a new one from Companion.
   */
  _endpointAcquire () {
    return new Promise((resolve, reject) => {
      let endpoint
      if (this.isMultiPart) {
        if (typeof this.partEndpointPool === 'undefined') {
          this.partEndpointPool = []
        }
        endpoint = this.partEndpointPool.pop()
      } else {
        endpoint = this.options.sharedEndpointPool.pop()
      }
      if (endpoint) {
        resolve(endpoint)
      } else {
        this.options.getEndpoint(this.isMultiPart && this.fileId)
          .then(endpoint => resolve(endpoint))
          .catch(err => reject(err))
      }
    })
  }

  /**
   * Release an endpoint that has not encountered any upload errors
   * back into the appropriate endpoint pool.
   */
  _endpointRelease (endpoint) {
    if (endpoint.fileId) {
      this.partEndpointPool.push(endpoint)
    } else {
      this.options.sharedEndpointPool.push(endpoint)
    }
  }

  _onPartProgress (index, sent, total) {
    this.chunkState[index].uploaded = sent

    const totalUploaded = this.chunkState.reduce((n, c) => n + c.uploaded, 0)
    this.options.onProgress(totalUploaded, this.file.size)
  }

  _onPartComplete (index) {
    this.chunkState[index].done = true
    const part = {
      PartNumber: index + 1
    }
    this.parts.push(part)
    this.options.onPartComplete(part)
    this._uploadParts()
  }

  _completeUpload () {
    // Parts may not have completed uploading in sorted order, if limit > 1.
    this.parts.sort((a, b) => a.PartNumber - b.PartNumber)

    // Build part sha1 checksum array
    const sha1Sums = Promise.all(
      this.chunkState
        .map(chunkState => chunkState.sha1)
    )

    sha1Sums.then((partSha1Array) => {
      if (this.isMultiPart) {
        return this.options.completeMultipartUpload({
          fileId: this.fileId,
          parts: this.parts,
          partSha1Array
        })
      } else {
        return {
          fileId: this.fileId,
          contentSha1: sha1Sums
        }
      }
    }).then((result) => {
      this.options.onSuccess(result)
    }, (err) => {
      this._onError(err)
    })
  }

  _abortUpload () {
    this.uploading.slice().forEach(xhr => {
      xhr.abort()
    })
    this.createdPromise.then(() => {
      if (this.isMultiPart) {
        return this.options.abortMultipartUpload({
          fileId: this.fileId
        })
      }
    }, () => {
      // if the creation failed we do not need to abort
    })
    this.uploading = []
  }

  _onError (err) {
    this.options.onError(err)
  }

  start () {
    this.isPaused = false
    if (this.isMultiPart && this.fileId) {
      this._resumeUpload()
    } else {
      this._createUpload()
    }
  }

  pause () {
    const inProgress = this.uploading.slice()
    inProgress.forEach((xhr) => {
      xhr.abort()
    })
    this.isPaused = true
  }

  abort (opts = {}) {
    const really = opts.really || false
    if (!really) {
      return this.pause()
    }
    return this._abortUpload()
  }
}

module.exports = B2Uploader
