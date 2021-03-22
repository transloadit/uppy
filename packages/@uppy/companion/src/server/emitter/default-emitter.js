const { EventEmitter } = require('events')

module.exports = () => {
  return new EventEmitter()
}
