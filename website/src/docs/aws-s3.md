---
type: docs
order: 32
title: "AwsS3"
permalink: docs/aws-s3/
---

The `AwsS3` plugin can be used to upload files directly to an S3 bucket.
Uploads can be signed using [uppy-server][uppy-server docs] or a custom signing function.

```js
const AwsS3 = require('uppy/lib/plugins/AwsS3')
const ms = require('ms')

uppy.use(AwsS3, {
  limit: 2,
  timeout: ms('1 minute'),
  host: 'https://uppy-server.myapp.com/'
})
```

There are broadly two ways to upload to S3 in a browser. A server can generate a presigned URL for a [PUT upload](https://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectPUT.html), or a server can generate form data for a [POST upload](https://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectPOST.html). uppy-server uses a POST upload. See [POST uPloads](#post-uploads) for some caveats if you would like to use POST uploads without uppy-server. See [Generating a presigned upload URL server-side](#example-presigned-url) for an example of a PUT upload.

There is also a separate plugin for S3 Multipart uploads. Multipart in this sense is Amazon's proprietary chunked, resumable upload mechanism for large files. See the [AwsS3Multipart](/docs/aws-s3-multipart) documentation.

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
Parameters should be returned as an object, or a Promise for an object, with keys `{ method, url, fields, headers }`.

The `method` field is the HTTP method to use for the upload.
This should be one of `PUT` or `POST`, depending on the type of upload used.

The `url` field is the URL to send the upload request to.
When using a presigned PUT upload, this should be the URL to the S3 object including signing parameters in the query string.
When using a POST upload with a policy document, this should be the root URL of the bucket.

The `fields` field is an object with form fields to send along with the upload request.
For presigned PUT uploads, this should be empty.

The `headers` field is an object with request headers to send along with the upload request.

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

## POST Uploads

uppy-server uses POST uploads by default, but you can also use them with your own endpoints. There are a few things to be aware of when doing so:

 - The AwsS3 plugin attempts to read the `<Location>` XML tag from POST upload responses. S3 does not respond with an XML document by default. When generating the form data for POST uploads, you must set the `success_action_status` field to `201`.
   ```js
   // `s3` is an instance of the AWS JavaScript SDK's S3 client
   s3.createPresignedPost({
     ...,
     Fields: {
       ...,
       success_action_status: '201'
     }
   })
   ```

## S3 Alternatives

Many other object storage providers have an identical API to S3, so you can use the AwsS3 plugin with them. To use them with Uppy Server, you can set the `UPPYSERVER_AWS_ENDPOINT` variable to the endpoint of your preferred service.

### DigitalOcean Spaces

For example, with DigitalOcean Spaces, you could do something like this:

```bash
export UPPYSERVER_AWS_ENDPOINT="https://{region}.digitaloceanspaces.com"
export UPPYSERVER_AWS_BUCKET="my-space-name"
```

The `{region}` string will be replaced by the contents of the `UPPYSERVER_AWS_REGION` environment variable.

For a working example that you can run and play around with, see the [digitalocean-spaces](https://github.com/transloadit/uppy/tree/master/examples/digitalocean-spaces) folder in the Uppy repository.

### Google Cloud Storage

For Google Cloud Storage, you need to take a few more steps. For the AwsS3 plugin to be able to upload to a GCS bucket, it needs the Interoperability setting enabled. You can enable the Interoperability setting and [generate interoperable storage access keys](https://cloud.google.com/storage/docs/migrating#keys) by going to [Google Cloud Storage](https://console.cloud.google.com/storage) » Settings » Interoperability. Then set the environment variables for Uppy Server like below:

```bash
export UPPYSERVER_AWS_ENDPOINT="https://storage.googleapis.com"
export UPPYSERVER_AWS_BUCKET="YOUR-GCS-BUCKET-NAME"
export UPPYSERVER_AWS_KEY="GOOGxxxxxxxxx" # The Access Key
export UPPYSERVER_AWS_SECRET="YOUR-GCS-SECRET" # The Secret
```

You do not need to configure the region with GCS.

You also need to configure CORS differently. Unlike Amazon, Google does not offer a UI for CORS configurations. Instead an HTTP API must be used. If you haven't done this already, see [Configuring CORS on a Bucket](https://cloud.google.com/storage/docs/configuring-cors#Configuring-CORS-on-a-Bucket) in the GCS documentation, or follow the below steps to do it using Google's API playground.

GCS has multiple CORS formats, both XML and JSON. Unfortunately their XML format is different from Amazon's, so we can't simply use the one from the [S3 Bucket configuration](#S3-Bucket-configuration) section. Google appears to favour the JSON format, so we'll use that.

#### JSON CORS Configuration

The JSON format consists of an array of CORS configuration objects. An example using POST policy document uploads is shown here:

```json
{
  "cors": [
    {
      "origin": ["https://my-app.com"],
      "method": ["GET", "POST"],
      "maxAgeSeconds": 3000
    },
    {
      "origin": ["*"],
      "method": ["GET"],
      "maxAgeSeconds": 3000
    }
  ]
}
```

Most AWS configurations should be fairly simple to port to this format. When using presigned `PUT` uploads, replace the `"POST"` method by `"PUT"` in the first entry.

If you have the [gsutil](https://cloud.google.com/storage/docs/gsutil) command-line tool, you can apply this configuration using the [gsutil cors](https://cloud.google.com/storage/docs/configuring-cors#configure-cors-bucket) command.

```bash
gsutil cors set THAT-FILE.json gs://BUCKET-NAME
```

Otherwise, you can manually apply it through the OAuth playground:

 1. Get a temporary API token from the [Google OAuth2.0 playground](https://developers.google.com/oauthplayground/)
   1. Select the "Cloud Storage JSON API v1" » "devstorage.full_control" scope
   1. Press "Authorize APIs" and allow access
 1. Click "Step 3 - Configure request to API"
 1. Configure it like below:
   - HTTP Method: PATCH
   - Request URI: `https://www.googleapis.com/storage/v1/b/YOUR_BUCKET_NAME`
   - Content-Type: application/json (should be the default)
   - Press "Enter request body" and input your CORS configuration
 1. Then, finally, press "Send the request".

## Examples

<a id="example-presigned-url"></a>
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
        fields: data.fields
      }
    })
  }
})
```

See the [aws-presigned-url example in the uppy repository](https://github.com/transloadit/uppy/tree/master/examples/aws-presigned-url) for a small example that implements both the server-side and the client-side.

### Retrieving presign parameters of the uploaded file

Once the file is uploaded, it's possible to retrieve the parameters that were
generated in `getUploadParameters(file)` via the `file.meta` field:

```js
uppy.on('upload-success', (file, data) => {
  file.meta['key'] // the S3 object key of the uploaded file
})
```

[uppy-server docs]: /docs/server/index.html
