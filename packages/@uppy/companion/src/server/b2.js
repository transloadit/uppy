const B2 = require('backblaze-b2')

module.exports = class B2Client {
  constructor (options) {
    this.b2 = new B2({
      applicationKeyId: options.credentials.keyId,
      applicationKey: options.credentials.key
    })

    // This will be populated after each successful authorization.
    this.lastAuthResponse = {}
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
}
