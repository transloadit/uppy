# Uppy + Angular

An Angular app that uses the `@uppy/angular` components to render an inline
Dashboard and a Dashboard modal, with the Webcam plugin. Files upload with
`@uppy/tus` to the public Tus demo server (`https://tusd.tusdemo.net/files/`).

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
corepack yarn workspace example-angular start
```

Then open <http://localhost:4200>.

Inside this repository, `tsconfig.json` maps `@uppy/angular` to the package
source in `packages/@uppy/angular/src`, so you don’t need a build of
`@uppy/angular` itself while working on it.

## Run it on its own

```sh
npx degit transloadit/uppy/examples/angular my-app
cd my-app
```

Delete the `paths` entry for `@uppy/angular` from `compilerOptions` in
`tsconfig.json`; it points into this repository. Then:

```sh
npm install
npm start
```

This installs the latest Uppy release from npm. `npm run build` writes a
production build to `dist/`.
