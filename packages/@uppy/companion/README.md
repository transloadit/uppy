# Companion

<img src="http://uppy.io/images/logos/uppy-dog-full.svg" width="120" alt="Uppy logo — a superman puppy in a pink suit" align="right">

[![Build Status](https://travis-ci.org/transloadit/uppy.svg?branch=master)](https://travis-ci.org/transloadit/uppy)

Companion is a server integration for [Uppy](https://github.com/transloadit/uppy) file uploader.

It handles the server-to-server communication between your server and file storage providers such as Google Drive, Dropbox,
Instagram, etc. **Companion is not a target to upload files to**. For this, use a <https://tus.io> server (if you want resumable) or your existing Apache/Nginx server (if you don't). [See here for full documentation](https://uppy.io/docs/companion/)

## Install

```bash
npm install @uppy/companion
```

If you don't have a Node.js project with a `package.json` you might want to install/run Companion globally like so: `[sudo] npm install -g @uppy/companion@0.17.4` (best check the actual latest version, and use that, so (re)installs are reproducible, and upgrades intentional).

## Usage

companion may either be used as pluggable express app, which you plug to your already existing server, or it may simply be run as a standalone server:

### Plug to already existing server

```javascript

var express = require('express')
var bodyParser = require('body-parser')
var session = require('express-session')
var companion = require('@uppy/companion')

var app = express()
app.use(bodyParser.json())
app.use(session({secret: 'some secrety secret'}))
...
// be sure to place this anywhere after app.use(bodyParser.json()) and app.use(session({...})
const options = {
  providerOptions: {
    google: {
      key: 'GOOGLE_KEY',
      secret: 'GOOGLE_SECRET'
    }
  },
  server: {
    host: 'localhost:3020',
    protocol: 'http',
  },
  filePath: '/path/to/folder/'
}

app.use(companion.app(options))

```

To enable companion socket for realtime feed to the client while upload is going on, you call the `socket` method like so.

```javascript
...
var server = app.listen(PORT)

companion.socket(server, options)

```

### Run as standalone server
Please ensure that the required env variables are set before runnning/using companion as a standalone server. [See](https://uppy.io/docs/companion/#Configure-Standalone).

```bash
$ companion
```

If you cloned the repo from GitHub and want to run it as a standalone server, you may also run the following command from within its
directory

```bash
npm start
```

### Run as a serverless function

Companion can be deployed as a serverless function to AWS Lambda or other cloud providers through `serverless`. Check [this guide](https://serverless.com/framework/docs/getting-started/) to get started.

After you have cloned the repo go inside `examples/serverless`:
```
cd examples/serverless
```
 
You can enter your API Keys inside the `serverless.yml` file:
```
INSTAGRAM_KEY: <YOUR_INSTAGRAM_KEY>
INSTAGRAM_SECRET: <YOUR_INSTAGRAM_SECRET>
```

When you are all set install the dependencies and deploy your function:
```
npm install && sls deploy
```

### Deploy to heroku

Companion can also be deployed to [Heroku](https://www.heroku.com)
```
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
    "@uppy/companion": "^0.17.0"
  }
}' > package.json

npm i

git add . && git commit -am 'first commit'

heroku create

git push heroku master
```
Make sure you set the required [environment variables](https://uppy.io/docs/companion/#Configure-Standalone).


See [full documentation](https://uppy.io/docs/companion/)
