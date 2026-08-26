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

### Allowlists

`uploadUrls` (`COMPANION_UPLOAD_URLS`) is the allowlist of destinations
Companion uploads to; `server.validHosts` (`COMPANION_DOMAINS`) is the
allowlist of hosts an OAuth flow may be redirected back to. Both are matched
literally.

```sh
COMPANION_UPLOAD_URLS="https://uploads.example.com/files/,https://other.example.com/files/"
COMPANION_DOMAINS="sub1.example.com,sub2.example.com"
```

A `uploadUrls` entry must be an absolute URL, and matches at a path boundary,
so `https://uploads.example.com/files/` also allows the resumable upload id
appended to it but not `.../filesomething`. A `validHosts` entry is a hostname,
compared case-insensitively; a port is part of it, so `example.com` does not
match `example.com:3020`.

#### Patterns

Configuring Companion programmatically, pass a `RegExp`. Standalone config is
strings all the way down, so prefix an entry with `re:` instead. A value that
starts with `re:` is not split on `,`, which is how to use a `{n,m}`
quantifier.

```sh
COMPANION_UPLOAD_URLS="re:^https://(?:api2-[a-z0-9]+|api2)\\.example\\.com/files/"
COMPANION_DOMAINS="re:^(\\w+)\\.example\\.com$"
```

Patterns are matched as written, against the whole URL or hostname, so the
pattern itself carries the security property. Three mistakes let an attacker
choose the host, and none of them stops uploads or logins working:

```
re:https://uploads\.example\.com/     # not anchored: allows
                                      # http://169.254.169.254/?x=https://uploads.example.com/
re:^https://.*\.example\.com/         # "." spans "/" and "@": allows
                                      # https://evil.example/x.example.com/y
re:^https://[a-z0-9]+\.example\.com   # host not terminated: allows
                                      # https://a.example.com.evil.example/ and ...@evil.example/
```

Companion warns at startup about a pattern with no `^`, since that one is
never intentional, but it cannot check the others. Anchor it, keep the host
part from crossing a boundary, and end the host with `/`:

```
COMPANION_UPLOAD_URLS="re:^https://[a-z0-9-]+\\.example\\.com/files/"
COMPANION_DOMAINS="re:^(\\w+)\\.example\\.com$"
```

A `validHosts` pattern should end with `$` as well — a host is either in the
set or it is not, so there is nothing a partial match could usefully mean.

#### Upgrading from a version before 5.x

Strings used to be compiled into regular expressions — `uploadUrls` matched
anywhere in the URL, and `validHosts` guessed per entry by looking for regex
metacharacters. An entry written as a pattern is now a literal that matches
nothing, so prefix it:

```diff
-COMPANION_UPLOAD_URLS="https://api2-(\\w+)\\.example\\.com/files/"
+COMPANION_UPLOAD_URLS="re:^https://api2-(\\w+)\\.example\\.com/files/"

-COMPANION_DOMAINS="(\\w+).example.com"
+COMPANION_DOMAINS="re:^(\\w+)\\.example\\.com$"
```

Companion cannot detect this — such an entry is a valid literal URL or
hostname. It fails closed, though: uploads and logins break visibly and
nothing is exposed while you notice.

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
