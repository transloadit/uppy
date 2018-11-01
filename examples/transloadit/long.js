const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const Transloadit = require('@uppy/transloadit')
const Webcam = require('@uppy/Webcam')

const uppy = Uppy({
  allowMultipleUploads: false,
  restrictions: {
    allowedFileTypes: ['.png']
  }
})

uppy.use(Dashboard, {
  target: 'body',
  closeAfterFinish: true
})

uppy.use(Webcam, {
  target: Dashboard
})

uppy.use(Transloadit, {
  waitForEncoding: true,
  params: {
    auth: { key: '05a61ed019fe11e783fdbd1f56c73eb0' },
    template_id: 'be001500a56011e889f9cddd88df842c'
  }
})

const result = new Promise((resolve, reject) => {
  uppy.on('error', reject)
  uppy.on('complete', resolve)
})

result.then(console.log)
