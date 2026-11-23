# XHR Bundle Upload

This example uses Uppy with the XHRUpload plugin in `bundle` mode. Bundle mode
uploads all files to the endpoint in a single request, instead of firing off a
new request for each file. This makes uploading a bit slower, but it may be
easier to handle on the server side, depending on your setup.

[`server.ts`](./server.ts) contains an example Express server that receives a
multipart form-data upload and responds with some information about the files
that were received (name, size) as JSON. It uses
[multer](https://npmjs.com/package/multer) to parse the upload stream.

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
corepack yarn workspace example-xhr-bundle start
```

This starts the upload server on port 9967 and the Vite dev server for the
client; open the URL Vite prints (<http://localhost:5173> by default).

## Run it on its own

Requires a Node.js version that runs TypeScript files directly (22.18 or newer).

```sh
npx degit transloadit/uppy/examples/xhr-bundle my-app
cd my-app
npm install
npm start
```

This installs the latest Uppy release from npm.
