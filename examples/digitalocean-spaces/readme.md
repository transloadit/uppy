# Uploading to DigitalOcean Spaces

This example uses Uppy to upload files to a DigitolOcean Space. DigitalOcean Spaces has an identical API to S3, so we can use the [AwsS3](https://uppy.io/docs/aws-s3) plugin. We use @uppy/companion with a [custom `endpoint` configuration](./server.js#L32-L33) that points to DigitalOcean.

To run this example, make sure you've correctly installed the root repository:

```bash
npm install
```

Then navigate to this directory, configure some environment variables, and run:

```bash
COMPANION_AWS_REGION=ams3 \
COMPANION_AWS_KEY=your_access_key_id \
COMPANION_AWS_SECRET=your_secret_access_key \
COMPANION_AWS_BUCKET=your_space_name \
npm start
```
