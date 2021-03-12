'use strict'

/**
 * Manages communications with Companion
 */

const RequestClient = require('./RequestClient')
const Provider = require('./Provider')
const SearchProvider = require('./SearchProvider')
const Socket = require('./Socket')

module.exports = {
  RequestClient,
  Provider,
  SearchProvider,
  Socket
}
