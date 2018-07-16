# @uppy/aws-s3

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/aws-s3"><img src="https://img.shields.io/npm/v/@uppy/aws-s3.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

The AwsS3 plugin can be used to upload files directly to an S3 bucket. Uploads can be signed using Uppy Server or a custom signing function.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')
const AwsS3 = require('@uppy/aws-s3')

const uppy = Uppy()
uppy.use(AwsS3, {
  limit: 2,
  timeout: ms('1 minute'),
  serverUrl: 'https://uppy-server.myapp.com/'
})
```

## Installation

```bash
$ npm install @uppy/aws-s3 --save
```

We recommend installing from npm and then using a module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/aws-s3).

## License

[The MIT License](./LICENSE).
