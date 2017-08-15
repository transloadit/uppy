---
type: docs
order: 4
title: "AwsS3"
permalink: docs/aws-s3/
---

The `AwsS3` plugin can be used to upload files directly to an S3 bucket.

As of now, the `AwsS3` plugin "decorates" the XHRUpload plugin.
To upload files directly to S3, both the XHRUpload and AwsS3 plugins must be used:

```js
// No options have to be provided to the XHRUpload plugin,
// the S3 plugin will configure it.
uppy.use(XHRUpload)
uppy.use(AwsS3, {
  // Options for S3
})
```

## Options

### `host`

When using [uppy-server][uppy-server docs] to sign S3 uploads, set this option to the root URL of the uppy-server.

### `getUploadParameters(file)`

> Note: When using [uppy-server][uppy-server docs] to sign S3 uploads, do not define this option.

A function returning upload parameters for a file.
Parameters should be returned as an object, or a Promise for an object, with keys `{ method, url, fields }`.

The `method` field is the HTTP method to use for the upload.
This should be one of `PUT` or `POST`, depending on the type of upload used.

The `url` field is the URL to send the upload request to.
When using a presigned PUT upload, this should be the URL to the S3 object including signing parameters in the query string.
When using a POST upload with a policy document, this should be the root URL of the bucket.

The `fields` field is an object with form fields to send along with the upload request.
For presigned PUT uploads, this should be empty.

The `getUploadParameters` function can return a Promise, so upload parameters can be prepared server-side.
That way, no private keys to the S3 bucket need to be shared on the client.
For example, there could be a PHP server endpoint that prepares a presigned URL for a file:

```js
uppy
  .use(XHRUpload)
  .use(AwsS3, {
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
```

See the [aws-presigned-url example in the uppy repository](https://github.com/transloadit/uppy/tree/master/examples/aws-presigned-url) for a small example that implements both the server-side and the client-side.

[uppy-server docs]: /docs/server/index.html
