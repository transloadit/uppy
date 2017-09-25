const Uppy = require('uppy/lib/core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const RestoreFiles = require('uppy/lib/plugins/RestoreFiles')

// Initialise two Uppy instances with the RestoreFiles plugin,
// but with different `id`s.
const a = Uppy({
  id: 'a',
  debug: true
})
  .use(Dashboard, {
    target: '#a',
    inline: true,
    maxWidth: 400
  })
  .use(RestoreFiles, { serviceWorker: false })
  .run()

const b = Uppy({
  id: 'b',
  debug: true
})
  .use(Dashboard, {
    target: '#b',
    inline: true,
    maxWidth: 400
  })
  .use(RestoreFiles, { serviceWorker: false })
  .run()

window.a = a
window.b = b
