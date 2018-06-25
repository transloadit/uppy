---
type: docs
order: 33
title: "AwsS3Multipart"
permalink: docs/aws-s3-multipart/
---

The `AwsS3Multipart` plugin can be used to upload files directly to an S3 bucket using S3's Multipart upload strategy. With this strategy, files are chopped up in parts of 5MB+ each, so they can be uploaded concurrently. It's also very reliable: if a single part fails to upload, only that 5MB has to be retried.

```js
const AwsS3Multipart = require('@uppy/aws-s3-multipart')
uppy.use(AwsS3Multipart, {
  limit: 4,
  serverUrl: 'https://uppy-server.myapp.net/'
})
```

## Installation

This plugin is published as the `@uppy/aws-s3-multipart` package.

```shell
npm install @uppy/aws-s3-multipart
```

## Options

### limit: 0

The maximum amount of chunks to upload simultaneously. `0` means unlimited.

### serverUrl: null

The Uppy Server URL to use to proxy calls to the S3 Multipart API.

### createMultipartUpload(file)

A function that calls the S3 Multipart API to create a new upload. `file` is the file object from Uppy's state. The most relevant keys are `file.name` and `file.type`.

Return a Promise for an object with keys:

 - `uploadId` - The UploadID returned by S3.
 - `key` - The object key for the file. This needs to be returned to allow it to be different from the `file.name`.

The default implementation calls out to Uppy Server's S3 signing endpoints.

### listParts({ uploadId, key })

A function that calls the S3 Multipart API to list the parts of a file that have already been uploaded. Receives an object with keys:

 - `uploadId` - The UploadID of this Multipart upload.
 - `key` - The object key of this Multipart upload.

Return a Promise for an array of S3 Part objects, as returned by the S3 Multipart API. Each object has keys:

 - `PartNumber` - The index in the file of the uploaded part.
 - `Size` - The size of the part in bytes.
 - `ETag` - The ETag of the part, used to identify it when completing the multipart upload and combining all parts into a single file.

The default implementation calls out to Uppy Server's S3 signing endpoints.

### prepareUploadPart(partData)

A function that generates a signed URL to upload a single part. The `partData` argument is an object with keys:

 - `uploadId` - The UploadID of this Multipart upload.
 - `key` - The object key in the S3 bucket.
 - `body` - A [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) of this part's contents.
 - `number` - The index of this part in the file (`PartNumber` in S3 terminology).

Return a Promise for an object with keys:

 - `url` - The presigned URL to upload a part. This can be generated using the S3 SDK like so:

   ```js
   sdkInstance.getSignedUrl('uploadPart', {
     Bucket: 'target',
     Key: partData.key,
     UploadId: partData.uploadId,
     PartNumber: partData.number,
     Body: '', // Empty, because it's uploaded later
     Expires: Date.now() + 5 * 60 * 1000
   }, (err, url) => { /* there's the url! */ })
   ```

### abortMultipartUpload({ uploadId, key })

A function that calls the S3 Multipart API to abort a Multipart upload, and delete all parts that have been uploaded so far. Receives an object with keys:

 - `uploadId` - The UploadID of this Multipart upload.
 - `key` - The object key of this Multipart upload.

This is typically called when the user cancels an upload. Cancellation cannot fail in Uppy, so the result of this function is ignored.

The default implementation calls out to Uppy Server's S3 signing endpoints.

### completeMultipartUpload({ uploadId, key, parts })

A function that calls the S3 Multipart API to complete a Multipart upload, combining all parts into a single object in the S3 bucket. Receives an object with keys:

 - `uploadId` - The UploadID of this Multipart upload.
 - `key` - The object key of this Multipart upload.
 - `parts` - S3-style list of parts, an array of objects with `ETag` and `PartNumber` properties. This can be passed straight to S3's Multipart API.

Return a Promise for an object with properties:

 - `location` - **(Optional)** A publically accessible URL to the object in the S3 bucket.

The default implementation calls out to Uppy Server's S3 signing endpoints.

## S3 Bucket Configuration

S3 buckets do not allow public uploads by default.  In order to allow Uppy to upload to a bucket directly, its CORS permissions need to be configured.

This process is described in the [AwsS3 documentation](/docs/aws-s3/#S3-Bucket-configuration).

On top of the configuration mentioned there, the `ETag` header must also be whitelisted:

```xml
<CORSRule>
  <AllowedMethod>PUT</AllowedMethod>
  <!-- ... all your existingCORS config goes here ... -->

  <!-- The magic: -->
  <ExposeHeader>ETag</ExposeHeader>
</CORSRule>
```
