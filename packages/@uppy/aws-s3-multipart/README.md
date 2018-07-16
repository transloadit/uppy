# @uppy/aws-s3-multipart

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/aws-s3-multipart"><img src="https://img.shields.io/npm/v/@uppy/aws-s3-multipart.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

The AwsS3Multipart plugin can be used to upload files directly to an S3 bucket using S3’s Multipart upload strategy. With this strategy, files are chopped up in parts of 5MB+ each, so they can be uploaded concurrently. It’s also very reliable: if a single part fails to upload, only that 5MB has to be retried.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')
const AwsS3Multipart = require('@uppy/aws-s3-multipart')

const uppy = Uppy()
uppy.use(AwsS3Multipart, {
  limit: 2,
  serverUrl: 'https://uppy-server.myapp.com/'
})
```

## Installation

```bash
$ npm install @uppy/aws-s3-multipart --save
```

We recommend installing from npm and then using a module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/aws-s3-multipart).

## License

[The MIT License](./LICENSE).
