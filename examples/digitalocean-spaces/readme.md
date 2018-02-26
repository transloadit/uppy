# Uploading to DigitalOcean Spaces

This example uses Uppy to upload files to a DigitolOcean Space. DigitalOcean Spaces has an identical API to S3, so we can use the [AwsS3](https://uppy.io/docs/aws-s3) plugin. We use a custom signing endpoint (server.js) that uses the official AWS SDK to generate a presigned URL for our DO space.

To try this example, first run:

```bash
npm install
```

Then configure some environment variables and run it:

```bash
DO_REGION=ams3 \
DO_ACCESS_KEY=your_access_key_id \
DO_SECRET_KEY=your_secret_access_key \
DO_SPACE=your_space_name \
npm start
```
