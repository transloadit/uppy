## Contributing to Uppy

Fork the repository into your own account first. See the
[GitHub Help](https://help.github.com/articles/fork-a-repo/) article for
instructions.

After you have successfully forked the repository, clone it locally.

```sh
git clone https://github.com/[your-username]/uppy.git
cd uppy
```

We are using [Corepack][] to manage versions of [Yarn][]. Corepack comes
pre-installed with Node.js >=16.x, or can be installed through `npm`:

```sh
corepack -v || npm i -g corepack
corepack enable
```

[Corepack]: https://nodejs.org/api/corepack.html
[Yarn]: https://yarnpkg.com/

## Development

Install dependencies:

```bash
yarn install
```

Build all packages:

```bash
yarn build
```

### Development Commands

- `yarn dev` - Start development server at http://localhost:5174
- `yarn dev:with-companion` - Start dev server with Companion for cloud integrations
- `yarn start:companion` - Start only Companion server at http://localhost:3020
- `yarn build:watch` - Build packages in watch mode
- `yarn test` - Run tests for all packages
- `yarn test:watch` - Run tests in watch mode
- `yarn typecheck` - Run TypeScript type checking
- `yarn check` - Run Biome linting and formatting

### Headless components

When adding a new component to `@uppy/components`, you have to run `yarn migrate:components` from root
to migrate the Preact components to React, Svelte, and Vue.

This is not needed for changing existing components.

## Companion

If you’d like to work on features that the basic development version of Uppy
doesn’t support, such as Uppy integrations with Instagram/Google Drive/Facebook
etc., you need to set up your `.env` file (copy the contents of `.env.example`
and adjust them based on what you need to work on), and run:

```bash
yarn run dev:with-companion
```

Or, if you only want to run the Companion server:

```bash
yarn run start:companion
```

This would get the Companion instance running on `http://localhost:3020`. It
uses [nodemon](https://github.com/remy/nodemon) so it will automatically restart
when files are changed.

### How the Authentication and Token mechanism works

This section describes how Authentication works between Companion and Providers.
While this behaviour is the same for all Providers (Dropbox, Instagram, Google
Drive, etc.), we are going to be referring to Dropbox in place of any Provider
throughout this section.

The following steps describe the actions that take place when a user
Authenticates and Uploads from Dropbox through Companion:

- The visitor to a website with Uppy clicks `Connect to Dropbox`.
- Uppy sends a request to Companion, which in turn sends an OAuth request to
  Dropbox (Requires that OAuth credentials from Dropbox have been added to
  Companion).
- Dropbox asks the visitor to log in, and whether the Website should be allowed
  to access your files
- If the visitor agrees, Companion will receive a token from Dropbox, with which
  we can temporarily download files.
- Companion encrypts the token with a secret key and sends the encrypted token
  to Uppy (client)
- Every time the visitor clicks on a folder in Uppy, it asks Companion for the
  new list of files, with this question, the token (still encrypted by
  Companion) is sent along.
- Companion decrypts the token, requests the list of files from Dropbox and
  sends it to Uppy.
- When a file is selected for upload, Companion receives the token again
  according to this procedure, decrypts it again, and thereby downloads the file
  from Dropbox.
- As the bytes arrive, Companion uploads the bytes to the final destination
  (depending on the configuration: Apache, a Tus server, S3 bucket, etc).
- Companion reports progress to Uppy, as if it were a local upload.
- Completed!

## I18n and locales

For more information about how to contribute to translations, see
[the `@uppy/locales` contributing guide](https://uppy.io/docs/locales/#contributing-a-new-language).
