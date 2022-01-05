import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Url from '@uppy/url'
import Tus from '@uppy/tus'

const companionUrl = 'http://localhost:3030'
const endpoint = 'http://localhost:1080'

window.uppy = new Uppy({
  id: 'uppyProvider',
  debug: true,
})
  .use(Dashboard, {
    target: '#uppyDashboard',
    inline: true,
  })
  .use(Url, {
    target: Dashboard,
    companionUrl,
  })
  .use(Tus, { endpoint: `${endpoint}/files/` })
