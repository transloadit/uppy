const Uppy = require('../src/index.js')

const uppy = new Uppy.Core({debug: true})
  .use(Uppy.plugins.Modal, {trigger: '#uppyModalOpener'})
  .use(Uppy.plugins.Dashboard, {target: Uppy.plugins.Modal})
  .use(Uppy.plugins.Dummy, {target: Uppy.plugins.Modal})

uppy.run()
