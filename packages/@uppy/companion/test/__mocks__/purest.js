const fs = require('fs')

class MockPurest {
  constructor (opts) {
    const methodsToMock = ['query', 'select', 'where', 'qs', 'auth', 'json']
    const httpMethodsToMock = ['get', 'put', 'post', 'options', 'head']
    methodsToMock.forEach((item) => {
      this[item] = () => this
    })
    httpMethodsToMock.forEach((item) => {
      this[item] = (url) => {
        this._requestUrl = url
        return this
      }
    })
    this.opts = opts
  }

  request (done) {
    if (typeof done === 'function') {
      const responses = {
        dropbox: {
          default: {
            hash: '0a9f95a989dd4b1851f0103c31e304ce',
            user_email: 'foo@bar.com',
            email: 'foo@bar.com',
            entries: [{ rev: 'f24234cd4' }]
          }
        },
        drive: {
          'files/README.md': {
            id: '0B2x-PmqQHSKdT013TE1VVjZ3TWs',
            mimeType: 'image/jpg',
            ownedByMe: true,
            permissions: [{ role: 'owner', emailAddress: 'ife@bala.com' }],
            size: 300,
            kind: 'drive#file',
            etag: '"bcIyJ9A3gXa8oTYmz6nzAjQd-lY/eQc3WbZHkXpcItNyGKDuKXM_bNY"'
          },
          default: {
            kind: 'drive#fileList',
            etag: '"bcIyJ9A3gXa8oTYmz6nzAjQd-lY/eQc3WbZHkXpcItNyGKDuKXM_bNY"',
            files: [{
              id: '0B2x-PmqQHSKdT013TE1VVjZ3TWs',
              mimeType: 'image/jpg',
              ownedByMe: true,
              permissions: [{ role: 'owner', emailAddress: 'ife@bala.com' }]
            }],
            size: 300
          }
        }
      }
      const providerResponses = responses[this.opts.providerName]
      const body = providerResponses[this._requestUrl] || providerResponses.default
      done(null, { body, statusCode: 200 }, body)
    }

    return this
  }

  on (evt, cb) {
    if (evt === 'response') {
      cb(fs.createReadStream('./README.md'))
    }
    return this
  }
}

module.exports = () => {
  return (options) => new MockPurest(options)
}
