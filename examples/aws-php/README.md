# Uppy + AWS S3 Example

This example uses a server-side PHP endpoint (`s3-sign.php`) to sign uploads to
S3. The browser asks it for a presigned `PUT` URL per file and uploads straight
to the bucket, under `uppy-php-example/`. Multipart uploads are disabled.

`npm start` runs PHP’s built-in server on port 8080. `serve.php` bundles
`main.ts` with esbuild on each request for `/main.js` and serves the Uppy CSS
from `node_modules`.

## What it needs

- PHP, and [Composer](https://getcomposer.org) to install the AWS PHP SDK:
  run `composer install` in this folder.
- An S3 bucket whose CORS configuration allows `PUT` from
  `http://localhost:8080`; see
  [the plugin docs](https://uppy.io/docs/aws-s3/#setting-up-your-s3-bucket).
- AWS settings as environment variables of the PHP server (PHP does not read a
  `.env` file here):
  - `COMPANION_AWS_BUCKET` (default `uppy-test`) and `COMPANION_AWS_REGION`
    (default `eu-west-2`)
  - `COMPANION_AWS_KEY` and `COMPANION_AWS_SECRET`; without them the AWS SDK’s
    [default credential chain](https://docs.aws.amazon.com/aws-sdk-php/v3/guide/guide/credentials.html)
    is used (`AWS_ACCESS_KEY_ID`, `~/.aws/credentials`, …)
  - `COMPANION_AWS_ENDPOINT`, optional, for an S3-compatible service

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
(cd examples/aws-php && composer install)
COMPANION_AWS_BUCKET=… COMPANION_AWS_REGION=… \
  corepack yarn workspace example-aws-php start
```

Then open <http://localhost:8080>.

## Run it on its own

```sh
npx degit transloadit/uppy/examples/aws-php my-app
cd my-app
npm install
composer install
```

`serve.php` runs `corepack yarn outputBundle` to build `main.js`. If you don’t
use Corepack, change that line to `npm run --silent outputBundle`. Then:

```sh
COMPANION_AWS_BUCKET=… COMPANION_AWS_REGION=… npm start
```

This installs the latest Uppy release from npm.

You can use a different S3-compatible service like GCS by configuring that
service in `~/.aws/config` and `~/.aws/credentials`, and then providing
appropriate environment variables:

```sh
AWS_PROFILE="gcs" \
COMPANION_AWS_ENDPOINT="https://storage.googleapis.com" \
COMPANION_AWS_BUCKET="test-bucket-name" \
  npm start
```
