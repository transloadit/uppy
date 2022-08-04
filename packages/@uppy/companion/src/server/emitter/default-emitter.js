const { EventEmitter } = require('node:events')

module.exports = () => {
  return new EventEmitter()
}
