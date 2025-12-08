import AwsS3 from '@uppy/aws-s3'
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'

import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'

const uppy = new Uppy({
  debug: true,
})

uppy.use(Dashboard, {
  inline: true,
  target: 'body',
})

// No client side changes needed!
uppy.use(AwsS3, { companionUrl: '/companion' })
