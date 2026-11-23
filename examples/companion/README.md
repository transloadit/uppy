# @uppy/companion example

This is a simple, lean example that combines the usage of @uppy/companion and
uppy client. `server/index.ts` mounts Companion in an Express app on port 3020;
`client/index.html` loads Uppy from the CDN and uses that Companion server; Vite
serves it on port 3000.

The provider keys in `server/index.ts` are placeholders. Replace them with your
own OAuth app credentials for the providers you want to try (Google Drive,
Dropbox, Box, S3).

Other examples (react, vue, sveltekit) expect a Companion server at
`http://localhost:3020`; this one works for that.

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
corepack yarn workspace example-companion start
```

Then open <http://localhost:3000>.

## Run it on its own

Requires a Node.js version that runs TypeScript files directly (22.18 or newer).

```sh
npx degit transloadit/uppy/examples/companion my-app
cd my-app
npm install
npm start
```

This installs the latest `@uppy/companion` release from npm.
