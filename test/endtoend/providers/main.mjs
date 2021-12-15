import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import GoogleDrive from '@uppy/google-drive'
import Instagram from '@uppy/instagram'
import Dropbox from '@uppy/dropbox'
import Box from '@uppy/box'
import Tus from '@uppy/tus'

const companionUrl = 'http://localhost:3020'

window.uppy = new Uppy({
  id: 'uppyProvider',
  debug: true,
  autoProceed: true,
})
  .use(Dashboard, {
    target: '#uppyDashboard',
    inline: true,
  })
  .use(GoogleDrive, { target: Dashboard, companionUrl })
  .use(Instagram, { target: Dashboard, companionUrl })
  .use(Dropbox, { target: Dashboard, companionUrl })
  .use(Box, { target: Dashboard, companionUrl })
  .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })

if (window.location.search === '?socketerr=true') {
  const emitError = (file, data) => {
    // trigger fake socket error
    data.uploader.uploaderSockets[file.id].emit(
      'error', { error: { message: 'nobody likes me, thats ok' } },
    )
    window.uppy.off('upload-progress', emitError)
  }
  window.uppy.on('upload-progress', emitError)
}
