const EventEmitter = require('events').EventEmitter

module.exports = () => {
  return new EventEmitter()
}
