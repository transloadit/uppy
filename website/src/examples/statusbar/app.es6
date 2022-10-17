import Uppy from '@uppy/core'
import FileInput from '@uppy/file-input'
import StatusBar from '@uppy/status-bar'
import Tus from '@uppy/tus'

const uppyOne = new Uppy({ debug: true, autoProceed: true })
uppyOne
  .use(FileInput, { target: '.UppyInput', pretty: false })
  .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
  .use(StatusBar, {
    target: '.UppyInput-Progress',
    hideUploadButton: true,
    hideAfterFinish: false,
  })
