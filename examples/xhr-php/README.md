# Uppy + PHP Example

This example uses a PHP server and `@uppy/xhr-upload` to upload files to the
local file system (the `uploads/` folder next to `server.php`).

Requires PHP on your `PATH`; `npm start` runs PHP’s built-in server on port
3020 next to the Vite dev server for the client.

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
corepack yarn workspace example-xhr-php start
```

Then open the URL Vite prints (<http://localhost:5173> by default).

## Run it on its own

```sh
npx degit transloadit/uppy/examples/xhr-php my-app
cd my-app
npm install
npm start
```

This installs the latest Uppy release from npm.
