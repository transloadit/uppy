const Uppy = require('@uppy/core')
const addTransloaditPlugin = require('./addTransloaditPlugin')

function upload (files, opts) {
  const uppy = Uppy({})

  addTransloaditPlugin(uppy, opts)

  files.forEach((file) => {
    uppy.addFile({
      data: file,
      type: file.type,
      name: file.name
    })
  })

  return uppy.upload()
}

module.exports = upload
