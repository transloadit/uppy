# Uploading to DigitalOcean Spaces

This example uses Uppy to upload files to a DigitolOcean Space. DigitalOcean Spaces has an identical API to S3, so we can use the [AwsS3](https://uppy.io/docs/aws-s3) plugin. We use @uppy/companion with a [custom `endpoint` configuration](./server.cjs#L39) that points to DigitalOcean.

## Running it

To run this example, make sure you've correctly installed the **repository root**:

```bash
corepack yarn install
corepack yarn build
```

That will also install the dependencies for this example.

First, set up the `COMPANION_AWS_KEY`, `COMPANION_AWS_SECRET`,
`COMPANION_AWS_REGION`, and `COMPANION_AWS_BUCKET` environment variables for
`@uppy/companion` in a `.env` file. You may find useful to first copy the
`.env.example` file:

```sh
[ -f .env ] || cp .env.example .env
```

Then you can start the dev server:

```bash
corepack yarn workspace @uppy-example/digitalocean-spaces start
```
