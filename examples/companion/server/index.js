const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const companion = require('@uppy/companion')

const app = express()

app.use(bodyParser.json())
app.use(
  session({
    secret: 'some-secret',
    resave: true,
    saveUninitialized: true,
  }),
)

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  next()
})

// Routes
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send('Welcome to Companion')
})

// initialize uppy
const companionOptions = {
  providerOptions: {
    drive: {
      key: 'your google key',
      secret: 'your google secret',
    },
    instagram: {
      key: 'your instagram key',
      secret: 'your instagram secret',
    },
    dropbox: {
      key: 'your dropbox key',
      secret: 'your dropbox secret',
    },
    box: {
      key: 'your box key',
      secret: 'your box secret',
    },
    // you can also add options for additional providers here
  },
  corsOrigins: ['*'], // Note: this is not safe for production
  server: {
    host: 'localhost:3020',
    protocol: 'http',
  },
  filePath: './output',
  secret: 'some-secret',
  debug: true,
}

const { app: companionApp } = companion.app(companionOptions)
app.use(companionApp)

// handle 404
app.use((req, res) => {
  return res.status(404).json({ message: 'Not Found' })
})

// handle server errors
app.use((err, req, res) => {
  console.error('\x1b[31m', err.stack, '\x1b[0m')
  res.status(500).json({ message: err.message, error: err })
})

companion.socket(app.listen(3020))

console.log('Welcome to Companion!')
console.log(`Listening on http://0.0.0.0:${3020}`)
