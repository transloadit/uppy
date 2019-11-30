const B2 = require('backblaze-b2')
const ms = require('ms')
const B2Stream = require('./b2stream')

function createBucketCache (client, cacheDuration = ms('30m')) {
  const cache = Object.create(null)
  return (bucketName) => {
    const match = cache[bucketName]
    if (match && match.expiration < Date.now()) {
      return match.result
    } else {
      cache[bucketName] = {
        result: client.getBucket({ bucketName }),
        expiration: Date.now() + cacheDuration
      }
      return cache[bucketName].result
    }
  }
}

function createEndpointPool (client, bucketName) {
  const pools = {
    default: []
  }

  const acquire = (fileId = undefined) => {
    if (fileId) { // specific fileId indicates large file / multipart
      const pool = (pools[fileId] = pools[fileId] || [])
      if (pool.length) {
        return Promise.resolve(pool.shift())
      } else {
        return client.getUploadPartUrl({ fileId })
          .then(({ data }) => data)
      }
    } else {
      const pool = pools.default
      if (pool.length) {
        return Promise.resolve(pool.shift())
      } else {
        return client.getCachedBucket(bucketName)
          .then(({ bucketId }) => client.getUploadUrl({ bucketId }))
          .then(({ data }) => data)
      }
    }
  }

  const release = (endpoint) => {
    // fileId indicates large file / multipart
    const { fileId } = endpoint
    if (fileId) {
      const pool = (pools[fileId] = pools[fileId] || [])
      pool.push(endpoint)
    } else {
      pools.default.push(endpoint)
    }
  }

  const finish = (fileId) => {
    delete pools[fileId]
  }

  return {
    acquire,
    release,
    finish
  }
}

module.exports = class B2Client {
  constructor (options) {
    this.b2 = new B2({
      applicationKeyId: options.keyId,
      applicationKey: options.key,
      axios: options.axios || {},
      retry: options.retry
    })

    this._bucketCache = createBucketCache(this)

    // This will be populated after each successful authorization.
    this.lastAuthResponseData = {}
  }

  preauth (failedToken) {
    if (this._auth) {
      if (failedToken) {
        return this._auth.then(auth => {
          // ONLY if the current promise resolves to the
          // token which we know to be invalid, delete
          // the _auth promise and recreate it be re-calling
          // preauth()
          if (auth.authorizationToken === failedToken) {
            delete this._auth
          }
          return this.preauth()
        })
      }
    } else {
      this._auth = this.b2.authorize()
        .then(auth => {
          this.lastAuthResponseData = auth.data
          return auth.data
        }).catch(err => {
          console.log('Error attempting to authorize with B2:' + err)
          delete this._auth
          return this.preauth()
        })
    }
    return this._auth
  }

  request (actualRequest, invalidToken) {
    return this.preauth(invalidToken)
      .then(auth => actualRequest()
        .catch(err => {
          if (err.response && err.response.status === 401) {
            // Retry and pass the invalid token forward.
            return this.request(actualRequest, auth.authorizationToken)
          }
          throw err
        })
      )
  }

  // { bucketId, fileName, contentType (optional) }
  startLargeFile (params) {
    return this.request(() => this.b2.startLargeFile(params))
  }

  // { bucketId, fileId, partSha1Array }
  finishLargeFile (params) {
    return this.request(() => this.b2.finishLargeFile(params))
  }

  // { bucketName, bucketId }
  getBucket (params) {
    return this.request(() => this.b2.getBucket(params))
      .then(res => {
        const buckets = res.data.buckets
        if (buckets && buckets.length) {
          return buckets[0]
        }
        throw new Error('Unable to find bucket (' + JSON.stringify(params) + ')')
      })
  }

  getCachedBucket (params) {
    return this._bucketCache(params)
  }

  listParts (params) {
    return this.request(() => this.b2.listParts(params))
  }

  getUploadPartUrl (params) {
    return this.request(() => this.b2.getUploadPartUrl(params))
  }

  getUploadUrl (params) {
    return this.request(() => this.b2.getUploadUrl(params))
  }

  cancelLargeFile (params) {
    return this.request(() => this.b2.cancelLargeFile(params))
  }

  uploadFile (params) {
    return this.request(() => this.b2.uploadFile(params))
  }

  uploadPart (params) {
    return this.request(() => this.b2.uploadPart(params))
  }

  // The following methods are used by Companion server <-> server transfers
  upload (options) {
    return new B2Stream(this, options)
  }

  createEndpointPool (bucketName) {
    return createEndpointPool(this, bucketName)
  }
}
