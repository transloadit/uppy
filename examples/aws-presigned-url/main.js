const Uppy = require('uppy/lib/core/Core.js')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const XHRUpload = require('uppy/lib/plugins/XHRUpload')
const AwsS3 = require('uppy/lib/plugins/AwsS3')

const uppy = Uppy({
  debug: true,
  autoProceed: false
})

uppy.use(Dashboard, {
  inline: true,
  target: 'body'
})
uppy.use(XHRUpload)
uppy.use(AwsS3, {
  getUploadParameters (file) {
    // Send a request to our PHP signing endpoint.
    return fetch('/s3-sign.php', {
      method: 'post',
      // Send and receive JSON.
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: `${file.type.general}/${file.type.specific}`
      })
    }).then((response) => {
      // Parse the JSON response.
      return response.json()
    }).then((data) => {
      // Return an object in the correct shape.
      return {
        method: data.method,
        url: data.url,
        fields: {}
      }
    })
  }
})

uppy.run()
