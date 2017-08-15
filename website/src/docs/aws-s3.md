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

```js
uppy.use(XHRUpload)
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
