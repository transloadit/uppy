const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const addTransloaditPlugin = require('./addTransloaditPlugin')

function modal (target, opts) {
  const uppy = Uppy({
    allowMultipleUploads: false
  })
  addTransloaditPlugin(uppy, opts)
  uppy.use(Dashboard, {
    target,
    autoClose: true
  })

  return new Promise((resolve, reject) => {
    uppy.on('complete', resolve)
    uppy.getPlugin('Dashboard').openModal()
  }).then((result) => {
    return uppy.getPlugin('Dashboard').closeModal()
      .then(() => result)
  })
}

module.exports = modal
