import { Core,
         Dashboard,
         GoogleDrive,
         Webcam,
         Tus10,
         MetaData,
         Informer } from '../../../../src/index.js'
import { UPPY_SERVER } from '../env'

let uppy

function uppyInit () {
  const opts = window.uppyOptions
  const dashboardEl = document.querySelector('.UppyDashboard')
  if (dashboardEl) {
    const dashboardElParent = dashboardEl.parentNode
    dashboardElParent.removeChild(dashboardEl)
  }

  uppy = new Core({debug: true, autoProceed: opts.autoProceed})
  uppy.use(Dashboard, {
    trigger: '.UppyModalOpenerBtn',
    inline: opts.DashboardInline,
    target: opts.DashboardInline ? '.DashboardContainer' : 'body'
  })

  if (opts.GoogleDrive) {
    uppy.use(GoogleDrive, {target: Dashboard, host: UPPY_SERVER})
  }

  if (opts.Webcam) {
    uppy.use(Webcam, {target: Dashboard})
  }

  uppy.use(Tus10, {endpoint: '//tusd.tus.io/files/', resume: true})
  uppy.use(Informer, {target: Dashboard})
  uppy.use(MetaData, {
    fields: [
      { id: 'resizeTo', name: 'Resize to', value: 1200, placeholder: 'specify future image size' },
      { id: 'description', name: 'Description', value: 'none', placeholder: 'describe what the file is for' }
    ]
  })
  uppy.run()

  uppy.on('core:success', (fileCount) => {
    console.log('Yo, uploaded: ' + fileCount)
  })
}

uppyInit()
window.uppyInit = uppyInit
