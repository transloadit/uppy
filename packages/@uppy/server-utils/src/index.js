'use-strict'
/**
 * Manages communications with Uppy Server
 */

const RequestClient = require('./RequestClient')
const Provider = require('./Provider')
const Socket = require('./Socket')

module.exports = {
  RequestClient,
  Provider,
  Socket
}
