# Uploading to DigitalOcean Spaces

This example uses Uppy to upload files to a DigitolOcean Space. DigitalOcean Spaces has an identical API to S3, so we can use the [AwsS3](https://uppy.io/docs/aws-s3) plugin. We use uppy-server with a [custom `endpoint` configuration](./server.js#L32-L33) that points to DigitalOcean.

To try this example, first run:

```bash
npm install
```

Then configure some environment variables and run it:

```bash
UPPYSERVER_AWS_REGION=ams3 \
UPPYSERVER_AWS_KEY=your_access_key_id \
UPPYSERVER_AWS_SECRET=your_secret_access_key \
UPPYSERVER_AWS_BUCKET=your_space_name \
npm start
```
