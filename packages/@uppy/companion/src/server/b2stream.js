const Writable = require('stream').Writable
const crypto = require('crypto')
const fdSlicer = require('fd-slicer')
const fs = require('fs')

const MAX_UPLOAD_PARTS = 10000

function accumulator (start) {
  let accum = start || 0
  return (add = 0) => {
    accum += add
    return accum
  }
}

function callWithRetry (fn, args = [], retriesLeft = 5) {
  return fn(...args)
    .catch((err) => {
      if (retriesLeft > 0) {
        return callWithRetry(fn, args, retriesLeft - 1)
      }
      return Promise.reject(err)
    })
}

module.exports = class B2Stream {
  // bucketName
  // path
  // fileName
  // fileSize
  // stream
  // client
  // endpointPool
  constructor (client, options) {
    this.options = options
    this.client = client
    this.onUploadProgress = ({ total, loaded }) => {
      console.log('progress', loaded / total)
    }
  }

  getOptimalPartSize (fileSize) {
    return this.client.preauth()
      .then(({ recommendedPartSize }) => {
        return Math.min(
          Math.max(recommendedPartSize, Math.ceil(fileSize / MAX_UPLOAD_PARTS)),
          fileSize
        )
      })
  }

  getBucketId (bucketName) {
    return this.client.getCachedBucket(bucketName)
      .then(({ bucketId }) => bucketId)
  }

  send (cb) {
    return Promise.all([
      this.getOptimalPartSize(this.options.fileSize),
      this.getBucketId(this.options.bucketName)
    ]).then(([partSize, bucketId]) => {
      const fileSize = this.options.fileSize
      const onUploadProgress = this.createProgressReporter(fileSize)
      const isMultipart = (partSize < fileSize)
      if (isMultipart) {
        return this._sendMultipart(partSize, bucketId, onUploadProgress)
      } else {
        return this._sendSingle(partSize, bucketId, onUploadProgress)
      }
    })
      .catch((err) => {
        cb(err)
      })
      .then((result) => cb(null, result))
  }

  createProgressReporter (total) {
    const sent = accumulator(0)
    return {
      send: (bytes) => {
        this.onUploadProgress({
          loaded: sent(bytes),
          total
        })
      }
    }
  }

  _sendSingle (partSize, bucketId, progressReporter) {
    const sendSinglePart = () => {
      const { fileName, fileSize, stream, path, endpointPool } = this.options
      const { client } = this
      const chunks = []
      let fileId
      let data
      const writerOptions = {
        fileId: null,
        fileName,
        fileSize,
        client,
        endpointPool,
        partSize,
        path,
        progressReporter,
        handleSent: (chunk, response) => {
          chunks[chunk.id] = { hash: chunk.hash }
          data = response
          fileId = response.fileId
        }
      }

      return new Promise((resolve, reject) => {
        try {
          const writer = B2StreamWriter(writerOptions)
          stream.pipe(writer)
          writer.on('finish', () => {
            resolve({ chunks, fileId, data })
          })
        } catch (err) {
          reject(err)
        }
      })
    }

    return callWithRetry(sendSinglePart)
  }

  _sendMultipart (partSize, bucketId, progressReporter) {
    const sendMultipartStartLargeFile = () => {
      const { fileName } = this.options
      return this.client.startLargeFile({ bucketId, fileName })
        .then(({ data }) => data)
    }

    const sendMultipartUploadParts = (startLargeFileResponse) => {
      const { fileName, fileSize, stream, path, endpointPool } = this.options
      const { client } = this
      const { fileId } = startLargeFileResponse
      const chunks = []
      const writerOptions = {
        fileId,
        fileName,
        fileSize,
        client,
        endpointPool,
        partSize,
        path,
        progressReporter,
        handleSent: (chunk, response) => {
          chunks[chunk.id] = { hash: chunk.hash }
        }
      }

      return new Promise((resolve, reject) => {
        try {
          const writer = B2StreamWriter(writerOptions)
          stream.pipe(writer)
          writer.on('finish', () => {
            resolve({ chunks, fileId })
          })
        } catch (err) {
          reject(err)
        }
      })
    }

    const sendMultipartFinishLargeFile = (uploadStartResult, uploadPartsResult) => {
      const { chunks, fileId } = uploadPartsResult
      const partSha1Array = chunks.map(({ hash }) => hash)
      return this.client.finishLargeFile({ fileId, partSha1Array })
        .then(({ data }) => ({
          chunks,
          data,
          fileId
        }))
    }

    return callWithRetry(sendMultipartStartLargeFile)
      .then((startResult) => sendMultipartUploadParts(startResult)
        .then((partsResult) => callWithRetry(sendMultipartFinishLargeFile, [startResult, partsResult]))
      )
      .catch((err) => {
        throw err
      })
  }
}

function createSlicerFromPath (path) {
  return new Promise((resolve, reject) => {
    fs.open(path, 'r', (err, fd) => {
      if (err) {
        reject(err)
      }
      const slicer = fdSlicer.createFromFd(fd)
      resolve({ slicer, fd })
    })
  })
}

function createStreamHashSHA1 (slicer, start, end) {
  const hasher = crypto.createHash('sha1')
  hasher.setEncoding('hex')

  return new Promise((resolve, reject) => {
    slicer.createReadStream({ start, end })
      .on('end', () => {
        hasher.end()
        const hash = hasher.read()
        resolve(hash)
      })
      .pipe(hasher)
  })
}

function closeFileDescriptorAsync (fd) {
  return new Promise((resolve, reject) => {
    fs.close(fd, (err) => {
      if (err) {
        reject(err)
        return
      }
      resolve(fd)
    })
  })
}

function B2StreamWriter (options) {
  const { fileName, fileSize, partSize, path, endpointPool, fileId, client, progressReporter } = options
  const { connections = 3 } = options
  const isMultipart = !!fileId // fileId is present when first obtained via startLargeFile()
  const fdSlicer = createSlicerFromPath(path)
  const workers = []
  const queue = []

  let bytesRead = 0 // total bytes received
  let partAccum = 0 // total bytes in the current part which have been processed
  let partCount = 0 // number of emitted parts

  const pendingWriteDrain = () => {
    // If we have pending onwrite()s queued and we're under the maximum number
    // of transmit workers...
    if (queue.length && workers.length < connections) {
      const cb = queue.shift()
      cb() // signal that we're ready for more data
    }
  }

  const pendingWriteHandler = (onwrite) => {
    queue.push(onwrite)
    pendingWriteDrain()
  }

  const emitPart = (writableStream) => {
    // start and end correspond to the partAccum length section of bytes at the
    // tail of the read stream.
    const start = bytesRead - partAccum
    const end = bytesRead
    const id = partCount++
    const contentLength = end - start
    partAccum = 0

    // Create a stream slice of this part's range and run it through hasher.
    const partHashResult = () =>
      fdSlicer.then(({ slicer }) => {
        return createStreamHashSHA1(slicer, start, end)
      })

    // Attempt transmitting the stream data for this part to the
    // appropriate B2 endpoint.
    const attemptPartTransmission = (hash, slicer) => {
      return endpointPool.acquire(fileId)
        .then((endpoint) => {
          const { authorizationToken, uploadUrl } = endpoint
          const partStream = slicer.createReadStream({ start, end })
          let transmit = null
          if (isMultipart) {
            transmit = client.uploadPart({
              uploadUrl,
              uploadAuthToken: authorizationToken,
              data: partStream,
              hash,
              contentLength,
              partNumber: id + 1 // b2 part numbers start a 1
            })
          } else {
            transmit = client.uploadFile({
              uploadUrl,
              uploadAuthToken: authorizationToken,
              fileName,
              data: partStream,
              hash,
              contentLength
            })
          }
          // only release endpoint back to the pool if it was last used
          // successfully.
          transmit.then(() => endpointPool.release(endpoint))
          transmit.catch(() => { partStream.destroy() })
          return transmit
        })
    }

    const transmit = Promise.all([
      partHashResult(),
      fdSlicer
    ]).then(([hash, { slicer }]) =>
      callWithRetry(attemptPartTransmission, [hash, slicer])
        .then(({ data }) => {
          if (options.handleSent) {
            options.handleSent({ id, hash }, data)
          }
          return data
        })
    ).then((data) => {
      // After a successful transmission, remove this
      // part transmission promise from the worker array
      const index = workers.indexOf(transmit)
      workers.splice(index, 1)

      // Keep the stream moving
      pendingWriteDrain()
      return data
    })

    // Push this transmission promise into the pending worker queue
    workers.push(transmit)
    return transmit
  }

  let handledCounter = 0

  return new Writable({
    write: function (chunk, _, cb) {
      const chunkLength = chunk.length
      let remaining = chunkLength
      while (remaining > 0) {
        const maxRead = Math.min(remaining, partSize - partAccum)
        remaining -= maxRead
        partAccum += maxRead
        bytesRead += maxRead
        // If we've received an entire part worth of data, then
        // we will emit a new transmit job
        if (partAccum === partSize) {
          emitPart(this)
        }
      }

      // handle the callback (now or later)
      pendingWriteHandler(() => {
        progressReporter.send(chunkLength)
        handledCounter += chunkLength
        cb()
        // Sometimes when the file is very small, the read stream end event
        // must occur before the pipe begins? This ensures we wrap up once
        // we've processed all the bytes we've been expecting.
        if (handledCounter === fileSize) {
          this.end()
        }
      })
    },
    final: function (cb) {
      if (partAccum > 0) {
        emitPart(this)
      }
      // Wait on all workers to finish
      Promise.all(workers)
        .then(() => fdSlicer.then(({ fd }) => fd))
        .then((fd) => closeFileDescriptorAsync(fd))
        .then((fd) => {
          cb()
        })
    }
  })
}
