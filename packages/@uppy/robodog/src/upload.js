const toArray = require('@uppy/utils/lib/toArray')
const createUppy = require('./createUppy')
const addTransloaditPlugin = require('./addTransloaditPlugin')

function upload (files, opts = {}) {
  if (!Array.isArray(files) && typeof files.length === 'number') {
    files = toArray(files)
  }

  const uppy = createUppy(opts, {
    allowMultipleUploads: false
  })

  addTransloaditPlugin(uppy, opts)

  files.forEach((file) => {
    try {
      uppy.addFile({
        data: file,
        type: file.type,
        name: file.name,
        meta: file.meta || {}
      })
    } catch (err) {
      if (!err.isRestriction) {
        uppy.log(err)
      }
    }
  })

  return uppy.upload()
}

module.exports = upload
