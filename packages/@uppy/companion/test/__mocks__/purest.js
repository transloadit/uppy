const fs = require('fs')
const qs = require('querystring')

const fixtures = require('../fixtures').providers

function has (object, property) {
  return Object.prototype.hasOwnProperty.call(object, property)
}

class MockPurest {
  constructor (opts) {
    const methodsToMock = ['query', 'select', 'where', 'auth', 'json']
    const httpMethodsToMock = ['get', 'put', 'post', 'head', 'delete']
    methodsToMock.forEach((item) => {
      this[item] = () => this
    })
    httpMethodsToMock.forEach((item) => {
      this[item] = (url) => {
        this._requestUrl = url
        this._method = item
        return this
      }
    })
    this.opts = opts
  }

  qs (data) {
    this._query = qs.stringify(data)
    return this
  }

  options (reqOpts) {
    this._requestOptions = reqOpts
    return this
  }

  _getStatusCode () {
    const { validators } = fixtures[this.opts.providerName]
    if (validators && validators[this._requestUrl]) {
      return validators[this._requestUrl](this._requestOptions) ? 200 : 400
    }
    return 200
  }

  request (done) {
    if (typeof done === 'function') {
      const { responses } = fixtures[this.opts.providerName]
      const url = this._query ? `${this._requestUrl}?${this._query}` : this._requestUrl
      const endpointResponses = responses[url] || responses[this._requestUrl]
      if (endpointResponses == null || !has(endpointResponses, this._method)) {
        done(new Error(`No fixture for ${this._method} ${url}`))
        return this
      }

      const statusCode = this._getStatusCode()

      const body = statusCode === 200 ? endpointResponses[this._method] : {}
      done(null, { body, statusCode }, body)
    }

    return this
  }

  on (evt, cb) {
    if (evt === 'response') {
      const stream = fs.createReadStream('./README.md')
      stream.statusCode = this._getStatusCode()
      cb(stream)
    }
    return this
  }
}

module.exports = () => {
  return (options) => new MockPurest(options)
}
