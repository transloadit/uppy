const { mkdtempSync } = require('node:fs')
const os = require('node:os')
const path = require('node:path')

require('dotenv').config({
  path: path.join(__dirname, '..', '..', '..', '.env'),
})
const express = require('express')
// the ../../../packages is just to use the local version
// instead of the npm version—in a real app use `require('@uppy/companion')`
const bodyParser = require('body-parser')
const session = require('express-session')
const uppy = require('@uppy/companion')
const MyCustomProvider = require('./CustomProvider.cjs')

const app = express()

app.use(bodyParser.json())
app.use(
  session({
    secret: 'some-secret',
    resave: true,
    saveUninitialized: true,
  }),
)

// Routes
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send('Welcome to my uppy companion service')
})

// source https://unsplash.com/documentation#user-authentication
const AUTHORIZE_URL = 'https://unsplash.com/oauth/authorize'
const ACCESS_URL = 'https://unsplash.com/oauth/token'

// initialize uppy
const uppyOptions = {
  providerOptions: {
    drive: {
      key: process.env.COMPANION_GOOGLE_KEY,
      secret: process.env.COMPANION_GOOGLE_SECRET,
    },
  },
  customProviders: {
    myunsplash: {
      config: {
        // your oauth handlers
        authorize_url: AUTHORIZE_URL,
        access_url: ACCESS_URL,
        oauth: 2,
        key: process.env.COMPANION_UNSPLASH_KEY,
        secret: process.env.COMPANION_UNSPLASH_SECRET,
      },
      // you provider class/module:
      module: MyCustomProvider,
    },
  },
  server: {
    host: 'localhost:3020',
    protocol: 'http',
  },
  filePath: mkdtempSync(path.join(os.tmpdir(), 'companion-')),
  secret: 'some-secret',
  debug: true,
}

app.use(uppy.app(uppyOptions).app)

// handle 404
app.use((req, res) => {
  return res.status(404).json({ message: 'Not Found' })
})

// handle server errors
app.use((err, req, res) => {
  console.error('\x1b[31m', err.stack, '\x1b[0m')
  res.status(500).json({ message: err.message, error: err })
})

uppy.socket(app.listen(3020), uppyOptions)

console.log('Welcome to Companion!')
console.log(`Listening on http://0.0.0.0:${3020}`)
