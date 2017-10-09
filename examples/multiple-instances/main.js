const Uppy = require('uppy/lib/core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const GoldenRetriever = require('uppy/lib/plugins/GoldenRetriever')

// Initialise two Uppy instances with the GoldenRetriever plugin,
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
  .use(GoldenRetriever, { serviceWorker: false })
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
  .use(GoldenRetriever, { serviceWorker: false })
  .run()

window.a = a
window.b = b
