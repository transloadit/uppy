import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Form from '@uppy/form'
import ImageEditor from '@uppy/image-editor'
import RemoteSources from '@uppy/remote-sources'
import Transloadit, { COMPANION_URL } from '@uppy/transloadit'
import Webcam from '@uppy/webcam'

import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'
import '@uppy/image-editor/css/style.css'

const TRANSLOADIT_KEY = '35c1aed03f5011e982b6afe82599b6a0'
// A trivial template that resizes images, just for example purposes.
//
// "steps": {
//   ":original": { "robot": "/upload/handle" },
//   "resize": {
//     "use": ":original",
//     "robot": "/image/resize",
//     "width": 100,
//     "height": 100,
//     "imagemagick_stack": "v1.0.0"
//   }
// }
const TEMPLATE_ID = 'bbc273f69e0c4694a5a9d1b587abc1bc'

/**
 * Form
 */

const formUppy = new Uppy({
  debug: true,
  autoProceed: true,
  restrictions: {
    allowedFileTypes: ['.png'],
  },
})
  .use(Dashboard, {
    trigger: '#uppy-select-files',
    closeAfterFinish: true,
    note: 'Only PNG files please!',
  })
  .use(RemoteSources, { companionUrl: COMPANION_URL })
  .use(Form, {
    target: '#test-form',
    fields: ['message'],
    // submitOnSuccess: true,
    addResultToForm: true,
  })
  .use(Transloadit, {
    waitForEncoding: true,
    params: {
      auth: { key: TRANSLOADIT_KEY },
      template_id: TEMPLATE_ID,
    },
  })

formUppy.on('error', (err) => {
  document.querySelector('#test-form .error').textContent = err.message
})

formUppy.on('upload-error', (file, err) => {
  document.querySelector('#test-form .error').textContent = err.message
})

formUppy.on('complete', ({ transloadit }) => {
  const btn = document.getElementById('uppy-select-files')
  btn.hidden = true
  const selectedFiles = document.getElementById('uppy-form-selected-files')
  selectedFiles.textContent = `selected files: ${Object.keys(transloadit[0].results).length}`
})

window.formUppy = formUppy

/**
 * Form with Dashboard
 */

const formUppyWithDashboard = new Uppy({
  debug: true,
  autoProceed: false,
  restrictions: {
    allowedFileTypes: ['.png'],
  },
})
  .use(Dashboard, {
    inline: true,
    target: '#dashboard-form .dashboard',
    note: 'Only PNG files please!',
    hideUploadButton: true,
  })
  .use(RemoteSources, { companionUrl: COMPANION_URL })
  .use(Form, {
    target: '#dashboard-form',
    fields: ['message'],
    triggerUploadOnSubmit: true,
    submitOnSuccess: true,
    addResultToForm: true,
  })
  .use(Transloadit, {
    waitForEncoding: true,
    params: {
      auth: { key: TRANSLOADIT_KEY },
      template_id: TEMPLATE_ID,
    },
  })

window.formUppyWithDashboard = formUppyWithDashboard

/**
 * Dashboard
 */

const dashboard = new Uppy({
  debug: true,
  autoProceed: false,
  restrictions: {
    allowedFileTypes: ['.png'],
  },
})
  .use(Dashboard, {
    inline: true,
    target: '#dashboard',
    note: 'Only PNG files please!',
  })
  .use(RemoteSources, { companionUrl: COMPANION_URL })
  .use(Webcam, { target: Dashboard })
  .use(ImageEditor, { target: Dashboard })
  .use(Transloadit, {
    waitForEncoding: true,
    params: {
      auth: { key: TRANSLOADIT_KEY },
      template_id: TEMPLATE_ID,
    },
  })

window.dashboard = dashboard

// /**
//  * Dashboard Modal
//  */

const dashboardModal = new Uppy({
  debug: true,
  autoProceed: false,
})
  .use(Dashboard, { closeAfterFinish: true })
  .use(RemoteSources, { companionUrl: COMPANION_URL })
  .use(Webcam, { target: Dashboard })
  .use(ImageEditor, { target: Dashboard })
  .use(Transloadit, {
    waitForEncoding: true,
    params: {
      auth: { key: TRANSLOADIT_KEY },
      template_id: TEMPLATE_ID,
    },
  })

dashboardModal.on('complete', ({ transloadit, successful, failed }) => {
  if (failed?.length !== 0) {
    console.error('it failed', failed)
  } else {
    console.log('success', { transloadit, successful })
  }
})

function openModal() {
  dashboardModal.getPlugin('Dashboard').openModal()
}

window.openModal = openModal

// /**
//  * uppy.upload (files come from input[type=file])
//  */

const uppyWithoutUI = new Uppy({
  debug: true,
  restrictions: {
    allowedFileTypes: ['.png'],
  },
}).use(Transloadit, {
  waitForEncoding: true,
  params: {
    auth: { key: TRANSLOADIT_KEY },
    template_id: TEMPLATE_ID,
  },
})

window.doUpload = (event) => {
  const resultEl = document.querySelector('#upload-result')
  const errorEl = document.querySelector('#upload-error')

  uppyWithoutUI.addFiles(event.target.files)
  uppyWithoutUI.upload()

  uppyWithoutUI.on('complete', ({ transloadit }) => {
    resultEl.classList.remove('hidden')
    errorEl.classList.add('hidden')
    resultEl.textContent = JSON.stringify(transloadit[0].results, null, 2)

    const resizedUrl = transloadit[0].results.resize[0].ssl_url
    const img = document.createElement('img')
    img.src = resizedUrl
    document.getElementById('upload-result-image').appendChild(img)
  })

  uppyWithoutUI.on('error', (err) => {
    resultEl.classList.add('hidden')
    errorEl.classList.remove('hidden')
    errorEl.textContent = err.message
  })
}
