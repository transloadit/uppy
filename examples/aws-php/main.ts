import AwsS3 from '@uppy/aws-s3'
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'

const uppy = new Uppy({
  debug: true,
})

uppy.use(Dashboard, {
  inline: true,
  target: 'body',
})
uppy.use(AwsS3, {
  // The PHP backend only signs single PutObject URLs (no multipart).
  shouldUseMultipart: false,

  // signRequest is called for each S3 operation. For single PUTs the
  // request is `{ method: 'PUT', key }`. The server returns a presigned URL.
  signRequest: async (request) => {
    const response = await fetch('/s3-sign.php', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        method: request.method,
        key: request.key,
      }),
    })
    if (!response.ok) throw new Error('Failed to get presigned URL')
    return response.json()
  },
})
