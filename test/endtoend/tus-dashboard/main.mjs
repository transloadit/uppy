import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Tus from '@uppy/tus'

const endpoint = 'http://localhost:1080'

const uppyDashboard = new Uppy({
  id: 'uppyDashboard',
  debug: true,
})

uppyDashboard
  .use(Dashboard, {
    target: '#uppyDashboard',
    inline: true,
  })
  .use(Tus, { endpoint: `${endpoint}/files/` })
