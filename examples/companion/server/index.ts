import { styleText } from 'node:util'
import type { CompanionInitOptions } from '@uppy/companion'
import companion from '@uppy/companion'
import bodyParser from 'body-parser'
import type { Request, Response } from 'express'
import express from 'express'
import session from 'express-session'

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
const companionOptions: CompanionInitOptions = {
  providerOptions: {
    drive: {
      key: 'your google key',
      secret: 'your google secret',
    },
    dropbox: {
      key: 'your dropbox key',
      secret: 'your dropbox secret',
    },
    box: {
      key: 'your box key',
      secret: 'your box secret',
    },
    s3: {
      key: 'your s3 key',
      secret: 'your s3 secret',
    },
  },
  corsOrigins: ['*'], // Note: this is not safe for production
  server: {
    host: 'localhost:3020',
    protocol: 'http',
  },
  filePath: './output',
  secret: 'some-secret',
}

const { app: companionApp } = companion.app(companionOptions)
app.use(companionApp)

// handle 404
app.use((req, res) => {
  return res.status(404).json({ message: 'Not Found' })
})

// handle server errors
app.use((err: Error, req: Request, res: Response) => {
  console.error(styleText('red', String(err.stack)))
  res.status(500).json({ message: err.message, error: err })
})

companion.socket(app.listen(3020), companionOptions)

console.log('Welcome to Companion!')
console.log(`Listening on http://0.0.0.0:${3020}`)
