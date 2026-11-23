# Uppy + Companion + Custom Provider Example

This example uses @uppy/companion with a custom example provider. This serves as
an illustration on how integrating custom providers would work: the server side
(`server/CustomProvider.ts`) lists and downloads photos from Unsplash, and the
client side (`client/MyCustomProvider.tsx`) adds it to the Dashboard next to
Google Drive. Uploads go to the public Tus demo server.

`npm start` runs Companion on port 3020 (`server/index.ts`) and the Vite dev
server for the client on port 5173.

## Configure it

Copy `.env.example` to `.env` in this folder and fill in the Unsplash
(`COMPANION_UNSPLASH_KEY`, `COMPANION_UNSPLASH_SECRET`) and Google
(`COMPANION_GOOGLE_KEY`, `COMPANION_GOOGLE_SECRET`) OAuth app credentials. These
should not be committed. The server exits if there is no `.env` file.

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
cp examples/companion-custom-provider/.env.example examples/companion-custom-provider/.env
corepack yarn workspace example-companion-custom-provider start
```

Then open <http://localhost:5173>.

## Run it on its own

Requires a Node.js version that runs TypeScript files directly (22.18 or newer).

```sh
npx degit transloadit/uppy/examples/companion-custom-provider my-app
cd my-app
npm install
cp .env.example .env
npm start
```

This installs the latest Uppy release from npm.
