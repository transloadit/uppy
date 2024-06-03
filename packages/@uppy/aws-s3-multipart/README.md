# @uppy/aws-s3-multipart

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/aws-s3-multipart.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/aws-s3-multipart)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/Tests/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

The AwsS3Multipart plugin can be used to upload files directly to an S3 bucket
using S3’s Multipart upload strategy. With this strategy, files are chopped up
in parts of 5MB+ each, so they can be uploaded concurrently. It’s also reliable:
if a single part fails to upload, only that 5MB has to be retried.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import AwsS3Multipart from '@uppy/aws-s3-multipart'

const uppy = new Uppy()
uppy.use(AwsS3Multipart, {
  limit: 2,
  companionUrl: 'https://companion.myapp.com/',
})
```

## Installation

```bash
$ npm install @uppy/aws-s3-multipart
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Edgly. In that case `Uppy` will attach itself to the global
`window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/aws-s3-multipart).

## License

[The MIT License](./LICENSE).
