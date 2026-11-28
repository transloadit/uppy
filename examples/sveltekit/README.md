# Uppy + SvelteKit

A SvelteKit app built with the `@uppy/svelte` components: a custom dropzone,
webcam, screen capture, image editor and remote sources. Files upload with
`@uppy/tus` to the public Tus demo server (`https://tusd.tusdemo.net/files/`).

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
corepack yarn workspace example-sveltekit dev
```

Then open <http://localhost:5173>.

## Run it on its own

```sh
npx degit transloadit/uppy/examples/sveltekit my-app
cd my-app
npm install
npm run dev
```

This installs the latest Uppy release from npm. `npm run build` creates a
production build, and `npm run preview` serves it.

## What else it needs

Remote sources talk to a Companion server at `http://localhost:3020` (see
[`examples/companion`](../companion)). Local files, webcam, screen capture and
the image editor work without it.
