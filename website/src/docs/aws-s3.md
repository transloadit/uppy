---
type: docs
order: 32
title: "AwsS3"
permalink: docs/aws-s3/
---

The `AwsS3` plugin can be used to upload files directly to an S3 bucket.
Uploads can be signed using [uppy-server][uppy-server docs] or a custom signing function.

```js
uppy.use(AwsS3, {
  // Options
})
```

## Options

### `host`

When using [uppy-server][uppy-server docs] to sign S3 uploads, set this option to the root URL of the uppy-server.

```js
uppy.use(AwsS3, {
  host: 'https://uppy-server.my-app.com/'
})
```

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

### `timeout: 30 * 1000`

When no upload progress events have been received for this amount of milliseconds, assume the connection has an issue and abort the upload. This is passed through to [XHRUpload](/docs/xhrupload#timeout-30-1000); see its documentation page for details.
Set to `0` to disable this check.

The default is 30 seconds.

### `limit: 0`

Limit the amount of uploads going on at the same time. This is passed through to [XHRUpload](/docs/xhrupload#limit-0); see its documentation page for details.
Set to `0` to disable limiting.

## S3 Bucket configuration

S3 buckets do not allow public uploads by default.
In order to allow Uppy to upload to a bucket directly, its CORS permissions need to be configured.

CORS permissions can be found in the [S3 Management Console](https://console.aws.amazon.com/s3/home).
Click the bucket that will receive the uploads, then go into the "Permissions" tab and select the "CORS configuration" button.
An XML document will be shown that contains the CORS configuration.

Good practice is to use two CORS rules: one for viewing the uploaded files, and one for uploading files.

Depending on which settings were enabled during bucket creation, AWS S3 may have defined a CORS rule that allows public reading already.
This rule looks like:

```xml
<CORSRule>
  <AllowedOrigin>*</AllowedOrigin>
  <AllowedMethod>GET</AllowedMethod>
  <MaxAgeSeconds>3000</MaxAgeSeconds>
</CORSRule>
```

If uploaded files should be publically viewable, but a rule like this is not present, add it.

A different `<CORSRule>` is necessary to allow uploading.
This rule should come _before_ the existing rule, because S3 only uses the first rule that matches the origin of the request.

At minimum, the domain from which the uploads will happen must be whitelisted, and the definitions from the previous rule must be added:

```xml
<AllowedOrigin>https://my-app.com</AllowedOrigin>
<AllowedMethod>GET</AllowedMethod>
<MaxAgeSeconds>3000</MaxAgeSeconds>
```

When using uppy-server, which generates a POST policy document, the following permissions must be granted:

```xml
<AllowedMethod>POST</AllowedMethod>
<AllowedHeader>Authorization</AllowedHeader>
<AllowedHeader>x-amz-date</AllowedHeader>
<AllowedHeader>x-amz-content-sha256</AllowedHeader>
<AllowedHeader>content-type</AllowedHeader>
```

When using a presigned upload URL, the following permissions must be granted:

```xml
<AllowedMethod>PUT</AllowedMethod>
```

The final configuration should look something like the below:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
    <AllowedOrigin>https://my-app.com</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <MaxAgeSeconds>3000</MaxAgeSeconds>
    <AllowedHeader>Authorization</AllowedHeader>
    <AllowedHeader>x-amz-date</AllowedHeader>
    <AllowedHeader>x-amz-content-sha256</AllowedHeader>
    <AllowedHeader>content-type</AllowedHeader>
  </CORSRule>
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <MaxAgeSeconds>3000</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>
```

In-depth documentation about CORS rules is available on the [AWS documentation site](https://docs.aws.amazon.com/AmazonS3/latest/dev/cors.html).

## Examples

### Generating a presigned upload URL server-side

The `getUploadParameters` function can return a Promise, so upload parameters can be prepared server-side.
That way, no private keys to the S3 bucket need to be shared on the client.
For example, there could be a PHP server endpoint that prepares a presigned URL for a file:

```js
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
        contentType: file.type
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

### S3 Alternatives

Many other object storage providers have an identical API to S3, so you can use the AwsS3 plugin with them. You do have to provide a custom signing endpoint for these providers. You can use the official AWS SDK for the server-side language of your choice to create one of these endpoints fairly easily.

For example, with DigitalOcean Spaces, you could use the client-side AwsS3 plugin configuration from the [previous example](#Generating-a-presigned-upload-URL-server-side), and create a signing endpoint using [express](https://expressjs.com) and the [aws-sdk](https://npmjs.com/package/aws-sdk) for Node.js:

```js
const S3 = require('aws-sdk/clients/s3')
const app = require('express')()

const s3 = new S3({
  endpoint: 'YOUR_REGION.digitaloceanspaces.com',
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY'
})

app.post('/params', (req, res) => {
  const { filename, contentType } = req.body

  s3.getSignedUrl('putObject', {
    Bucket: 'YOUR_SPACE_NAME',
    Key: filename,
    ContentType: contentType,
    Expires: 5 * 60 * 1000 // 5 minutes
  }, (err, data) => {
    if (err) return next(err)

    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({
      method: 'put',
      url: data
    }, null, 2))
  })
})

app.listen(8080)
```

For a working example that you can run and play around with, see the [digitalocean-spaces](https://github.com/transloadit/uppy/tree/master/examples/digitalocean-spaces) folder in the Uppy repository.

### Retrieving presign parameters of the uploaded file

Once the file is uploaded, it's possible to retrieve the parameters that were
generated in `getUploadParameters(file)` via the `file.meta` field:

```js
uppy.on("upload-success", (fileId, data) {
  const file = uppy.getFile(fileId)

  file.meta['key'] // the S3 object key of the uploaded file
})
```

[uppy-server docs]: /docs/server/index.html
