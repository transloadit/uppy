# @uppy/s3

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/s3.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/s3)

> [!WARNING]
> Experimental. This plugin, `@uppy/transloadit-storage` and the Companion
> endpoints they use will change incompatibly, also in minor releases, as they
> make way for a standalone file manager.

Browse an S3-compatible bucket (AWS S3, Cloudflare R2, MinIO) from the
Dashboard and pick files from it. With `mode: 'manager'`, users can also rename,
move and delete files and create folders, when Companion allows the session to
write.

This is not the uploader: to upload to S3, use
[`@uppy/aws-s3`](https://www.npmjs.com/package/@uppy/aws-s3).

A [Companion](https://uppy.io/docs/companion) instance is required. Companion
holds the bucket credentials and decides what the user may see and change,
either from the bucket it is configured with or from a short-lived storage
grant your server issues (see `getGrant`).

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import S3 from '@uppy/s3'

const uppy = new Uppy()
uppy.use(S3, {
  companionUrl: 'https://companion.example.com',
})
```

Companion needs the `s3` provider configured:

```js
const companionOptions = {
  // …
  providerOptions: {
    s3: {
      key: process.env.S3_KEY,
      secret: process.env.S3_SECRET,
      region: 'us-east-1',
      endpoint: 'https://…', // for R2, MinIO and other non-AWS storage
      bucket: 'my-bucket',
      prefix: 'uploads/', // optional: confine browsing to a prefix
    },
  },
}
```

With `bucket`, everyone who can reach Companion browses that bucket, and with
`mode: 'manager'` can also change it, so put Companion behind your own
authentication. To scope access per user, configure `grantSecret` or
`grantPublicKey` instead and pass `getGrant` to the plugin; the grant then
decides whether the user may write.

The `s3` provider needs `@uppy/companion` 7.1 or later. It is separate from the
top-level `s3` option, which configures uploads to S3.

## Installation

```bash
$ npm install @uppy/s3
```

## Documentation

This plugin is not documented on uppy.io yet. Its options are described in the
`S3Options` type that the package exports.

## License

[The MIT License](https://github.com/transloadit/uppy/blob/main/LICENSE).
