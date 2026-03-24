# Uppy + AWS S3 with Companion

This example demonstrates using a single Companion server for **both** local and
remote file uploads to S3.

- **Local files** (drag & drop, webcam): Companion signs the S3 requests via
  `POST /s3/sign`. The browser uploads directly to S3 using presigned URLs. AWS
  credentials never leave the server.
- **Remote files** (Google Drive): Companion downloads the file from Google Drive
  and uploads it to S3 server-side using `@aws-sdk/lib-storage`. The browser
  never touches the file data.

Both flows are configured with a single `endpoint` option pointing at Companion.

## Run it

1. Set up the AWS and Google credentials in the root `.env` file:

   ```sh
   [ -f ../../.env ] || cp ../../.env.example ../../.env
   ```

   At minimum, set these in `../../.env`:

   ```
   COMPANION_AWS_KEY=...
   COMPANION_AWS_SECRET=...
   COMPANION_AWS_BUCKET=...
   COMPANION_AWS_REGION=...
   COMPANION_GOOGLE_KEY=...
   COMPANION_GOOGLE_SECRET=...
   ```

2. Update `bucket` and `region` in `main.js` to match your `.env` values.

3. From the **repository root**, run:

   ```sh
   corepack yarn install
   corepack yarn workspace example-aws-companion start
   ```

   This starts Companion on `http://localhost:3020` and the Vite dev server on
   `http://localhost:5173`.
