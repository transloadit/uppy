# Transloadit example

This runnable JavaScript example uses Uppy for the browser upload experience
and Transloadit as the managed backend that processes the uploaded files.

This runnable demo uses a public demo Auth Key and unsigned Assembly options in
the browser for local exploration only. It is not production-safe. For focused,
production-ready examples with server-side Signature Authentication, follow the
canonical guides for
[JavaScript](https://uppy.io/docs/guides/uppy-transloadit/#javascript),
[React](https://uppy.io/docs/guides/uppy-transloadit/#react),
[Next.js](https://uppy.io/docs/guides/uppy-transloadit/#nextjs),
[Vue](https://uppy.io/docs/guides/uppy-transloadit/#vue), and
[Angular](https://uppy.io/docs/guides/uppy-transloadit/#angular).

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
corepack yarn workspace example-transloadit start
```

This starts a small form-handling server on port 9967 and the Vite dev server
for the client; open the URL Vite prints (<http://localhost:5173> by default).

## Run it on its own

```sh
npx degit transloadit/uppy/examples/transloadit my-app
cd my-app
npm install
npm start
```

This installs the latest Uppy release from npm.
