const emitter = require('../src/server/emitter')

module.exports.connect = (uploadToken) => {
  emitter().emit(`connection:${uploadToken}`)
}

module.exports.onProgress = (uploadToken, cb) => {
  emitter().on(uploadToken, (message) => {
    if (message.action === 'progress') {
      cb(message)
    }
  })
}

module.exports.onUploadSuccess = (uploadToken, cb) => {
  emitter().on(uploadToken, (message) => {
    if (message.action === 'success') {
      cb(message)
    }
  })
}

module.exports.onUploadError = (uploadToken, cb) => {
  emitter().on(uploadToken, (message) => {
    if (message.action === 'error') {
      cb(message)
    }
  })
}
