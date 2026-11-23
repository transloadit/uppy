# Uppy + Node Example

This example uses a Node server and `@uppy/xhr-upload` to upload files to the
local file system (the `uploads/` folder next to `server.ts`).

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
corepack yarn workspace example-xhr-node start
```

This starts the upload server on port 3020 and the Vite dev server for the
client; open the URL Vite prints (<http://localhost:5173> by default).

## Run it on its own

Requires a Node.js version that runs TypeScript files directly (22.18 or newer).

```sh
npx degit transloadit/uppy/examples/xhr-node my-app
cd my-app
npm install
npm start
```

This installs the latest Uppy release from npm.
