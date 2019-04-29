const throttle = require('lodash.throttle')

function _emitSocketProgress (uploader, progressData, file) {
  const { progress, bytesUploaded, bytesTotal } = progressData
  if (progress) {
    uploader.uppy.log(`Upload progress: ${progress}`)
    uploader.uppy.emit('upload-progress', file, {
      uploader,
      bytesUploaded: bytesUploaded,
      bytesTotal: bytesTotal
    })
  }
}

module.exports = throttle(_emitSocketProgress, 300, {
  leading: true,
  trailing: true
})
