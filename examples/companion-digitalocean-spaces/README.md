# Uploading to DigitalOcean Spaces

This example uses Uppy to upload files to a
[DigitalOcean Space](https://digitaloceanspaces.com/). DigitalOcean Spaces has
an identical API to S3, so we can use the
[AwsS3](https://uppy.io/docs/aws-s3) plugin. We use @uppy/companion
with a [custom `endpoint` configuration](./server.ts#L56) that points to
DigitalOcean.

`npm start` runs one Express server on port 3452 that mounts Companion under
`/companion` and serves the client through Vite.

## Configure it

Copy `.env.example` to `.env` in this folder and set `COMPANION_AWS_KEY`,
`COMPANION_AWS_SECRET`, `COMPANION_AWS_REGION` (a DigitalOcean region name,
e.g. `nyc3`) and `COMPANION_AWS_BUCKET` (the name of your Space). The server
exits if there is no `.env` file or one of these is missing.

To setup the CORS settings of your Spaces bucket in accordance with
[the plugin docs](https://uppy.io/docs/aws-s3/#setting-up-your-s3-bucket),
you can use the [example XML config file](./setcors.xml) with the
[`s3cmd` CLI](https://docs.digitalocean.com/products/spaces/reference/s3cmd/),
from this folder:

```sh
s3cmd setcors setcors.xml "s3://$COMPANION_AWS_BUCKET"
```

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
cp examples/companion-digitalocean-spaces/.env.example examples/companion-digitalocean-spaces/.env
corepack yarn workspace example-companion-digitalocean-spaces start
```

Then open <http://localhost:3452>.

## Run it on its own

Requires a Node.js version that runs TypeScript files directly (22.18 or newer).

```sh
npx degit transloadit/uppy/examples/companion-digitalocean-spaces my-app
cd my-app
npm install
cp .env.example .env
npm start
```

This installs the latest Uppy release from npm.
