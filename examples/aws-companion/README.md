# Uppy + AWS S3 Example

This example uses @uppy/companion with a custom AWS S3 configuration: Companion
signs the uploads, and files are uploaded to the bucket under a random UUID
prefix (`<uuid>-<filename>`). The Dashboard also offers Webcam and Google Drive.

`npm start` runs Companion on port 3020 (`server.ts`) and the Vite dev server
for the client on port 5173.

## Configure it

Copy `.env.example` to `.env` in this folder and fill in `COMPANION_AWS_KEY`,
`COMPANION_AWS_SECRET`, `COMPANION_AWS_REGION` and `COMPANION_AWS_BUCKET`.
`COMPANION_AWS_ENDPOINT` and `COMPANION_AWS_FORCE_PATH_STYLE` are optional, for
S3-compatible services. The Google Drive source also needs
`COMPANION_GOOGLE_KEY` and `COMPANION_GOOGLE_SECRET`. The server exits if there
is no `.env` file.

The bucket needs a CORS configuration that allows `PUT` from
`http://localhost:5173` and exposes the `ETag` header; see
[the plugin docs](https://uppy.io/docs/aws-s3/#setting-up-your-s3-bucket).

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
cp examples/aws-companion/.env.example examples/aws-companion/.env
corepack yarn workspace example-aws-companion start
```

Then open <http://localhost:5173>.

## Run it on its own

Requires a Node.js version that runs TypeScript files directly (22.18 or newer).

```sh
npx degit transloadit/uppy/examples/aws-companion my-app
cd my-app
npm install
cp .env.example .env
npm start
```

This installs the latest Uppy release from npm.
