import emitter from '../src/server/emitter/index.js'

export const connect = (uploadToken) => {
  emitter().emit(`connection:${uploadToken}`)
}

export const onProgress = (uploadToken, cb) => {
  emitter().on(uploadToken, (message) => {
    if (message.action === 'progress') {
      cb(message)
    }
  })
}

export const onUploadSuccess = (uploadToken, cb) => {
  emitter().on(uploadToken, (message) => {
    if (message.action === 'success') {
      cb(message)
    }
  })
}

export const onUploadError = (uploadToken, cb) => {
  emitter().on(uploadToken, (message) => {
    if (message.action === 'error') {
      cb(message)
    }
  })
}
