const { inspect } = require('util')
const transloadit = require('@uppy/robodog')

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
 * transloadit.form
 */

const formUppy = transloadit.form('#test-form', {
  debug: true,
  fields: ['message'],
  restrictions: {
    allowedFileTypes: ['.png']
  },
  waitForEncoding: true,
  params: {
    auth: { key: TRANSLOADIT_KEY },
    template_id: TEMPLATE_ID
  },
  modal: true,
  progressBar: '#test-form .progress'
})

formUppy.on('error', (err) => {
  document.querySelector('#test-form .error')
    .textContent = err.message
})

formUppy.on('upload-error', (file, err) => {
  document.querySelector('#test-form .error')
    .textContent = err.message
})

window.formUppy = formUppy

const formUppyWithDashboard = transloadit.form('#dashboard-form', {
  debug: true,
  fields: ['message'],
  restrictions: {
    allowedFileTypes: ['.png']
  },
  waitForEncoding: true,
  params: {
    auth: { key: TRANSLOADIT_KEY },
    template_id: TEMPLATE_ID
  },
  dashboard: '#dashboard-form .dashboard'
})

window.formUppyWithDashboard = formUppyWithDashboard

const dashboard = transloadit.dashboard('#dashboard', {
  debug: true,
  waitForEncoding: true,
  params: {
    auth: { key: TRANSLOADIT_KEY },
    template_id: TEMPLATE_ID
  }
})

window.dashboard = dashboard

/**
 * transloadit.modal
 */

function openModal () {
  transloadit.pick({
    restrictions: {
      allowedFileTypes: ['.png']
    },
    waitForEncoding: true,
    params: {
      auth: { key: TRANSLOADIT_KEY },
      template_id: TEMPLATE_ID
    },
    providers: [
      'webcam'
    ]
    // if providers need custom config
    // webcam: {
    //   option: 'whatever'
    // }
  }).then(console.log, console.error)
}

window.openModal = openModal

/**
 * transloadit.upload
 */

window.doUpload = (event) => {
  const resultEl = document.querySelector('#upload-result')
  const errorEl = document.querySelector('#upload-error')
  transloadit.upload(event.target.files, {
    waitForEncoding: true,
    params: {
      auth: { key: TRANSLOADIT_KEY },
      template_id: TEMPLATE_ID
    }
  }).then((result) => {
    resultEl.classList.remove('hidden')
    errorEl.classList.add('hidden')
    resultEl.textContent = inspect(result.results)
  }, (err) => {
    resultEl.classList.add('hidden')
    errorEl.classList.remove('hidden')
    errorEl.textContent = err.message
  })
}
