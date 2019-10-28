const fs = require('fs')

class MockPurest {
  constructor (opts) {
    const methodsToMock = ['query', 'select', 'where', 'qs', 'auth', 'get', 'put', 'post', 'options', 'json']
    methodsToMock.forEach((item) => {
      this[item] = () => this
    })
    this.opts = opts
  }

  request (done) {
    if (typeof done === 'function') {
      const responses = {
        dropbox: {
          hash: '0a9f95a989dd4b1851f0103c31e304ce',
          user_email: 'foo@bar.com',
          email: 'foo@bar.com',
          entries: [{ rev: 'f24234cd4' }]
        },
        drive: {
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
      const body = responses[this.opts.providerName]
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
