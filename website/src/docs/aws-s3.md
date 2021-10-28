---
type: docs
order: 2
title: "AWS S3"
module: "@uppy/aws-s3"
permalink: docs/aws-s3/
category: "Destinations"
tagline: "uploader for AWS S3"
---

The `@uppy/aws-s3` plugin can be used to upload files directly to an S3 bucket.
Uploads can be signed using either \[Companion]\[companion docs] or a custom signing function.

```js
import AwsS3 from '@uppy/aws-s3'
import ms from 'ms'

uppy.use(AwsS3, {
  limit: 2,
  timeout: ms('1 minute'),
  companionUrl: 'https://uppy-companion.myapp.com/',
})
```

Uploading to S3 from a browser can be done in broadly two ways. A server can generate a presigned URL for a [PUT upload](https://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectPUT.html), or a server can generate form data for a [POST upload](https://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectPOST.html). Companion uses a POST upload. See [POST Uploads](#POST-uploads) for some caveats if you would like to use POST uploads without Companion. See [Generating a presigned upload URL server-side](#example-presigned-url) for an example of a PUT upload.

You can also use a separate plugin for S3 Multipart uploads. Multipart in this sense refers to Amazon’s proprietary chunked, resumable upload mechanism for large files. See the [`@uppy/aws-s3-multipart`](/docs/aws-s3-multipart) documentation.

## Installation

This plugin is published as the `@uppy/aws-s3` package.

Install from NPM:

```shell
npm install @uppy/aws-s3
```

In the [CDN package](/docs/#With-a-script-tag), the plugin class is available on the `Uppy` global object:

```js
const { AwsS3 } = Uppy
```

## Options

The `@uppy/aws-s3` plugin has the following configurable options:

### `id: 'AwsS3'`

A unique identifier for this plugin. Defaults to `'AwsS3'`.

### `companionUrl`

When using \[Companion]\[companion docs] to sign S3 uploads, set this option to the root URL of the Companion instance.

```js
uppy.use(AwsS3, {
  companionUrl: 'https://uppy-companion.my-app.com/',
})
```

### `companionHeaders: {}`

> Note: This only applies when using \[Companion]\[companion docs] to sign S3 uploads.

Custom headers that should be sent along to \[Companion]\[companion docs] on every request.

### `metaFields: []`

Pass an array of field names to specify the metadata fields that should be stored in S3 as Object Metadata. This takes values from each file’s `file.meta` property.

* Set this to `['name']` to only send the name field.
* Set this to an empty array `[]` (the default) to not send any fields.

### `getUploadParameters(file)`

> Note: When using \[Companion]\[companion docs] to sign S3 uploads, do not define this option.

A function that returns upload parameters for a file.
Parameters should be returned as an object, or a Promise for an object, with keys `{ method, url, fields, headers }`.

The `method` field is the HTTP method to be used for the upload.
This should be one of either `PUT` or `POST`, depending on the type of upload used.

The `url` field is the URL to which the upload request will be sent.
When using a presigned PUT upload, this should be the URL to the S3 object with signing parameters included in the query string.
When using a POST upload with a policy document, this should be the root URL of the bucket.

The `fields` field is an object with form fields to send along with the upload request.
For presigned PUT uploads, this should be left empty.

The `headers` field is an object with request headers to send along with the upload request.
When using a presigned PUT upload, it’s a good idea to provide `headers['content-type']`. That will make sure that the request uses the same content-type that was used to generate the signature. Without it, the browser may decide on a different content-type instead, causing S3 to reject the upload.

### `timeout: 30 * 1000`

When no upload progress events have been received for this amount of milliseconds, assume the connection has an issue and abort the upload. This is passed through to [XHRUpload](/docs/xhrupload#timeout-30-1000); see its documentation page for details.
Set to `0` to disable this check.

The default is 30 seconds.

### `limit: 0`

Limit the amount of uploads going on at the same time. This is passed through to [XHRUpload](/docs/xhrupload#limit-0); see its documentation page for details.
Set to `0` to disable limiting.

### `getResponseData(responseText, response)`

> This is an advanced option intended for use with _almost_ S3-compatible storage solutions.

Customize response handling once an upload is completed. This passes the function through to @uppy/xhr-upload, see its [documentation](https://uppy.io/docs/xhr-upload/#getResponseData-responseText-response) for API details.

This option is useful when uploading to an S3-like service that doesn’t reply with an XML document, but with something else such as JSON.

### `locale: {}`

<!-- eslint-disable -->

```js
module.exports = {
  strings: {
    timedOut: 'Upload stalled for %{seconds} seconds, aborting.',
  },
}

```
