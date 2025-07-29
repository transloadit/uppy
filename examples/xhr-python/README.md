# Uppy + Python Example

This example uses a Python Flask server and `@uppy/xhr-upload` to upload files
to the local file system.

## Run it

To run this example, make sure you've correctly installed the **repository
root**:

```sh
corepack pnpm install
corepack pnpm build
```

That will also install the npm dependencies for this example.

Additionally, this example uses python dependencies. Move into this directory,
and install them using pip:

```sh
corepack pnpm --filter @uppy-example/python-xhr installPythonDeps
```

Then, again in the **repository root**, start this example by doing:

```sh
corepack pnpm --filter @uppy-example/python-xhr start
```
