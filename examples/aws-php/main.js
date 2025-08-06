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
  shouldUseMultipart: false, // The PHP backend only supports non-multipart uploads

  getUploadParameters(file) {
    // Send a request to our PHP signing endpoint.
    return fetch('/s3-sign.php', {
      method: 'post',
      // Send and receive JSON.
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    })
      .then((response) => {
        // Parse the JSON response.
        return response.json()
      })
      .then((data) => {
        // Return an object in the correct shape.
        return {
          method: data.method,
          url: data.url,
          fields: data.fields,
          headers: data.headers,
        }
      })
  },
})
