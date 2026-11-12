import fs from 'node:fs'
import path from 'node:path'
import * as companion from '@uppy/companion'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import session from 'express-session'

process.loadEnvFile(path.resolve(import.meta.dirname, '..', '..', '.env'))

const DATA_DIR = path.join(import.meta.dirname, 'tmp')

const app = express()
const port = 3020

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(bodyParser.json())
app.use(
  session({
    secret: 'hello planet',
    saveUninitialized: false,
    resave: false,
  }),
)

const options: companion.CompanionInitOptions = {
  providerOptions: {
    drive: {
      key: process.env.COMPANION_GOOGLE_KEY,
      secret: process.env.COMPANION_GOOGLE_SECRET,
    },
  },
  s3: {
    getKey: ({ filename }) => `${crypto.randomUUID()}-${filename}`,
    key: process.env.COMPANION_AWS_KEY,
    secret: process.env.COMPANION_AWS_SECRET,
    bucket: process.env.COMPANION_AWS_BUCKET,
    region: process.env.COMPANION_AWS_REGION,
    endpoint: process.env.COMPANION_AWS_ENDPOINT,
    forcePathStyle: process.env.COMPANION_AWS_FORCE_PATH_STYLE === 'true',
  },
  server: { host: `localhost:${port}` },
  filePath: DATA_DIR,
  secret: 'blah blah',
  corsOrigins: true,
}

// Create the data directory here for the sake of the example.
fs.mkdirSync(DATA_DIR, { recursive: true })
process.on('exit', () => {
  fs.rmSync(DATA_DIR, { recursive: true, force: true })
})

const { app: companionApp } = companion.app(options)

app.use(companionApp)

const server = app.listen(port, () => {
  console.log('listening on port', port)
})

companion.socket(server, options)
