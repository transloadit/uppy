---
type: docs
order: 3
title: "AWS S3 Multipart"
module: "@uppy/aws-s3-multipart"
permalink: docs/aws-s3-multipart/
category: "Destinations"
tagline: "uploader for AWS S3 using its resumable Multipart protocol"
---

The `@uppy/aws-s3-multipart` plugin can be used to upload files directly to an S3 bucket using S3's Multipart upload strategy. With this strategy, files are chopped up in parts of 5MB+ each, so they can be uploaded concurrently. It is also very reliable: if a single part fails to upload, only that 5MB chunk has to be retried.

```js
const AwsS3Multipart = require('@uppy/aws-s3-multipart')
uppy.use(AwsS3Multipart, {
  limit: 4,
  companionUrl: 'https://uppy-companion.myapp.net/'
})
```

## Installation

This plugin is published as the `@uppy/aws-s3-multipart` package.

Install from NPM:

```shell
npm install @uppy/aws-s3-multipart
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const AwsS3Multipart = Uppy.AwsS3Multipart
```

## Options

The `@uppy/aws-s3-multipart` plugin has the following configurable options:

### limit: 0

The maximum amount of chunks to upload simultaneously. Set to `0` to disable limiting.

### companionUrl: null

URL of the [Companion](/docs/companion) instance to use for proxying calls to the S3 Multipart API.

This will be used by the default implementations of the upload-related functions below. If you provide your own implementations, a `companionUrl` is unnecessary.

### companionHeaders: {}

Custom headers that should be sent along to [Companion](/docs/companion) on every request.

This will be used by the default implementations of the upload-related functions below. If you provide your own implementations, these headers are not sent automatically.

### createMultipartUpload(file)

A function that calls the S3 Multipart API to create a new upload. `file` is the file object from Uppy's state. The most relevant keys are `file.name` and `file.type`.

Return a Promise for an object with keys:

 - `uploadId` - The UploadID returned by S3.
 - `key` - The object key for the file. This needs to be returned to allow it to be different from the `file.name`.

The default implementation calls out to Companion's S3 signing endpoints.

### listParts(file, { uploadId, key })

A function that calls the S3 Multipart API to list the parts of a file that have already been uploaded. Receives the `file` object from Uppy's state, and an object with keys:

 - `uploadId` - The UploadID of this Multipart upload.
 - `key` - The object key of this Multipart upload.

Return a Promise for an array of S3 Part objects, as returned by the S3 Multipart API. Each object has keys:

 - `PartNumber` - The index in the file of the uploaded part.
 - `Size` - The size of the part in bytes.
 - `ETag` - The ETag of the part, used to identify it when completing the multipart upload and combining all parts into a single file.

The default implementation calls out to Companion's S3 signing endpoints.

### prepareUploadPart(file, partData)

A function that generates a signed URL to upload a single part. Receives the `file` object from Uppy's state. The `partData` argument is an object with keys:

 - `uploadId` - The UploadID of this Multipart upload.
 - `key` - The object key in the S3 bucket.
 - `body` - A [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) of this part's contents.
 - `number` - The index of this part in the file (`PartNumber` in S3 terminology).

Return a Promise for an object with keys:

 - `url` - The presigned URL to upload a part. This can be generated on the server using the S3 SDK like so:

   ```js
   sdkInstance.getSignedUrl('uploadPart', {
     Bucket: 'target',
     Key: partData.key,
     UploadId: partData.uploadId,
     PartNumber: partData.number,
     Body: '', // Empty, because it is uploaded later
     Expires: 5 * 60,
   }, (err, url) => { /* there's the url! */ })
   ```
 - `headers` - **(Optional)** Custom headers that should be sent to the S3 presigned URL.

### abortMultipartUpload(file, { uploadId, key })

A function that calls the S3 Multipart API to abort a Multipart upload, and delete all parts that have been uploaded so far. Receives the `file` object from Uppy's state, and an object with keys:

 - `uploadId` - The UploadID of this Multipart upload.
 - `key` - The object key of this Multipart upload.

This is typically called when the user cancels an upload. Cancellation cannot fail in Uppy, so the result of this function is ignored.

The default implementation calls out to Companion's S3 signing endpoints.

### completeMultipartUpload(file, { uploadId, key, parts })

A function that calls the S3 Multipart API to complete a Multipart upload, combining all parts into a single object in the S3 bucket. Receives the `file` object from Uppy's state, and an object with keys:

 - `uploadId` - The UploadID of this Multipart upload.
 - `key` - The object key of this Multipart upload.
 - `parts` - S3-style list of parts, an array of objects with `ETag` and `PartNumber` properties. This can be passed straight to S3's Multipart API.

Return a Promise for an object with properties:

 - `location` - **(Optional)** A publically accessible URL to the object in the S3 bucket.

The default implementation calls out to Companion's S3 signing endpoints.

## S3 Bucket Configuration

S3 buckets do not allow public uploads by default.  In order to allow Uppy to upload to a bucket directly, its CORS permissions need to be configured.

This process is described in the [AwsS3 documentation](/docs/aws-s3/#S3-Bucket-configuration).

While the Uppy AWS S3 plugin uses `POST` requests while uploading files to an S3 bucket, the AWS S3 Multipart plugin uses `PUT` requests when uploading file parts. Additionally, the `ETag` header must also be whitelisted:

```xml
<CORSRule>
  <!-- Change from POST to PUT if you followed the docs for the AWS S3 plugin ... -->
  <AllowedMethod>PUT</AllowedMethod>

  <!-- ... keep the existing MaxAgeSeconds and AllowedHeader lines and your other stuff ... -->

  <!-- ... and don't forget to add this tag. -->
  <ExposeHeader>ETag</ExposeHeader>
</CORSRule>
```
