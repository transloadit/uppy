# Uppy + AWS S3 Example

This example uses @uppy/companion with a custom AWS S3 configuration.
Files are uploaded to a randomly named directory inside the `whatever/` directory in a bucket.

## Run it

To run this example, make sure you've correctly installed the **repository root**:
```bash
npm install
```
That will also install the dependencies for this example.

Then, set up the `COMPANION_AWS_KEY`, `COMPANION_AWS_SECRET`, `COMPANION_AWS_REGION`, and `COMPANION_AWS_BUCKET` environment variables for @uppy/companion.

Then, again in the **repository root**, start this example by doing:
```bash
npm run example aws-companion
```
