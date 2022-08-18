import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import GoldenRetriever from '@uppy/golden-retriever'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

// Initialise two Uppy instances with the GoldenRetriever plugin,
// but with different `id`s.
const a = new Uppy({
  id: 'a',
  debug: true,
})
  .use(Dashboard, {
    target: '#a',
    inline: true,
    width: 400,
  })
  .use(GoldenRetriever, { serviceWorker: false })

const b = new Uppy({
  id: 'b',
  debug: true,
})
  .use(Dashboard, {
    target: '#b',
    inline: true,
    width: 400,
  })
  .use(GoldenRetriever, { serviceWorker: false })

window.a = a
window.b = b
