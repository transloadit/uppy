const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const GoldenRetriever = require('@uppy/golden-retriever')

// Initialise two Uppy instances with the GoldenRetriever plugin,
// but with different `id`s.
const a = Uppy({
  id: 'a',
  debug: true
})
  .use(Dashboard, {
    target: '#a',
    inline: true,
    width: 400
  })
  .use(GoldenRetriever, { serviceWorker: false })

const b = Uppy({
  id: 'b',
  debug: true
})
  .use(Dashboard, {
    target: '#b',
    inline: true,
    width: 400
  })
  .use(GoldenRetriever, { serviceWorker: false })

window.a = a
window.b = b
