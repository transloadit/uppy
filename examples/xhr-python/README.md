# Uppy + Python Example

This example uses a Python Flask server and `@uppy/xhr-upload` to upload files
to the local file system (the `uploads/` folder next to `server.py`).

Requires Python 3 with pip. The Python dependencies are listed in
`requirements.txt`; `npm run installPythonDeps` installs them with
`python3 -m pip`. `npm start` runs the Flask server on port 3020 next to the
Vite dev server for the client.

## Run it in this repository

From the repository root:

```sh
corepack yarn install
corepack yarn build
corepack yarn workspace example-xhr-python installPythonDeps
corepack yarn workspace example-xhr-python start
```

Then open the URL Vite prints (<http://localhost:5173> by default).

## Run it on its own

```sh
npx degit transloadit/uppy/examples/xhr-python my-app
cd my-app
npm install
npm run installPythonDeps
npm start
```

This installs the latest Uppy release from npm.
