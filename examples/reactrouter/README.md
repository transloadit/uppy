# Uppy + React Router

A React Router v8 app (framework mode, served by Express) with three Uppy
Dashboards, one per upload method:

- **Tus**: resumable uploads to a `@tus/server` handler mounted in `server.ts`
  (`/api/upload/tus`)
- **XHR**: multipart form uploads to a React Router resource route
  (`/api/upload/xhr`)
- **Transloadit**: the browser asks `/api/transloadit-params` for signed
  Assembly options, so the Auth Secret stays on the server

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
cp examples/reactrouter/.env.example examples/reactrouter/.env
corepack yarn workspace example-reactrouter dev
```

Then open <http://localhost:3000>.

## Run it on its own

Requires Node.js 22.22 or newer.

```sh
npx degit transloadit/uppy/examples/reactrouter my-app
cd my-app
npm install
cp .env.example .env
npm run dev
```

This installs the latest Uppy release from npm.

## What else it needs

The Transloadit Dashboard needs a [Transloadit](https://transloadit.com)
account:

1. Sign up at [transloadit.com](https://transloadit.com).
2. Copy your Auth Key and Auth Secret from your account.
3. Create a Template for the processing you want.
4. Set `TRANSLOADIT_KEY`, `TRANSLOADIT_SECRET` and `TRANSLOADIT_TEMPLATE_ID`
   in `.env`, or export them in your shell.

Tus and XHR work without an account.
