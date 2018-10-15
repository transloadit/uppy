const Dashboard = require('@uppy/dashboard')
const createUppy = require('./createUppy')
const addTransloaditPlugin = require('./addTransloaditPlugin')
const addProviders = require('./addProviders')

const CANCEL = {}

function modal (target, opts = {}) {
  const pluginId = 'modal'
  const uppy = createUppy(opts, {
    allowMultipleUploads: false
  })
  addTransloaditPlugin(uppy, opts)
  uppy.use(Dashboard, {
    id: pluginId,
    target,
    closeAfterFinish: true
  })

  window.u = uppy

  if (Array.isArray(opts.providers)) {
    addProviders(uppy, opts.providers, {
      ...opts,
      // Install providers into the Dashboard.
      target: uppy.getPlugin(pluginId)
    })
  }

  return new Promise((resolve, reject) => {
    uppy.on('complete', (result) => {
      if (result.failed.length === 0) {
        resolve(result)
      }
    })
    uppy.on('error', reject)
    uppy.on('cancel-all', () => reject(CANCEL))
    uppy.getPlugin(pluginId)
      .openModal()
  }).then((result) => {
    return result
  }, (err) => {
    if (err === CANCEL) {
      uppy.getPlugin(pluginId)
        .requestCloseModal()
      return null
    }
    throw err
  })
}

module.exports = modal
