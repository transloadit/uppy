# Uppy + React

A Vite + React app built with the `@uppy/react` components and hooks: a custom
dropzone, webcam, screen capture, image editor, remote sources and the Google
Drive and Google Photos pickers. Files upload with `@uppy/tus` to the public
Tus demo server (`https://tusd.tusdemo.net/files/`).

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
corepack yarn workspace example-react dev
```

Then open <http://localhost:5173>.

## Run it on its own

```sh
npx degit transloadit/uppy/examples/react my-app
cd my-app
npm install
npm run dev
```

This installs the latest Uppy release from npm.

## What else it needs

- Remote sources and the Google pickers talk to a Companion server at
  `http://localhost:3020` (see [`examples/companion`](../companion)). Local
  files, webcam, screen capture and the image editor work without it.
- The Google pickers also need a client ID, API key and app ID. They are empty
  strings in `src/App.tsx`; fill them in to try the pickers.
