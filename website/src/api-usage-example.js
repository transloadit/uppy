import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Instagram from '@uppy/instagram'
import Tus from '@uppy/tus'

Uppy()
  .use(Dashboard, {
    trigger: '#select-files',
    showProgressDetails: true
  })
  .use(Instagram, {
    target: Dashboard,
    serverUrl: 'https://companion.uppy.io'
  })
  .use(Tus, { endpoint: 'https://master.tus.io/files/' })
  .on('complete', (result) => {
    console.log('Upload result:', result)
  })
