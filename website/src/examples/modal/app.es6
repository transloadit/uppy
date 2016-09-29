import { Core,
         Dashboard,
         GoogleDrive,
         Webcam,
         Tus10,
         MetaData,
         Informer } from '../../../../src/index.js'

import { UPPY_SERVER } from '../env'

const uppy = new Core({debug: true, autoProceed: false})
uppy
  .use(Dashboard, {trigger: '#uppyModalOpener'})
  .use(GoogleDrive, {target: Dashboard, host: UPPY_SERVER})
  .use(Webcam, {target: Dashboard})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/', resume: true})
  .use(Informer, {target: Dashboard})
  .use(MetaData, {
    fields: [
      { id: 'resizeTo', name: 'Resize to', value: 1200, placeholder: 'specify future image size' },
      { id: 'description', name: 'Description', value: 'none', placeholder: 'describe what the file is for' }
    ]
  })

uppy.run()

uppy.on('core:success', (fileCount) => {
  console.log('Yo, uploaded: ' + fileCount)
})
