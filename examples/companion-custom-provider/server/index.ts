import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { styleText } from 'node:util'
import * as companion from '@uppy/companion'
import bodyParser from 'body-parser'
import type { Request, Response } from 'express'
import express from 'express'
import session from 'express-session'
import MyCustomProvider from './CustomProvider.ts'

// the ../../../packages is just to use the local version
// instead of the npm version—in a real app use `require('@uppy/companion')`
process.loadEnvFile(path.resolve(import.meta.dirname, '..', '..', '..', '.env'))

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
const companionOptions: companion.CompanionInitOptions = {
  providerOptions: {
    drive: {
      key: process.env.COMPANION_GOOGLE_KEY,
      secret: process.env.COMPANION_GOOGLE_SECRET,
    },
  },
  customProviders: {
    myunsplash: {
      config: {
        // @ts-expect-error TODO solve this type error.
        // your oauth handlers
        authorize_url: AUTHORIZE_URL,
        access_url: ACCESS_URL,
        oauth: 2,
        key: process.env.COMPANION_UNSPLASH_KEY,
        secret: process.env.COMPANION_UNSPLASH_SECRET,
      },
      // @ts-expect-error TODO solve this type error.
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

app.use(companion.app(companionOptions).app)

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
