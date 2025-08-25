# Uppy + Companion + Custom Provider Example

This example uses @uppy/companion with a dummy custom provider. This serves as
an illustration on how integrating custom providers would work

## Run it

**Note**: this example is using `fetch`, which is only available on Node.js 18+.

First, you want to set up your environment variable. You can copy the content of
`.env.example` and save it in a file named `.env`. You can modify in there all
the information needed for the app to work that should not be committed (Google
keys, Unsplash keys, etc.).

```sh
[ -f .env ] || cp .env.example .env
```

To run the example, from the root directory of this repo, run the following
commands:

```sh
corepack yarn install
corepack yarn build
corepack yarn workspace @uppy-example/custom-provider start
```
