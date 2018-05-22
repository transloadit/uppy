const Uppy = require('uppy/lib/core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const AwsS3 = require('uppy/lib/plugins/AwsS3')

const uppy = Uppy({
  debug: true,
  autoProceed: false
})

uppy.use(Dashboard, {
  inline: true,
  target: 'body'
})

// No client side changes needed!
uppy.use(AwsS3, { host: '/uppy-server' })
