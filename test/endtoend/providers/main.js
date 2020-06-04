require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const GoogleDrive = require('@uppy/google-drive')
const Instagram = require('@uppy/instagram')
const Dropbox = require('@uppy/dropbox')
const Tus = require('@uppy/tus')

const isOnTravis = !!(process.env.TRAVIS && process.env.CI)
const companionUrl = isOnTravis ? 'http://companion.test:3030' : 'http://localhost:3020'

window.uppy = Uppy({
  id: 'uppyProvider',
  debug: true,
  autoProceed: true
})
  .use(Dashboard, {
    target: '#uppyDashboard',
    inline: true
  })
  .use(GoogleDrive, { target: Dashboard, companionUrl })
  .use(Instagram, { target: Dashboard, companionUrl })
  .use(Dropbox, { target: Dashboard, companionUrl })
  .use(Tus, { endpoint: 'https://master.tus.io/files/' })

if (window.location.search === '?socketerr=true') {
  const emitError = (file, data) => {
    // trigger fake socket error
    data.uploader.uploaderSockets[file.id].emit(
      'error', { error: { message: 'nobody likes me, thats ok' } })
    window.uppy.off('upload-progress', emitError)
  }
  window.uppy.on('upload-progress', emitError)
}
