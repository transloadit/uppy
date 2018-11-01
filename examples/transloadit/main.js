const transloadit = require('@uppy/transloadit-preset')

transloadit.modal('body', {
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

window.formUppy = transloadit.form('#test-form', {
  debug: true,
  restrictions: {
    allowedFileTypes: ['.png']
  },
  waitForEncoding: true,
  params: {
    auth: { key: '05a61ed019fe11e783fdbd1f56c73eb0' },
    template_id: 'be001500a56011e889f9cddd88df842c'
  }
})

const input = document.createElement('input')
input.setAttribute('type', 'file')
input.setAttribute('multiple', 'multiple')

const p = document.createElement('p')
p.append(
  document.createTextNode('An <input type=file> backed by `transloadit.upload`:'),
  input
)

input.addEventListener('change', () => {
  transloadit.upload(input.files, {
    waitForEncoding: true,
    params: {
      auth: { key: '05a61ed019fe11e783fdbd1f56c73eb0' },
      template_id: 'be001500a56011e889f9cddd88df842c'
    }
  }).then(console.log, console.error)
})

document.querySelector('main').append(p)
