# Uppy + Next.js

A Next.js App Router app with three Uppy Dashboards, one per upload method:

- **Tus**: resumable uploads to a `@tus/server` route handler (`/api/tus`)
- **XHR**: multipart form uploads to a route handler (`/api/xhr`)
- **Transloadit**: the browser asks `/api/transloadit` for signed Assembly
  options, so the Auth Secret stays on the server

Tus and XHR uploads are written to `files/` in the example folder. For a
focused production integration, follow the
[Next.js + Uppy + Transloadit guide](https://uppy.io/docs/guides/uppy-transloadit/#nextjs).

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
cp examples/nextjs/.env.example examples/nextjs/.env
corepack yarn workspace example-nextjs dev
```

Then open <http://localhost:3000>.

## Run it on its own

```sh
npx degit transloadit/uppy/examples/nextjs my-app
cd my-app
npm install
cp .env.example .env
npm run dev
```

This installs the latest Uppy release from npm. `npm run build` and
`npm start` create and serve a production build.

## What else it needs

The Transloadit Dashboard needs a [Transloadit](https://transloadit.com)
account: set `TRANSLOADIT_KEY` and `TRANSLOADIT_SECRET` in `.env`, and
optionally `TRANSLOADIT_TEMPLATE_ID`. Tus and XHR work without an account.
