import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import RemoteSources from '@uppy/remote-sources'
import Webcam from '@uppy/webcam'
import ScreenCapture from '@uppy/screen-capture'
import GoldenRetriever from '@uppy/golden-retriever'
import ImageEditor from '@uppy/image-editor'
import DropTarget from '@uppy/drop-target'
import Audio from '@uppy/audio'
import Compressor from '@uppy/compressor'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const COMPANION_URL = 'http://companion.uppy.io'

const uppy = new Uppy()
  .use(Dashboard, { target: '#app', inline: true })
  .use(RemoteSources, { companionUrl: COMPANION_URL })
  .use(Webcam, {
    target: Dashboard,
    showVideoSourceDropdown: true,
    showRecordingLength: true,
  })
  .use(Audio, {
    target: Dashboard,
    showRecordingLength: true,
  })
  .use(ScreenCapture, { target: Dashboard })
  .use(ImageEditor, { target: Dashboard })
  .use(DropTarget, { target: document.body })
  .use(Compressor)
  .use(GoldenRetriever, { serviceWorker: true })

// Keep this here to access uppy in tests
window.uppy = uppy
