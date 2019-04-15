const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const AwsS3 = require('@uppy/aws-s3')

const uppy = Uppy({
  debug: true
})

uppy.use(Dashboard, {
  inline: true,
  target: 'body'
})

// No client side changes needed!
uppy.use(AwsS3, { companionUrl: '/companion' })
