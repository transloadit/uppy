import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Tus from '@uppy/tus'

Uppy({ autoProceed: false })
  .use(Dashboard, { trigger: '#select-files' })
  .use(Tus, { endpoint: 'https://master.tus.io/files/' })
  .on('complete', (result) => {
    console.log('Upload result:', result)
  })
