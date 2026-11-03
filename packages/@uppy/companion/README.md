# Companion

<img src="http://uppy.io/images/logos/uppy-dog-full.svg" width="120" alt="Uppy logo — a superman puppy in a pink suit" align="right">

[![Build Status](https://travis-ci.org/transloadit/uppy.svg?branch=main)](https://travis-ci.org/transloadit/uppy)

Companion is a server integration for
[Uppy](https://github.com/transloadit/uppy) file uploader.

It handles the server-to-server communication between your server and file
storage providers such as Google Drive, Dropbox, etc. **Companion is
not a target to upload files to**. For this, use a <https://tus.io> server (if
you want resumable) or your existing Apache/Nginx server (if you don’t).
[See here for full documentation](https://uppy.io/docs/companion/)

## Install

```bash
npm install @uppy/companion
```

If you don’t have a Node.js project with a `package.json` you might want to
install/run Companion globally like so:
`[sudo] npm install -g @uppy/companion@1.x` (best check the actual latest
version, and use that, so (re)installs are reproducible, and upgrades
intentional).

## Usage

companion may either be used as pluggable express app, which you plug to your
existing server, or it may also be run as a standalone server:

### Plug to an existing server

```javascript
import express from 'express'
import bodyParser from 'body-parser'
import session from 'express-session'
import companion from '@uppy/companion'

const app = express()
app.use(bodyParser.json())
app.use(session({ secret: 'some secrety secret' }))
// ...
// be sure to place this anywhere after app.use(bodyParser.json()) and app.use(session({...})
const options = {
  providerOptions: {
    drive: {
      key: 'GOOGLE_KEY',
      secret: 'GOOGLE_SECRET',
    },
  },
  server: {
    host: 'localhost:3020',
    protocol: 'http',
  },
  filePath: '/path/to/folder/',
}

const { app: companionApp } = companion.app(options)
app.use(companionApp)
```

To enable companion socket for realtime feed to the client while upload is going
on, you call the `socket` method like so.

```javascript
// ...
const server = app.listen(PORT)

// Pass the same `options` object you passed to `companion.app(options)` —
// `companion.socket` needs `options.server` to compute the external base path
// for incoming WS URLs (important behind reverse proxies).
companion.socket(server, options)
```

### Native Transloadit Storage credentials

The `transloadit-storage` provider accepts either its existing server-side `workspaces` credential
map or a `credentialsSecret`, never both. Dynamic mode uses the configured `apiEndpoint` to resolve
credentials for the immutable Workspace ID in a verified browser grant. It requires a matching
API2 File Library credential resolver, a server-only shared secret of at least 32 characters, and an
`https:` `apiEndpoint` (plain `http:` is accepted only for `localhost`).
Do not send this secret or Workspace Auth Secrets to the browser. Browser grants remain the only
client-supplied authorization, with their existing expiry, prefix and scope checks.

Dynamic credentials are refreshed by the cached S3 client’s credential provider. Enrolling another
Workspace therefore needs no Companion restart; API2 owns admission and checks it on each request.
Resolver errors fail closed, without falling back to a static map or global S3 credentials.

### Run as standalone server

Please make sure that the required env variables are set before runnning/using
companion as a standalone server.
[See](https://uppy.io/docs/companion/#Configure-Standalone).

```bash
$ companion
```

If you cloned the repo from GitHub and want to run it as a standalone server,
you may also run the following command from within its directory

```bash
npm start
```

### Deploy to heroku

Companion can also be deployed to [Heroku](https://www.heroku.com)

```sh
mkdir uppy-companion && cd uppy-companion

git init

echo 'export COMPANION_PORT=$PORT' > .profile
echo 'node_modules' > .gitignore
echo '{
  "name": "uppy-companion",
  "version": "1.0.0",
  "scripts": {
    "start": "companion"
  },
  "dependencies": {
    "@uppy/companion": "latest"
  }
}' > package.json

npm i

git add . && git commit -am 'first commit'

heroku create

git push heroku master
```

Make sure you set the required
[environment variables](https://uppy.io/docs/companion/#Configure-Standalone).

See [full documentation](https://uppy.io/docs/companion/)
