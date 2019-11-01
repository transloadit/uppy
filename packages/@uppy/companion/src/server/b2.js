const request = require('request')

const B2_API_VERSION = 2
const B2_API_URL = `https://api.backblazeb2.com/b2api/v${B2_API_VERSION}/`

module.exports = class B2Client {
  constructor (options) {
    this.applicationKeyId = options.credentials.applicationKeyId
    this.applicationKey = options.credentials.applicationKey

    this.retries = 3 // TODO

    // This will be populated after a successful authorization
    this.auth = {}
  }

  getURL (method) {
    if (!this.auth.apiUrl) {
      throw new Error('getURL() called before successful authorize()')
    }
    return this.auth.apiUrl + `/b2api/v${B2_API_VERSION}/${method}`
  }

  /**
   * Request new authorization token from Backblaze.
   */
  authorize () {
    return this._authorizing || (this._authorizing = new Promise((resolve, reject) => {
      const finish = (body) => {
        this._authorizing = null
      }

      request.get(B2_API_URL + 'b2_authorize_account', {
        json: true,
        auth: {
          user: this.applicationKeyId,
          pass: this.applicationKey,
          sendImmediately: false
        }
      }, (err, res, body) => {
        if (err) {
          reject(err)
        } else {
          this.auth = body
          resolve(body)
        }
        finish()
      })
    }))
  }

  /**
   * Gets an instance of `request` with 'Authorization' headers
   * set to a (hopefully) valid authorization token.
   */
  _getPreauthorizedRequest () {
    return this._authorizedRequest || (this._authorizedRequest =
      this.authorize()
        .then((authData) => {
          // Bind authorization token to new `request`
          return request.defaults({
            headers: {
              Authorization: authData.authorizationToken
            }
          })
        })
    )
  }

  apiRequest (action, params, retries = 5) {
    return this._getPreauthorizedRequest()
      .then((request) => new Promise((resolve, reject) => {
        const url = this.getURL(action)

        // If `params` is a function, call it and use the result
        if (typeof params === 'function') {
          params = params(this.auth, this)
        }

        const requestParams = {
          json: true,
          method: 'POST',
          ...params
        }

        request(url, requestParams, (err, res, body) => {
          if (err) {
            // TODO -- check for token expirations and retry failures
            console.log('WE GOT AN ERROR', err)
            reject(err)
          } else {
            if (body && body.status && body.status !== 200) {
              console.log('encountered error', body)
            }
            resolve(body)
          }
        })
      }))
  }

  // { bucketId, fileName, contentType (optional) }
  startLargeFile (params) {
    return this.apiRequest('b2_start_large_file', {
      body: {
        contentType: 'b2/x-auto',
        ...params
      }
    })
  }

  // { bucketId, fileId, partSha1Array }
  finishLargeFile (params) {
    return this.apiRequest('b2_finish_large_file', {
      body: params
    })
  }

  // { bucketId }
  getBucketId (params) {
    return this.apiRequest('b2_list_buckets', ({ accountId }) => ({
      body: {
        accountId,
        bucketName: params.bucketName
      }
    })).then(response => {
      if (response.buckets && response.buckets.length) {
        return response.buckets[0].bucketId
      }
      throw new Error('failed to get bucketId')
    })
  }

  // { bucketName (optional), bucketTypes (optional)
  listBuckets (params) {
    return this.apiRequest('b2_list_buckets', ({ accountId }) => ({
      body: {
        accountId,
        ...params
      }
    }))
  }

  // { fileId, startPartNumber (optional), maxPartCount (optional) }
  listParts (params) {
    return this.apiRequest('b2_list_parts', {
      body: params
    })
  }

  // { fileId }
  getUploadPartURL (params) {
    return this.apiRequest('b2_get_upload_part_url', {
      body: params
    })
  }

  // { bucketId }
  getUploadURL (params) {
    return this.apiRequest('b2_get_upload_url', {
      body: params
    })
  }

  // { fileId }
  cancelLargeFile (params) {
    return this.apiRequest('b2_cancel_large_file', {
      body: params
    })
  }
}
