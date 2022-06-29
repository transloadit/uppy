# Uppy + AWS S3 Example

This example uses @uppy/companion with a custom AWS S3 configuration.
Files are uploaded to a randomly named directory inside the `whatever/`
directory in a bucket.

## Run it

First, set up the `COMPANION_AWS_KEY`, `COMPANION_AWS_SECRET`,
`COMPANION_AWS_REGION`, and `COMPANION_AWS_BUCKET` environment variables for
`@uppy/companion` in a `.env` file. You may find useful to first copy the
`.env.example` file:

```sh
[ -f .env ] || cp .env.example .env
```

To run this example, from the **repository root**, run:

```sh
corepack yarn install
corepack yarn workspace @uppy-example/aws-companion start
```
