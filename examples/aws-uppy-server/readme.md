# Uppy + AWS S3 Example

This example uses uppy-server with a custom AWS S3 configuration.
Files are uploaded to a randomly named directory inside the `whatever/` directory in a bucket.

## Run it

First set up the `UPPYSERVER_AWS_KEY`, `UPPYSERVER_AWS_SECRET`, `UPPYSERVER_AWS_REGION`, and `UPPYSERVER_AWS_BUCKET` environment variables for uppy-server.

Move into this directory, then:

```bash
npm install
npm start
```
