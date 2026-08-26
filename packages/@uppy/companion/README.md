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

Prefix an entry with `re:` to match with a regular expression instead.

Because the value is comma-separated, a pattern in a list cannot itself contain
a `,` — a `{n,m}` quantifier would be split down the middle. If the whole value
starts with `re:` it is therefore *not* split at all and is taken as one
pattern, which is the way to use a quantifier. Combine alternatives with `|`
rather than listing several patterns after a leading `re:`.

```sh
COMPANION_UPLOAD_URLS="re:^https://(?:api2-[a-z0-9]+|api2)\\.example\\.com/files/"
```

A pattern is tested against the whole URL, exactly as you wrote it. That is
expressive, but it means the pattern itself carries the security property.
Companion does not check patterns for you, and the three mistakes below are not
the kind you notice: get one wrong and uploads keep working, while your
internal network becomes reachable. Read them before writing a pattern.

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

### Restricting OAuth redirects

`server.validHosts` (`COMPANION_DOMAINS`) is the allowlist of Companion hosts
an OAuth flow may be redirected back to. A host that passes receives the
authorization code, so it is worth the same care as `uploadUrls`.

Entries are hostnames, compared literally and case-insensitively. A port is
part of the hostname here: `example.com` does not match `example.com:3020`.

```sh
COMPANION_DOMAINS="sub1.example.com,sub2.example.com"
```

As with `uploadUrls`, prefix an entry with `re:` to match with a regular
expression, and a value starting with `re:` is not split on `,`:

```sh
COMPANION_DOMAINS="re:(\\w+)\\.example\\.com"
```

Unlike `uploadUrls`, a `validHosts` pattern is **anchored for you** — it has to
match the whole hostname. A host is either in the set or it is not, so there is
nothing a partial match could usefully mean. Note that `.` still matches any
character unless you escape it, so `sub.example.com` as a pattern also admits
`subXexample.com`; write `re:sub\.example\.com`, or just use a literal entry.

### Upgrading from a version before 5.x

Both allowlists used to treat strings as regular expressions — `uploadUrls`
compiled every entry and matched it anywhere in the URL, and `validHosts`
guessed per entry by looking for regex metacharacters. Both are now literal
unless prefixed with `re:`.

If you wrote an entry as a pattern, it is now a literal value that matches
nothing, and you need to migrate it:

```diff
-COMPANION_UPLOAD_URLS="https://api2-(\\w+)\\.example\\.com/files/"
+COMPANION_UPLOAD_URLS="re:^https://api2-(\\w+)\\.example\\.com/files/"

-COMPANION_DOMAINS="(\\w+).example.com"
+COMPANION_DOMAINS="re:(\\w+)\\.example\\.com"
```

Companion does not detect this for you — such an entry is a perfectly good
literal URL or hostname as far as it can tell. It fails closed, though: the
destination or redirect is refused rather than allowed, so uploads and logins
break visibly and nothing is exposed while you notice.

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
