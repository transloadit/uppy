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

### Restricting upload destinations

`uploadUrls` (`COMPANION_UPLOAD_URLS`) is the allowlist of destinations
Companion will upload to. It is the only thing standing between a caller and
your internal network, so it is mandatory in production.

Entries are matched **literally**: the origin must be identical, and the path
must match at a path boundary, so `https://uploads.example.com/files/` also
allows `https://uploads.example.com/files/<id>` (which a resumable upload
needs) but not `https://uploads.example.com/filesomething`.

```sh
COMPANION_UPLOAD_URLS="https://uploads.example.com/files/,https://other.example.com/files/"
```

#### Patterns

Prefix an entry with `re:` to match with a regular expression instead. If the
whole value starts with `re:` it is *not* split on `,`, so a `{n,m}` quantifier
is safe to use; otherwise entries are comma-separated as usual and may mix
literals and patterns.

```sh
COMPANION_UPLOAD_URLS="re:^https://(?:api2-[a-z0-9]+|api2)\\.example\\.com/files/"
```

A pattern is tested against the whole URL, exactly as you wrote it. That is
expressive, but it means the pattern itself carries the security property, and
three mistakes silently turn it into an open door to your internal network.
Companion warns about each at startup, but does not refuse to boot.

**Anchor it with `^`.** Without it a pattern matches any URL that merely
*contains* it, so an attacker appends your allowed URL to their own:

```
re:https://uploads\.example\.com/           # BAD
  ↳ allows http://169.254.169.254/latest/meta-data/?x=https://uploads.example.com/
```

**Escape `.` in the host.** An unescaped `.` matches any character, including
`/` and `@`, which lets the "host" run into somebody else's path:

```
re:^https://.*\.example\.com/               # BAD
  ↳ allows https://evil.example/x.example.com/y
```

**End the host with `/`.** An unterminated host also matches longer ones, both
by suffix and through the userinfo trick, where the real host is what follows
the `@`:

```
re:^https://[a-z0-9]+\.example\.com         # BAD
  ↳ allows https://a.example.com.evil.example/
  ↳ allows https://a.example.com@evil.example/
```

Put together, a pattern for "any subdomain of example.com, under /files/" is:

```
re:^https://[a-z0-9-]+\.example\.com/files/
```

If you configure Companion programmatically rather than through the
environment, prefer passing a real `RegExp` — or, better, list the URLs
literally and skip patterns altogether.

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
