# Uploading to DigitalOcean Spaces

This example uses Uppy to upload files to a
[DigitalOcean Space](https://digitaloceanspaces.com/). DigitalOcean Spaces has
an identical API to S3, so we can use the
[AwsS3](https://uppy.io/docs/aws-s3-multipart) plugin. We use @uppy/companion
with a [custom `endpoint` configuration](./server.cjs#L39) that points to
DigitalOcean.

## Running it

To run this example, make sure you've correctly installed the **repository
root**:

```bash
corepack yarn install
corepack yarn build
```

That will also install the dependencies for this example.

First, set up the `COMPANION_AWS_KEY`, `COMPANION_AWS_SECRET`,
`COMPANION_AWS_REGION` (use a DigitalOcean region name for
`COMPANION_AWS_REGION`, e.g. `nyc3`), and `COMPANION_AWS_BUCKET` environment
variables for `@uppy/companion` in a `.env` file. You may find useful to first
copy the `.env.example` file:

```sh
[ -f .env ] || cp .env.example .env
```

To setup the CORS settings of your Spaces bucket in accordance with
[the plugin docs](https://uppy.io/docs/aws-s3-multipart/#setting-up-your-s3-bucket),
you can use the [example XML config file](./setcors.xml) with the
[`s3cmd` CLI](https://docs.digitalocean.com/products/spaces/reference/s3cmd/):

```sh
s3cmd setcors examples/digitalocean-spaces/setcors.xml "s3://$COMPANION_AWS_BUCKET"
```

Then you can start the dev server:

```bash
corepack yarn workspace @uppy-example/digitalocean-spaces start
```
