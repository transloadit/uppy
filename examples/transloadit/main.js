const transloadit = require('@uppy/transloadit-preset')

/**
 * transloadit.form
 */

const formUppy = transloadit.form('#test-form', {
  debug: true,
  restrictions: {
    allowedFileTypes: ['.png']
  },
  waitForEncoding: true,
  params: {
    auth: { key: '05a61ed019fe11e783fdbd1f56c73eb0' },
    template_id: 'be001500a56011e889f9cddd88df842c'
  },
  dashboard: '#test-form .dashboard',
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
      auth: { key: '05a61ed019fe11e783fdbd1f56c73eb0' },
      template_id: 'be001500a56011e889f9cddd88df842c'
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
  transloadit.upload(event.target.files, {
    waitForEncoding: true,
    params: {
      auth: { key: '05a61ed019fe11e783fdbd1f56c73eb0' },
      template_id: 'be001500a56011e889f9cddd88df842c'
    }
  }).then(console.log, console.error)
}
