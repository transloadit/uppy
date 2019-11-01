# @uppy/backblaze-b2-multipart

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/backblaze-b2-multipart"><img src="https://img.shields.io/npm/v/@uppy/backblaze-b2-multipart.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

The Backblaze B2 plugin can be used to upload files directly to a Backblaze B2 bucket with the assistance of Companion.

## Example
```js
const Uppy = require('@uppy/core')
const BackblazeB2 = require('@uppy/backblaze-b2-multipart')

const uppy = Uppy()
uppy.use(BackblazeB2, {
  companionUrl: 'https://my-companion'
})
```

## Installation

```bash
$ npm install @uppy/backblaze-b2-multipart --save
```

## Backblaze Requirements

# Bucket CORS rules

The bucket name you specify in your Companion configuration must have proper CORS rules
set in order to receive uploads from users. It is recommended that you read more about
[Backblaze's CORS documentation](https://www.backblaze.com/b2/docs/cors_rules.html) to
understand the choices below.

The following JSON snippet should be sufficient to get this extension working.
```js
[
  {
    "corsRuleName": "Uppy",
    "allowedOrigins": [
      "*"
    ],
    "allowedHeaders": [
      "range",
      "authorization",
      "content-type",
      "X-Bz-Part-Number",
      "X-Bz-Content-Sha1",
      "X-Bz-File-Name",
      "X-Bz-Info-*"
    ],
    "allowedOperations": [
      "b2_upload_part",
      "b2_upload_file"
    ],
    "exposeHeaders": [
      "x-bz-content-sha1"
    ],
    "maxAgeSeconds": 3600
  }
]
```

# B2 Application Key

Your B2 *Application Key* is kept secret within Companion. Companion is then responsible
for handing out *authorization tokens* to the Uppy client, which then uses that authorization
token to perform actual file transfers to B2. **Note that the client can upload to anywhere
within your bucket** unless you define file prefix limits on the *Application Key*.

Learn more about [B2 Application Keys](https://www.backblaze.com/b2/docs/application_keys.html).

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/backblaze-b2-multipart).

## License

[The MIT License](./LICENSE).
